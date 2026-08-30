# Ivanna Yoga Lisbon — Yoga Experiences Website

A fast, SEO-optimized marketing site for a Lisbon-based yoga teacher selling
yoga experiences: sunrise & sunset sessions, group classes in the parks,
private 1:1 yoga, and corporate yoga for IT teams.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, exported as a
**static site** and deployed to **Cloudflare Pages**. No backend required.
Bookings happen via **WhatsApp**, with **bank transfer** for payment. Online
payments (Stripe) are pre-wired architecturally and can be enabled later.

## Tech stack

- Next.js 16 (App Router), static export (`output: "export"`)
- TypeScript, Tailwind CSS v4
- Deployed to Cloudflare Pages (output dir: `out/`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to ./out
npm run lint
```

## Project structure

```
src/
  app/                 # routes (home, experiences, private, corporate, about, contact)
    experiences/[slug] # dynamic experience detail pages (static-generated)
    sitemap.ts         # auto-generated sitemap
    robots.ts          # robots.txt
  components/          # UI components (Header, Footer, cards, BookingCTA, ...)
  config/site.ts       # SINGLE source of truth: contact, bank, geo, feature flags
  data/experiences.ts  # all offerings (experiences / private / corporate) + pricing
  data/testimonials.ts # reviews
  lib/structured-data.ts # JSON-LD builders (LocalBusiness, Event, Service, FAQ, Breadcrumb)
functions/api/checkout.ts # Cloudflare Pages Function stub for FUTURE payments
public/images/...      # placeholder cover art (replace with real photos)
```

## Editing content

Almost everything is data-driven — no need to touch components:

- **Business info, contact, WhatsApp number, bank details, geo / Lisbon areas:**
  edit [`src/config/site.ts`](src/config/site.ts).
- **Experiences, private packages, corporate offering, prices, FAQs:**
  edit [`src/data/experiences.ts`](src/data/experiences.ts).
- **Photos:** drop real images into `public/images/experiences/<slug>/` and
  update the `images` array for that item (replace the placeholder `.svg`).
- **Testimonials:** edit [`src/data/testimonials.ts`](src/data/testimonials.ts).
- **Social preview image:** replace `public/og.svg` with a real 1200×630
  JPG/PNG and update `ogImage` in `src/config/site.ts` (social platforms don't
  render SVG previews).

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

## SEO (optimized for Lisbon / local search)

Already implemented:

- Per-page `<title>` / meta descriptions with Lisbon geo keywords
- Open Graph + Twitter cards, `metadataBase`, canonical URLs
- `sitemap.xml` and `robots.txt`
- JSON-LD structured data: `LocalBusiness` / `SportsActivityLocation`,
  `Event` (for experiences), `Service` (private/corporate), `FAQPage`,
  `BreadcrumbList`
- Fast static pages, semantic headings, descriptive alt text

Post-launch checklist:

- [ ] Replace placeholder text, prices, photos and contact details
- [ ] Create a **Google Business Profile** for Lisbon and keep NAP consistent
- [ ] Verify the site in **Google Search Console** and submit `sitemap.xml`
- [ ] Add a real 1200×630 social/OG image
- [ ] List in relevant local directories (TripAdvisor, GetYourGuide, etc.)

## Enabling online payments later

The site is structured so payments are a small, isolated change:

1. Set `paymentsEnabled: true` in [`src/config/site.ts`](src/config/site.ts).
2. Implement [`functions/api/checkout.ts`](functions/api/checkout.ts) to create
   a Stripe Checkout Session.
3. Add `STRIPE_SECRET_KEY` as a secret in the Cloudflare Pages project.
4. In [`src/components/BookingCTA.tsx`](src/components/BookingCTA.tsx), branch on
   `paymentsEnabled` to POST to `/api/checkout` and redirect to the returned URL
   instead of opening WhatsApp.

Pricing data already carries structured `amount` / `currency` / `unit`, so no
data migration is needed.
