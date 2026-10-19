# Garki Market Promotional Spaces — clickable prototype

High-fidelity front-end prototype for AICL stakeholders: a marketplace where brands book open spaces
(or roaming "mobile promotion" slots) inside Garki Market, Abuja. React + Tailwind CSS, client-side
routing, **no backend** — all data is mock data and all state lives in memory.

```bash
npm install
npm run dev        # http://127.0.0.1:5190
npm run build      # type-check + production build into dist/
```

> State is in memory by design: **refreshing the page restores the seeded demo data**, so refresh to reset between
> audiences. (Switch between the two views with the **View as: Business / AICL Admin** control in the header.)

## Live demo script (≈ 5 minutes)

1. **Landing** `/` — pitch, how-it-works, footfall stats, gallery, the two promotion types.
2. **Plan Your Promotion** `/plan` — pick a **From / To** period and a **time window** (they drive the map and
   follow you into the booking request), hover spaces for the info card, try the status / size filters (price is a
   fixed rate per sq ft); flip to **Mobile Promotion** to see the zones; toggle the table to **Calendar view**.
3. Click a green space → **Space Details** (your dates and time window are already selected) — gallery, layout, mini-map, rental history, calendar + time
   slots, sticky summary → **Request This Space**.
4. **Booking form** — your space, dates and time are filled in automatically (read-only, with a *Change* link); press *Fill demo details* (or try submitting empty to see validation) → **Submit for
   Approval** → confirmation with reference number, status, the simulated email to AICL and a **booking preview**
   of what was booked (photo, position on the market map, layout, dates, time, price). The space is now
   **amber (Pending Approval)** on the floor plan.
5. **Pay Now** (right on the confirmation screen) — card (pre-filled test card) or bank transfer → processing state →
   success, then **Go to My Bookings**. The request is now *Pending Approval* with AICL; the space stays amber.
6. Header → **View as: AICL Admin** — dashboard cards; open the paid request and **Approve** (or **Reject** — a
   reason is mandatory and the payment is refunded). Unpaid requests can't be approved yet.
7. Header → **View as: Business** → **My Bookings** shows the approval email (or the rejection reason and refund).
   Approval turns the space **red (Booked)** on the floor plan and in the bookings table.
8. **Digital passes** — one per promoter with a real QR code; **Download PDF** (single / all).
9. **Gate Scan** — scan a valid pass (green), an expired pass or an unknown QR (red).

## What is simulated

| Real life                         | In the prototype                                              |
| --------------------------------- | ------------------------------------------------------------- |
| Emails to AICL / the business     | Toasts + "simulated email" previews (modals / My Bookings)    |
| Payment gateway                   | Mock checkout with a timed processing state                   |
| QR scanner at the gate            | "Scan" buttons verify the QR payload against the pass register |
| Authentication                    | "View as: Business / AICL Admin" switch in the header         |
| Database                          | `src/data/seed.ts` + in-memory store                          |

Seed data is generated relative to **today**, so every status (Available / Pending Approval / Booked /
Unavailable), every booking state (pending, approved, rejected, paid) and a genuinely expired pass are
present on first load.

## Project layout

```
src/
  data/        spaces + zones + map geometry, seed bookings/history, constants, image catalogue
  store/       StoreProvider — the single in-memory "backend" (see below)
  lib/         availability engine, pricing/VAT, dates, pass + QR verification, PDF, validation
  components/  ui/ (buttons, pills, modal, fields…), map/ (SVG floor plan), booking/, pass/, layout/
  pages/       Landing, Plan, SpaceDetails, BookingForm, Confirmation, MyBookings,
               Admin, AdminRequest, Payment, Passes, GateScan
```

### Connecting a backend later

Every mutation goes through four functions in `src/store/StoreProvider.tsx`; swap their bodies for API calls
and the UI does not change:

| Store function    | Suggested endpoint                 |
| ----------------- | ---------------------------------- |
| `submitBooking`   | `POST /bookings`                   |
| `approveBooking`  | `POST /bookings/:ref/approve`      |
| `rejectBooking`   | `POST /bookings/:ref/reject`       |
| `payBooking`      | `POST /bookings/:ref/pay`          |

Statuses: `awaiting_payment` → `in_review` (paid) → `approved` \| `rejected` (refunded).

Reads (`bookings`, `history`, `notifications`) become queries. Availability and pricing rules live in pure
functions (`lib/availability.ts`, `lib/format.ts → priceBreakdown`) so they can be reused on the server.
Domain types are in `src/types.ts`.

## Business rules encoded in the demo

- Pricing is **per day** (₦) at one **fixed rate per sq ft** — full-day price = area × `RATE_PER_SQFT_PER_DAY` (₦300
  placeholder in `src/data/constants.ts`); there is no per-space price and no price filter. Mobile promotion is **per
  promoter per day**; 7.5 % VAT is added at checkout.
- **The price follows the chosen hours** (`src/lib/pricing.ts`): a shorter window costs proportionally less, and every
  hour inside the peak window (11:00 – 16:00) counts **1.5×** a standard hour, relative to the full day (08:00 – 18:00).
  Example, 150 sq ft: Full day ₦45,000 · Morning (8–1) ₦21,600 · Afternoon (1–6) ₦23,400 · Peak hours (11–4) ₦27,000.
  Change `PEAK_START`, `PEAK_END` and `PEAK_MULTIPLIER` in `constants.ts` to tune it. The same factor applies to
  mobile-promotion prices.
- Flow: **request → pay → AICL approves/rejects → passes**. A request holds the space from submission (amber, both while
  unpaid and while paid-but-undecided); **AICL approval** turns it red (Booked); rejection releases it and refunds the payment.
- Spaces are reserved for the full day; the chosen time window sets the hours printed on each pass.
- Mobile zones have a daily promoter capacity; a zone turns amber/red as slots are held/paid.
- Passes are issued per promoter only once AICL has approved the paid booking; the gate check validates approval and date.

## Offline use

Everything the app needs is bundled — photos live in `public/images/` (about 4.7 MB), fonts come from
`@fontsource`, and QR codes / PDFs are generated in the browser. After the first `npm install`, no network
connection is needed to run or present it.

```bash
npm run dev                     # development
npm run build && npm run preview   # production build served locally (also good for a projector laptop)
```

`dist/` uses relative paths, so it can be copied to any static web server or folder-hosted site. It must be
served over http(s) — opening `index.html` straight from disk (`file://`) is blocked by browsers for ES modules.

To swap or refresh photos, edit the manifest in `scripts/download-images.mjs` and run
`node scripts/download-images.mjs`.

## Logo

The site uses the **GSD Solutions** logo: `src/assets/logo.png` (header) and `src/assets/logo-light.png` (white lettering,
used on the dark footer), both with transparent backgrounds, plus `public/favicon.png` (the chevron mark). Replace those
three files to change the logo; the `Logo` component is in `src/components/layout/Header.tsx`.

## Credits

Market photos: Wikimedia Commons (CC BY-SA 4.0) — Anass Sedrati, Kritzolina, EsthyR, Tenisnaps, ShoT88 Studios.
Activation photos: Unsplash. Full list in `public/images/CREDITS.txt` (also credited in the app footer).
If an image file ever fails to load the app shows a branded illustration instead.
All brands, people and figures in the demo are fictional.
