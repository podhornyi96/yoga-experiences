# Private / Tandem booking — product brief

Status: **implemented (v1).**  
See also: checkout full-pay, park picker, capacity buffer, confirmation email (Resend).

---

## Ops checklist after deploy

1. Apply D1 migration `0004_booking_location.sql` (`wrangler d1 migrations apply`).
2. In admin schedule, create **Private / Tandem** slots (inventory slug `private-yoga-session`).
3. Set Pages secrets for confirmation email: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Ivanna Yoga <bookings@ivanna-yoga.com>`). Optional until email is ready — checkout still works without them.
4. Smoke-test: pick park → hold → Stripe full pay → webhook → booking `paid_in_full` + email.

---

## Offer

| | Private | Tandem |
|---|---|---|
| Guests | 1 | 2 |
| Price | €45 / session | €80 / session |
| Duration | 75 min | 75 min |
| Language | English (beginner-friendly) | same |
| Mats | optional rental (existing addon) | same |

**One inventory slot type** for both. The trainer always travels to a park; the only difference is 1 vs 2 people (and mats). On checkout the guest picks 1 or 2 people → price resolves to Private or Tandem.

---

## Guest flow

```
/private
  → choose 1 or 2 people
  → choose location (photo cards of parks, or “Custom location” → WhatsApp)
  → pick a slot (next days)
  → optional mat rental
  → Stripe: pay in full
  → success page + confirmation email
```

If no suitable slot, or custom location: **WhatsApp only** (price/travel negotiated offline). Instant booking is disabled for custom locations.

---

## Locations (instant book)

| ID | Label (UI) | Official / Maps place | Maps |
|---|---|---|---|
| `estrela` | Park Estrela | Jardim da Estrela | https://www.google.com/maps/search/?api=1&query=Jardim+da+Estrela%2C+Lisbon |
| `graca` | Park Graça | Jardim da Cerca da Graça | https://www.google.com/maps/search/?api=1&query=Jardim+da+Cerca+da+Gra%C3%A7a%2C+Lisbon |
| `nacoes` | Park Nações | Parque das Nações | https://www.google.com/maps/search/?api=1&query=Parque+das+Na%C3%A7%C3%B5es%2C+Lisbon |
| `eduardo-vii` | Park Eduardo VII | Parque Eduardo VII | https://www.google.com/maps/search/?api=1&query=Parque+Eduardo+VII%2C+Lisbon |

**UI:** location step shows large photo cards (not a plain dropdown). Each card: photo, park name, one-line vibe, Maps link. After selection, slots are for that park.

**Assets (local):**

| ID | Path |
|---|---|
| `estrela` | `/images/locations/park-estrela.jpg` |
| `graca` | `/images/locations/park-graca.jpg` |
| `nacoes` | `/images/locations/park-nacoes.jpg` |
| `eduardo-vii` | `/images/locations/park-eduardo-vii.jpg` |

Photos are Wikimedia Commons (CC-licensed), not Google Maps user uploads — those stay under the photographers’ rights. Attribution in [Image credits](#image-credits).

**Custom / home / other:** WhatsApp request only.

---

## Schedule & capacity

- Admin may publish **overlapping** group experiences, private, and tandem windows on the same day/time. Guests rarely book everything; the calendar is a menu of options.
- **After a real booking (or soft-hold):** block overlapping bookable inventory with a **75 min buffer after session end**.
  - Session length: **75 min**
  - Buffer after end: **75 min**
  - Effective busy window per booking: ~**2.5 hours** from start
- Experience ↔ private/tandem must not overlap once something is held/booked.
- Typical volume: **1–3 private/tandem sessions per day** (usually 1–2). Morning group (sunrise) often leaves the rest of the day free for private.

---

## Payment

- **v1: full payment** at Stripe Checkout (not the 30% group deposit).
- Keep a clear path to switch to **deposit mode later** (config flag / payment mode on catalog entry), without rewriting the flow.
- Mat rental included in the Stripe total when selected.

---

## Cancellation & weather

| When | Policy |
|---|---|
| ≥ 24 hours before start | Full refund **or** reschedule |
| &lt; 24 hours | No refund, no reschedule |

**Reschedule:** via WhatsApp / email / other contact — **not** self-serve slot picker in v1.

**Weather (outdoor parks):** if conditions make the spot unsafe, we contact the guest to reschedule (or refund if they prefer). No promised indoor backup in v1.

---

## Confirmation email (after pay)

Must include:

- Private or Tandem, date, time, duration
- Chosen park + Maps link
- Amount paid
- Cancellation policy (≥24h / &lt;24h)
- Weather note (reschedule via contact if unsafe)
- Beginner-friendly / English
- WhatsApp (and email) for questions / reschedule

---

## Admin

- Create private-session slots (same schedule tooling as groups, extended to private inventory).
- Slot is location-agnostic inventory **or** optionally tagged to a park later; v1 can show the same open windows for any chosen park (trainer confirms exact meeting point inside the park).
- Day view should show holds/bookings across group + private so conflicts with buffer are visible.

---

## Out of scope (v1)

- Instant book for guest home / custom address
- Self-serve reschedule UI
- Indoor backup venue
- Deposit mode (flag only, not default)
- Ads primary funnel for private (organic + self-serve only)

---

## Implementation notes (for later build)

Reuse existing soft-hold → Stripe → webhook path used by group experiences, with differences:

1. Private inventory slug(s) allowed in schedule APIs (today private is WhatsApp-only / excluded from `SCHEDULED_SLUGS` / checkout catalog).
2. Checkout quote: **full pay** path (configurable deposit rate; private = `1.0`).
3. Guest count 1|2 maps to Private vs Tandem pricing; single slot type.
4. Persist chosen `locationId` on hold/booking for email + admin.
5. Capacity: enforce non-overlap + 75 min post-buffer across group and private once held/booked.
6. Fix misleading “30% deposit” copy on private detail pages until/unless deposit mode is on.
7. Terms + privacy: cancellation window, weather, analytics if Google Ads tag is added separately.

---

## Image credits

Wikimedia Commons (not Google Maps uploads — those stay under photographers’ rights).

| File | Source | Author / license |
|---|---|---|
| `park-estrela.jpg` | [Jardim da Estrela - Lissabon.JPG](https://commons.wikimedia.org/wiki/File:Jardim_da_Estrela_-_Lissabon.JPG) | Stefan Didam — CC BY-SA 3.0 |
| `park-graca.jpg` | [Jardim da Cerca da Graça (29742732152).jpg](https://commons.wikimedia.org/wiki/File:Jardim_da_Cerca_da_Gra%C3%A7a_(29742732152).jpg) | Bosc d'Anjou — CC BY 2.0 |
| `park-nacoes.jpg` | [Parque das Nações (9324817442).jpg](https://commons.wikimedia.org/wiki/File:Parque_das_Nações_(9324817442).jpg) | Manuel Menal — CC BY-SA 2.0 |
| `park-eduardo-vii.jpg` | [Lisboa Park Edwarda VII 05.jpg](https://commons.wikimedia.org/wiki/File:Lisboa_Park_Edwarda_VII_05.jpg) | Andrzej Otrębski — CC BY-SA 4.0 |

Prefer replacing with original session photos when available (stronger brand, simpler attribution).
