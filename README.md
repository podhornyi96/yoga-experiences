# Ivanna Yoga Lisbon — Yoga Experiences Website

A fast, SEO-optimized marketing site for a Lisbon-based yoga teacher selling
yoga experiences: sunrise & sunset sessions, group classes in the parks,
private 1:1 yoga, and corporate yoga for IT teams.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, exported as a
**static site** and deployed to **Cloudflare Pages**. Schedule + soft-hold APIs
run as **Pages Functions** on **D1**. Bookings still go through **WhatsApp**
(with bank transfer); **Stripe** is stubbed for later.

## Tech stack

- Next.js 16 (App Router), static export (`output: "export"`)
- TypeScript, Tailwind CSS v4
- Cloudflare Pages (static `out/`) + Pages Functions + D1
- Deployed to Cloudflare Pages (output dir: `out/`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000 (static UI only; /api/* needs pages dev)
npm run build    # static export to ./out
npm run lint
```

### Schedule API locally

```bash
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD + ADMIN_SESSION_SECRET
npm run db:migrate:local
npm run dev:pages                # serves out/ + Functions at http://localhost:8788
```

Admin UI: `http://localhost:8788/admin/` (not linked from the public nav).

### Production secrets / D1

In the Cloudflare Pages project → Settings:

1. Bind D1 database `yoga-experiences-slots` as binding name **`DB`** (see `wrangler.toml`).
2. Add secrets: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
3. Apply remote migrations once:

```bash
npm run db:migrate:remote
```

## Project structure

```
src/
  app/                 # routes (home, experiences, private, corporate, about, contact, admin)
    experiences/[slug] # dynamic experience detail pages (static-generated)
    admin/             # password-gated schedule UI (noindex, direct URL only)
    sitemap.ts         # auto-generated sitemap
    robots.ts          # robots.txt
  components/          # UI (AvailabilityBooking, BookingCTA, GroupBookingPanel, ...)
  config/site.ts       # SINGLE source of truth: contact, geo, feature flags, hold minutes
  data/experiences.ts  # all offerings (experiences / private / corporate) + pricing
  lib/schedule-api.ts  # client helpers for /api/slots and /api/holds
functions/
  api/slots.ts         # public available slots
  api/holds.ts         # 20-minute soft hold
  api/admin/*          # login + slot CRUD
  api/checkout.ts      # Stripe stub (future)
migrations/            # D1 schema
```

## Editing content

Almost everything is data-driven — no need to touch components:

- **Business info, contact, WhatsApp number, bank details, geo / Lisbon areas:**
  edit [`src/config/site.ts`](src/config/site.ts).
- **Experiences, private packages, corporate offering, prices, FAQs:**
  edit [`src/data/experiences.ts`](src/data/experiences.ts).
- **Schedule slots:** use `/admin/` (group experiences only). Several different experiences may be offered on the same day; soft hold keeps siblings available; **Mark booked** blocks the rest of that day. Private/corporate stay on-request WhatsApp.
- **Photos:** drop real images into `public/images/experiences/<slug>/` and
  update the `images` array for that item (replace the placeholder `.svg`).
- **Testimonials:** edit [`src/data/testimonials.ts`](src/data/testimonials.ts).
- **Social preview image:** `public/og.jpg` (1200×630). Change `ogImage` in `src/config/site.ts` if you replace it.

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Push this repo to GitHub.
2. In Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **Next.js (Static HTML Export)** (or "None")
   - Build command: `npm run build`
   - Build output directory: `out`
4. Deploy. Every push to the main branch redeploys automatically.

### Option B — Direct upload with Wrangler

```bash
npm run build
npx wrangler pages deploy out
```

After connecting your custom domain, update `url` in `src/config/site.ts`
(used for canonical URLs, the sitemap and structured data).

## SEO (Lisbon / local search)

Live site: `https://ivanna-yoga.com`. Canonicals, sitemap and Open Graph must
keep using this host (`src/config/site.ts` → `url`).

### Done

- Per-page titles, descriptions and `rel=canonical` (trailing slashes)
- Unique Open Graph + Twitter tags per route; default share image `public/og.jpg` (1200×630)
- `sitemap.xml` / `robots.txt` (generated from `src/app/sitemap.ts` and `src/app/robots.ts`)
- JSON-LD: `LocalBusiness`, `Service` (bookable offerings — not `Event`, no dates), `FAQPage`, `BreadcrumbList`
- One H1 per page; www → apex **301** in Cloudflare Redirect Rules
- Images compressed for the web; `/images/*` cached 1 hour (`public/_headers`)
- Sitemap submitted in [Google Search Console](https://search.google.com/search-console) for `https://ivanna-yoga.com`

### Still to do

- [ ] Wait for indexing in Search Console (hours–days). Optionally: URL Inspection → Request indexing on `/`
- [ ] Create a **Google Business Profile** (NAP consistent with `src/config/site.ts`)
- [ ] Replace placeholder testimonials in `src/data/testimonials.ts` with real quotes
- [ ] Optional: Portuguese pages / `hreflang` for “yoga Lisboa”
- [ ] Optional: `Person` schema for the teacher; drop `HealthClub` if it still feels wrong
- [ ] Optional: list on TripAdvisor / GetYourGuide
- [ ] Delete unused `public/images/me/IMG_4805.JPG` (~12 MB) if it is not needed

After replacing a photo at the **same filename**, either rename the file (cache
bust) or purge Cloudflare cache — browsers/CDN may keep `/images/*` for up to
an hour.

## Enabling online payments later

The site is structured so payments are a small, isolated change:

1. Set `paymentsEnabled: true` in [`src/config/site.ts`](src/config/site.ts).
2. Implement [`functions/api/checkout.ts`](functions/api/checkout.ts) to create
   a Stripe Checkout Session from a valid soft-hold (`holdToken` from
   `POST /api/holds`).
3. Add `STRIPE_SECRET_KEY` (and webhook secret) in the Cloudflare Pages project.
4. On `checkout.session.completed`, mark the D1 slot `booked`.
5. In [`AvailabilityBooking`](src/components/AvailabilityBooking.tsx) /
   [`BookingCTA`](src/components/BookingCTA.tsx), branch on `paymentsEnabled`
   to POST `/api/checkout` and redirect instead of opening WhatsApp.

Pricing data already carries structured `amount` / `currency` / `unit`, so no
data migration is needed.
