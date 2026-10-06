# Private / Tandem booking — product brief

Status: **implemented** (single-session Stripe deposit + Intro packs via WhatsApp).

Source of truth for guest copy: `src/lib/booking-policy.ts`, `src/app/terms/page.tsx`, catalog in `src/data/experiences.ts`.

---

## Ops checklist after deploy

1. Apply D1 migrations through `0004_booking_location.sql` (and later as needed).
2. In admin schedule, create **Private / Tandem** slots (inventory slug `private-yoga-session`).
3. Set Pages secrets for confirmation email: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Ivanna Yoga <bookings@ivanna-yoga.com>`). Optional until email is ready — checkout still works without them.
4. Smoke-test single session: pick park → hold → Stripe **30% deposit** → webhook → booking `deposit_paid` + email.
5. Smoke-test Intro pack CTA: detail page → WhatsApp prefill for Intro pack (no Stripe).

---

## Offer — single session

| | Private | Tandem |
|---|---|---|
| Guests | 1 | 2 |
| Price | €45 / session | €80 / session |
| Duration | 75 min | 75 min |
| Language | English (beginner-friendly) | same |
| Mats | optional rental (€5) | same |
| Payment | 30% non-refundable deposit online; balance later | same |

**One inventory slot type** for both (`private-yoga-session`). Party size 1 → Private, 2 → Tandem. Deposit rate: `PRIVATE_DEPOSIT_RATE` (0.3) in `src/lib/group-pricing.ts`.

---

## Offer — Intro pack (WhatsApp only)

One-time promotional packs on Private / Tandem detail pages (`introPack` in catalog + `IntroPackPanel`).

| | Private Intro pack | Tandem Intro pack |
|---|---|---|
| Price | €100 / 3 practices | €150 / 3 practices (for two) |
| Vs singles | €135 (€45×3) — save €35 | €240 (€80×3) — save €90 |
| Validity | 21 days from the first practice | same |
| Once-only | Yes | Yes |
| Booking | WhatsApp: agree schedule, then pay | same |

**Pack payment options (ops, arranged on WhatsApp):**
- Full payment after the first practice, or
- 30% non-refundable deposit + balance on the day

**Pack reschedule:** promotional — no guest-initiated reschedule; only if the teacher initiates. (Single sessions still allow free reschedule with ≥ 48 hours’ notice.)

Guest-facing EN policies: `PRIVATE_INTRO_PACK_POLICIES` in `src/data/experiences.ts`.

---

## Guest flow — single session

```
/private
  → Private or Tandem detail
  → choose location (photo cards of parks, or “Custom location” → WhatsApp)
  → pick a slot
  → optional mat rental
  → Stripe: 30% deposit
  → success page + confirmation email (status deposit_paid)
```

If no suitable slot, or custom location: **WhatsApp only**. Instant booking is disabled for custom locations.

## Guest flow — Intro pack

```
Private / Tandem detail
  → Intro pack block (price + savings + terms)
  → WhatsApp CTA
  → agree day / time / place for the pack
  → payment (full after first practice, or 30% + balance on the day)
```

No Stripe pack checkout and no credit ledger in D1 — remaining sessions tracked manually by the teacher.

---

## Locations (instant book)

| ID | Label (UI) | Official / Maps place | Maps |
|---|---|---|---|
| `estrela` | Park Estrela | Jardim da Estrela | https://www.google.com/maps/search/?api=1&query=Jardim+da+Estrela%2C+Lisbon |
| `graca` | Park Graça | Jardim da Cerca da Graça | https://www.google.com/maps/search/?api=1&query=Jardim+da+Cerca+da+Gra%C3%A7a%2C+Lisbon |
| `nacoes` | Park Nações | Parque das Nações | https://www.google.com/maps/search/?api=1&query=Parque+das+Na%C3%A7%C3%B5es%2C+Lisbon |
| `eduardo-vii` | Park Eduardo VII | Parque Eduardo VII | https://www.google.com/maps/search/?api=1&query=Parque+Eduardo+VII%2C+Lisbon |

**UI:** location step shows large photo cards. Each card: photo, park name, one-line vibe, Maps link.

**Assets (local):**

| ID | Path |
|---|---|
| `estrela` | `/images/locations/park-estrela.jpg` |
| `graca` | `/images/locations/park-graca.jpg` |
| `nacoes` | `/images/locations/park-nacoes.jpg` |
| `eduardo-vii` | `/images/locations/park-eduardo-vii.jpg` |

Photos are Wikimedia Commons (CC-licensed). Attribution in [Image credits](#image-credits).

**Custom / home / other:** WhatsApp request only.

---

## Schedule & capacity

- Admin may publish **overlapping** group experiences, private, and tandem windows on the same day/time.
- **After a real booking (or soft-hold):** block overlapping bookable inventory with a **75 min buffer after session end**.
  - Session length: **75 min**
  - Buffer after end: **75 min**
  - Effective busy window per booking: ~**2.5 hours** from start
- Experience ↔ private/tandem must not overlap once something is held/booked.
- Typical volume: **1–3 private/tandem sessions per day** (usually 1–2).

---

## Payment (single session)

- **30% non-refundable deposit** at Stripe Checkout (`PRIVATE_DEPOSIT_RATE`).
- Balance due later (on the day / as agreed).
- Mat rental included in the Stripe total when selected.
- Booking `paymentStatus`: typically `deposit_paid` until marked paid in admin.

---

## Cancellation & weather (single session)

| | Rule |
|---|---|
| Deposit / online payment | Non-refundable |
| Reschedule | Free with ≥ **48 hours’** notice (WhatsApp) |
| &lt; 48 hours or no-show | Payment forfeited |

Guest copy: `DEPOSIT_POLICY_SHORT` / FAQ in `src/lib/booking-policy.ts`. Terms page covers Private/Tandem the same as Sunset deposit bookings.

**Weather (outdoor parks):** if conditions make the spot unsafe, we contact the guest to reschedule (or refund the deposit if they prefer). No promised indoor backup.

**Intro packs:** see pack terms above (no guest reschedule).

---

## Confirmation email (after deposit)

Must include:

- Private or Tandem, date, time, duration
- Chosen park + Maps link
- Amount paid (deposit) + note that balance is due later
- Deposit / reschedule policy (48h)
- Weather note
- Beginner-friendly / English
- WhatsApp (and email) for questions / reschedule

---

## Admin

- Create private-session slots (same schedule tooling as groups; inventory slug `private-yoga-session`).
- Day view should show holds/bookings across group + private so conflicts with buffer are visible.
- Intro pack purchases are **not** in D1 — handled offline via WhatsApp.

---

## Out of scope

- Instant book for guest home / custom address
- Self-serve reschedule UI
- Indoor backup venue
- Stripe checkout for Intro packs / credit ledger in D1
- Auto-enforcement of once-only Intro pack (ops via WhatsApp)

---

## Image credits

Wikimedia Commons (not Google Maps uploads — those stay under the photographers’ rights).

| File | Source | Author / license |
|---|---|---|
| `park-estrela.jpg` | [Jardim da Estrela - Lissabon.JPG](https://commons.wikimedia.org/wiki/File:Jardim_da_Estrela_-_Lissabon.JPG) | Stefan Didam — CC BY-SA 3.0 |
| `park-graca.jpg` | [Jardim da Cerca da Graça (29742732152).jpg](https://commons.wikimedia.org/wiki/File:Jardim_da_Cerca_da_Gra%C3%A7a_(29742732152).jpg) | Bosc d'Anjou — CC BY 2.0 |
| `park-nacoes.jpg` | [Parque das Nações (9324817442).jpg](https://commons.wikimedia.org/wiki/File:Parque_das_Nações_(9324817442).jpg) | Manuel Menal — CC BY-SA 2.0 |
| `park-eduardo-vii.jpg` | [Lisboa Park Edwarda VII 05.jpg](https://commons.wikimedia.org/wiki/File:Lisboa_Park_Edwarda_VII_05.jpg) | Andrzej Otrębski — CC BY-SA 4.0 |

Prefer replacing with original session photos when available (stronger brand, simpler attribution).
