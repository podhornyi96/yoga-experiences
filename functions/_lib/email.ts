/**
 * Booking confirmation email (Resend).
 * Set RESEND_API_KEY + EMAIL_FROM (e.g. bookings@ivanna-yoga.com) in Pages env.
 * If unset, send is a no-op so checkout still succeeds.
 */

import type { BookingRow } from "./bookings";

const PRIVATE_LOCATIONS: Record<
  string,
  { label: string; mapsUrl: string }
> = {
  estrela: {
    label: "Park Estrela (Jardim da Estrela)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jardim+da+Estrela%2C+Lisbon",
  },
  graca: {
    label: "Park Graça (Jardim da Cerca da Graça)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jardim+da+Cerca+da+Gra%C3%A7a%2C+Lisbon",
  },
  nacoes: {
    label: "Park Nações (Parque das Nações)",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Parque+das+Na%C3%A7%C3%B5es%2C+Lisbon",
  },
  "eduardo-vii": {
    label: "Park Eduardo VII",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Parque+Eduardo+VII%2C+Lisbon",
  },
};

/** Titles / duration / meeting point for confirmation emails. */
const EXPERIENCE_EMAIL: Record<
  string,
  {
    title: string;
    duration: string;
    locationLabel?: string;
    locationUrl?: string;
  }
> = {
  "sunrise-yoga-lisbon": {
    title: "Sunrise Yoga",
    duration: "60 minutes",
    locationLabel: "Largo Portas do Sol",
    locationUrl: "https://maps.app.goo.gl/NyVbTeYwjc7KskRX8?g_st=ic",
  },
  "sunset-yoga-ocean": {
    title: "Sunset Yoga by the Ocean",
    duration: "60 minutes",
    locationLabel: "Praia das Avencas (Parede)",
    locationUrl: "https://maps.app.goo.gl/C7LJKA8XEhHEnFdg8?g_st=ic",
  },
  "yoga-cascais-wooden-house": {
    title: "Wooden House Yoga in Cascais",
    duration: "2 hours",
    locationLabel: "Cascais (exact meeting point on WhatsApp)",
  },
  "yoga-sintra-forest": {
    title: "Yoga in Sintra Forest",
    duration: "2.5 hours",
    locationLabel: "Sintra (exact meeting point on WhatsApp)",
  },
  "private-yoga-session": {
    title: "Private Yoga Session",
    duration: "75 minutes",
  },
};

export type EmailEnv = {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
  WHATSAPP?: string;
  CONTACT_EMAIL?: string;
  /** Teacher inbox for new-booking alerts. Defaults to CONTACT_EMAIL. */
  BOOKING_NOTIFY_EMAIL?: string;
};

function formatSlotLabel(startsAt: string): string {
  const [datePart, timePart = ""] = startsAt.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return startsAt;
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  }).format(utc);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(utc);
  const time = timePart.slice(0, 5);
  return `${weekday}, ${d} ${month} at ${time}`;
}

function money(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

function sessionMeta(booking: BookingRow) {
  const base = EXPERIENCE_EMAIL[booking.experience_slug];
  if (booking.experience_slug === "private-yoga-session") {
    const park = booking.location_id
      ? PRIVATE_LOCATIONS[booking.location_id]
      : null;
    return {
      title: booking.people >= 2 ? "Tandem Yoga" : "Private Yoga Session",
      duration: "75 minutes",
      locationLabel: park?.label,
      locationUrl: park?.mapsUrl,
    };
  }
  if (base) return base;
  return {
    title: booking.experience_slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    duration: "about 75 minutes",
  };
}

export function buildBookingConfirmationEmail(
  booking: BookingRow,
  env: EmailEnv,
): { subject: string; html: string; text: string } | null {
  const to = booking.guest_email?.trim();
  if (!to) return null;

  const meta = sessionMeta(booking);
  const when = formatSlotLabel(booking.starts_at);
  const fullPay =
    booking.payment_status === "paid_in_full" || booking.remaining_eur <= 0;
  const site = (env.SITE_URL ?? "https://ivanna-yoga.com").replace(/\/$/, "");
  const wa = env.WHATSAPP ?? "351964275367";
  const contactEmail = env.CONTACT_EMAIL ?? "ivannapylypchuk@gmail.com";
  const waLink = `https://wa.me/${wa}`;

  const subject = fullPay
    ? `Booking confirmed — ${meta.title}`
    : `Deposit received — ${meta.title}`;

  const locationBlock =
    meta.locationLabel && meta.locationUrl
      ? `Location: ${meta.locationLabel}\nMaps: ${meta.locationUrl}\n`
      : meta.locationLabel
        ? `Location: ${meta.locationLabel}\n`
        : "";

  const policy = fullPay
    ? `Cancellation: free full refund or reschedule with at least 24 hours' notice (message us on WhatsApp or email). Less than 24 hours: no refund or reschedule.\n\nWeather: if outdoor conditions make the spot unsafe, we'll contact you to reschedule (or refund if you prefer).`
    : `Your deposit is non-refundable. Reschedule free with at least 48 hours' notice — message us on WhatsApp.`;

  const text = [
    `Hi${booking.guest_name ? ` ${booking.guest_name.split(" ")[0]}` : ""},`,
    ``,
    fullPay
      ? `Your ${meta.title} is booked and paid in full.`
      : `We've received your deposit for ${meta.title}.`,
    ``,
    `When: ${when} (Lisbon time)`,
    `Duration: ${meta.duration}`,
    locationBlock.trimEnd(),
    `Guests: ${booking.people}`,
    booking.mats > 0 ? `Yoga mats: ${booking.mats}` : null,
    `Paid: ${money(booking.deposit_eur)}${fullPay ? "" : ` of ${money(booking.total_eur)} total`}`,
    !fullPay ? `Remaining: ${money(booking.remaining_eur)} (due later)` : null,
    ``,
    `Sessions are beginner-friendly and taught in English.`,
    ``,
    policy,
    ``,
    `Questions or reschedule: WhatsApp ${waLink} or ${contactEmail}`,
    `Terms: ${site}/terms/`,
    ``,
    `— Ivanna Yoga Lisbon`,
  ]
    .filter((line) => line != null)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a2e1a; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hi${booking.guest_name ? ` ${escapeHtml(booking.guest_name.split(" ")[0])}` : ""},</p>
  <p>${
    fullPay
      ? `Your <strong>${escapeHtml(meta.title)}</strong> is booked and paid in full.`
      : `We've received your deposit for <strong>${escapeHtml(meta.title)}</strong>.`
  }</p>
  <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 6px 0; color: #5c6b5c;">When</td><td style="padding: 6px 0;"><strong>${escapeHtml(when)}</strong> (Lisbon time)</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Duration</td><td style="padding: 6px 0;">${escapeHtml(meta.duration)}</td></tr>
    ${
      meta.locationLabel
        ? `<tr><td style="padding: 6px 0; color: #5c6b5c;">Location</td><td style="padding: 6px 0;">${
            meta.locationUrl
              ? `<a href="${escapeHtml(meta.locationUrl)}">${escapeHtml(meta.locationLabel)}</a>`
              : escapeHtml(meta.locationLabel)
          }</td></tr>`
        : ""
    }
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Guests</td><td style="padding: 6px 0;">${booking.people}</td></tr>
    ${
      booking.mats > 0
        ? `<tr><td style="padding: 6px 0; color: #5c6b5c;">Yoga mats</td><td style="padding: 6px 0;">${booking.mats}</td></tr>`
        : ""
    }
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Paid</td><td style="padding: 6px 0;">${money(booking.deposit_eur)}${fullPay ? "" : ` of ${money(booking.total_eur)}`}</td></tr>
  </table>
  <p style="font-size: 14px; color: #5c6b5c;">Sessions are beginner-friendly and taught in English.</p>
  <p style="font-size: 14px;">${escapeHtml(policy).replace(/\n\n/g, "</p><p style=\"font-size: 14px;\">").replace(/\n/g, "<br/>")}</p>
  <p style="font-size: 14px;">Questions or reschedule: <a href="${waLink}">WhatsApp</a> or <a href="mailto:${contactEmail}">${contactEmail}</a></p>
  <p style="font-size: 13px; color: #5c6b5c;"><a href="${site}/terms/">Terms of booking</a></p>
  <p>— Ivanna Yoga Lisbon</p>
</body>
</html>`.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resendCredentials(env: EmailEnv):
  | { ok: true; apiKey: string; from: string }
  | { ok: false; reason: string } {
  const apiKey = env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const from = env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey || !from) {
    return { ok: false, reason: "email_not_configured" };
  }
  if (!/@/.test(from)) {
    return {
      ok: false,
      reason:
        "EMAIL_FROM must look like 'Ivanna Yoga <bookings@ivanna-yoga.com>'",
    };
  }
  return { ok: true, apiKey, from };
}

function teacherNotifyAddress(env: EmailEnv): string {
  return (
    env.BOOKING_NOTIFY_EMAIL?.trim() ||
    env.CONTACT_EMAIL?.trim() ||
    "ivannapylypchuk@gmail.com"
  );
}

function buildTeacherNotifyEmail(
  booking: BookingRow,
  env: EmailEnv,
): { subject: string; html: string; text: string } {
  const meta = sessionMeta(booking);
  const when = formatSlotLabel(booking.starts_at);
  const fullPay =
    booking.payment_status === "paid_in_full" || booking.remaining_eur <= 0;
  const site = (env.SITE_URL ?? "https://ivanna-yoga.com").replace(/\/$/, "");
  const adminUrl = `${site}/admin/bookings/detail/?id=${encodeURIComponent(booking.id)}`;

  const subject = `New booking — ${meta.title} · ${when}`;

  const text = [
    `New booking paid${fullPay ? " in full" : " (deposit)"}.`,
    ``,
    `Experience: ${meta.title}`,
    `When: ${when} (Lisbon time)`,
    `Duration: ${meta.duration}`,
    meta.locationLabel ? `Location: ${meta.locationLabel}` : null,
    meta.locationUrl ? `Maps: ${meta.locationUrl}` : null,
    `Guests: ${booking.people}`,
    booking.mats > 0 ? `Mats: ${booking.mats}` : null,
    `Total: ${money(booking.total_eur)}`,
    `Paid now: ${money(booking.deposit_eur)}`,
    !fullPay ? `Remaining: ${money(booking.remaining_eur)}` : null,
    ``,
    `Guest: ${booking.guest_name || "—"}`,
    `Email: ${booking.guest_email || "—"}`,
    `Phone: ${booking.guest_phone || "—"}`,
    ``,
    `Admin: ${adminUrl}`,
  ]
    .filter((line) => line != null)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a2e1a; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p><strong>New booking</strong> — ${fullPay ? "paid in full" : "deposit paid"}.</p>
  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Experience</td><td style="padding: 6px 0;">${escapeHtml(meta.title)}</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">When</td><td style="padding: 6px 0;"><strong>${escapeHtml(when)}</strong> (Lisbon time)</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Duration</td><td style="padding: 6px 0;">${escapeHtml(meta.duration)}</td></tr>
    ${
      meta.locationLabel
        ? `<tr><td style="padding: 6px 0; color: #5c6b5c;">Location</td><td style="padding: 6px 0;">${
            meta.locationUrl
              ? `<a href="${escapeHtml(meta.locationUrl)}">${escapeHtml(meta.locationLabel)}</a>`
              : escapeHtml(meta.locationLabel)
          }</td></tr>`
        : ""
    }
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Guests</td><td style="padding: 6px 0;">${booking.people}</td></tr>
    ${
      booking.mats > 0
        ? `<tr><td style="padding: 6px 0; color: #5c6b5c;">Mats</td><td style="padding: 6px 0;">${booking.mats}</td></tr>`
        : ""
    }
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Paid</td><td style="padding: 6px 0;">${money(booking.deposit_eur)}${fullPay ? "" : ` of ${money(booking.total_eur)}`}</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Guest</td><td style="padding: 6px 0;">${escapeHtml(booking.guest_name || "—")}</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Email</td><td style="padding: 6px 0;">${
      booking.guest_email
        ? `<a href="mailto:${escapeHtml(booking.guest_email)}">${escapeHtml(booking.guest_email)}</a>`
        : "—"
    }</td></tr>
    <tr><td style="padding: 6px 0; color: #5c6b5c;">Phone</td><td style="padding: 6px 0;">${escapeHtml(booking.guest_phone || "—")}</td></tr>
  </table>
  <p><a href="${escapeHtml(adminUrl)}">Open in admin</a></p>
</body>
</html>`.trim();

  return { subject, html, text };
}

async function sendResendEmail(
  env: EmailEnv,
  message: { to: string; subject: string; html: string; text: string },
): Promise<{ sent: boolean; reason?: string }> {
  const creds = resendCredentials(env);
  if (!creds.ok) {
    console.warn("[email] skipped", { reason: creds.reason });
    return { sent: false, reason: creds.reason };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: creds.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const reason = `resend_${res.status}:${body.slice(0, 200)}`;
      console.warn("[email] resend failed", {
        to: message.to,
        from: creds.from,
        reason,
      });
      return { sent: false, reason };
    }
    console.log("[email] sent", { to: message.to });
    return { sent: true };
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "send_failed";
    console.warn("[email] exception", { to: message.to, message: messageText });
    return { sent: false, reason: messageText };
  }
}

export async function sendBookingConfirmation(
  booking: BookingRow,
  env: EmailEnv,
  options?: { notifyTeacher?: boolean },
): Promise<{ sent: boolean; reason?: string; teacherNotified?: boolean }> {
  const payload = buildBookingConfirmationEmail(booking, env);
  if (!payload) return { sent: false, reason: "no_guest_email" };

  const to = booking.guest_email!.trim();
  const guest = await sendResendEmail(env, {
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  if (!guest.sent) return guest;

  let teacherNotified = false;
  if (options?.notifyTeacher) {
    const teacherTo = teacherNotifyAddress(env);
    // Don't email the teacher twice if they booked themselves.
    if (teacherTo.toLowerCase() !== to.toLowerCase()) {
      const teacherPayload = buildTeacherNotifyEmail(booking, env);
      const teacher = await sendResendEmail(env, {
        to: teacherTo,
        subject: teacherPayload.subject,
        html: teacherPayload.html,
        text: teacherPayload.text,
      });
      teacherNotified = teacher.sent;
      if (!teacher.sent) {
        console.warn("[email] teacher notify failed", teacher);
      }
    }
  }

  return { sent: true, teacherNotified };
}
