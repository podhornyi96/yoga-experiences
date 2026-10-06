import type { Experience } from "@/data/experiences";
import { ExperienceDetails } from "@/components/ExperienceDetails";
import { BookingCTA } from "@/components/BookingCTA";
import { siteConfig } from "@/config/site";

export function OnlinePackagesPanel({
  experience,
}: {
  experience: Experience;
}) {
  const pricing = experience.onlinePricing;
  if (!pricing) return null;

  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sage-dark">
        Packages
      </p>
      <h2 className="mt-1 text-2xl text-forest">{experience.title}</h2>

      <ExperienceDetails experience={experience} />

      <div className="mt-6 space-y-4">
        <div className="border-t border-sand pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium text-ink">Single session</p>
            <p className="shrink-0 text-xl font-semibold text-forest">
              €{pricing.single.amount}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">{pricing.single.label}</p>
        </div>

        {pricing.packs.map((pack) => (
          <div key={pack.sessions} className="border-t border-sand pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-ink">
                {pack.sessions} practices
              </p>
              <p className="shrink-0 text-xl font-semibold text-forest">
                €{pack.amount}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              Valid {pack.validityDays} days from the first practice (
              {pack.cadence}).
            </p>
            <p className="mt-0.5 text-sm text-muted">{pack.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-sand pt-4">
        <p className="text-sm font-semibold text-forest">Terms</p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
          {pricing.policies.map((policy) => (
            <li key={policy} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay-dark" />
              <span>{policy}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <BookingCTA
          experience={experience}
          size="lg"
          className="w-full"
          stickyMobile
          message={`Hi ${siteConfig.teacher.name}! I'd like to book "${experience.title}". Could you share the next available times and packages?`}
        />
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        You&apos;ll be redirected to WhatsApp to arrange a time and payment.
      </p>
    </>
  );
}
