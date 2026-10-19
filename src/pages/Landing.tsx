import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Footprints,
  LayoutGrid,
  MapPin,
  MousePointerClick,
  QrCode,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { SPACES, ZONES } from '../data/spaces';
import { GALLERY, ACTIVATION, MARKET } from '../data/images';
import { LANDING_STATS, TIME_SLOTS } from '../data/constants';
import { spaceDayPrice, zoneDayPrice } from '../lib/pricing';
import { useStore } from '../store/StoreProvider';
import { Button } from '../components/ui/Button';
import { Photo } from '../components/ui/Photo';
import { Container, Eyebrow, SectionHeading } from '../components/ui/misc';
import { spaceStatusOn } from '../lib/availability';
import { cn, naira, num } from '../lib/format';
import { todayISO } from '../lib/dates';
import { STATUS, STATUS_ORDER } from '../lib/status';
import type { SpaceStatus } from '../types';

const STEPS = [
  { icon: MousePointerClick, title: 'Choose a space', body: 'Browse the live floor plan and pick an open space or mobile zone.' },
  { icon: LayoutGrid, title: 'Submit a request', body: 'Pick dates, add your team and tell AICL about your activity.' },
  { icon: CreditCard, title: 'Pay securely', body: 'Pay by card or bank transfer — fully refunded if AICL can’t approve.' },
  { icon: ShieldCheck, title: 'Get approved', body: 'AICL reviews every paid request, usually within one business day.' },
  { icon: QrCode, title: 'Receive passes', body: 'Each promoter gets a QR digital pass to scan at the gate.' },
];

function LiveAvailability() {
  const { bookings } = useStore();
  const today = todayISO();
  const counts = useMemo(() => {
    const c: Record<SpaceStatus, number> = { available: 0, pending: 0, booked: 0, blocked: 0 };
    for (const s of SPACES) c[spaceStatusOn(s, bookings, today)]++;
    return c;
  }, [bookings, today]);
  const bookable = SPACES.length - counts.blocked;
  return (
    <div className="w-full max-w-[340px] rounded-3xl border border-white/20 bg-white/12 p-5 text-white shadow-2xl backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
        <span className="relative flex h-2 w-2">
          <span className="pulse-ring absolute h-full w-full rounded-full bg-st-available" />
          <span className="relative h-2 w-2 rounded-full bg-st-available" />
        </span>
        Live · today
      </p>
      <p className="mt-3 font-display text-5xl font-semibold leading-none">{counts.available}</p>
      <p className="mt-1 text-sm font-medium text-white/85">spaces open to book out of {bookable}</p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/20">
        {(['booked', 'pending', 'available'] as SpaceStatus[]).map((s) => (
          <span key={s} className={STATUS[s].dot} style={{ width: `${(counts[s] / bookable) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] font-medium text-white/85">
        {STATUS_ORDER.filter((s) => s !== 'blocked').map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-sm', STATUS[s].dot)} />
            {STATUS[s].label} <b className="ml-auto text-white">{counts[s]}</b>
          </li>
        ))}
      </ul>
      <Link to="/plan" className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50">
        See the floor plan <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Footfall() {
  const max = Math.max(...LANDING_STATS.hourly.map((h) => h.v));
  return (
    <svg viewBox="0 0 400 150" className="w-full" role="img" aria-label="Typical hourly footfall, 7am to 6pm">
      {LANDING_STATS.hourly.map((h, i) => {
        const bh = (h.v / max) * 100;
        const peak = h.v >= 85;
        const x = 10 + i * 35;
        return (
          <g key={h.h}>
            <rect x={x} y={112 - bh} width="26" height={bh} rx="6" fill={peak ? '#34d399' : '#60a5fa'} opacity={peak ? 1 : 0.7} />
            <text x={x + 13} y={132} textAnchor="middle" fontSize="11" fontWeight="700" fill="#bfdbfe">
              {h.h}
            </text>
          </g>
        );
      })}
      <text x="392" y="146" textAnchor="end" fontSize="9.5" fill="#93c5fd">
        hour of day (am → pm)
      </text>
    </svg>
  );
}

export default function Landing() {
  const minSpace = Math.min(...SPACES.filter((s) => !s.blocked).flatMap((s) => TIME_SLOTS.map((t) => spaceDayPrice(s, t.id))));
  const minZone = Math.min(...ZONES.filter((z) => !z.blocked).flatMap((z) => TIME_SLOTS.map((t) => zoneDayPrice(z, t.id))));

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 -z-20">
          <Photo src={MARKET.shops} alt="Shoppers and stalls inside Garki Market, Abuja" className="h-full w-full" eager position="center 45%" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-900/25" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-brand-950/80 to-transparent" />
        <Container className="grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-[1.25fr_1fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-200 ring-1 ring-inset ring-white/20 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" /> Garki Market · Abuja · managed by AICL
            </p>
            <h1 className="font-display mt-6 text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[68px]">
              Put your brand where <span className="italic text-accent-300">Abuja shops.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100 sm:text-xl">
              Book a promotional space or send roaming promoters into Garki Market, where <b className="text-white">567 shoppers visit every day</b>.
              Pick, request, pay and go live in days, not months.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button to="/plan" variant="accent" size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
                Plan Your Promotion
              </Button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex h-14 items-center gap-2 rounded-2xl px-6 text-base font-semibold text-white ring-1 ring-inset ring-white/35 transition hover:bg-white/10"
              >
                How it works
              </button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-brand-100">
              {['Per-day pricing in ₦', 'Full refund if not approved', 'QR passes for every promoter'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-st-available" strokeWidth={3} /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up flex justify-center lg:justify-end" style={{ animationDelay: '0.15s' }}>
            <LiveAvailability />
          </div>
        </Container>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-line bg-white">
        <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-6">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-mute">Brands already promoting here</span>
          {['Kora Telecom', 'Naija Fresh Dairy', 'Sunrise Cosmetics', 'MamaGold Rice', 'Pulse Mobile', 'Halo Foods'].map((b) => (
            <span key={b} className="font-display text-lg font-semibold italic text-ink-mute/70">
              {b}
            </span>
          ))}
        </Container>
      </section>

      {/* CONCEPT */}
      <section className="py-20 lg:py-28">
        <Container className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="The concept"
              title="A marketplace for promotions inside the market"
              lead="Garki Market Promotional Spaces is a digital booking platform operated by AICL. Brands reserve open areas inside the market — gates, plazas and courtyards — for sampling, demos and activations, or deploy roaming promoters along approved routes."
            />
            <ul className="mt-8 space-y-5">
              {[
                { icon: Store, t: 'Prime real estate, real footfall', d: '20 mapped spaces from 120 to 300 sq ft, placed on the market’s busiest routes.' },
                { icon: BadgeCheck, t: 'One fixed rate per sq ft', d: 'Every space is priced the same way — size × a fixed daily rate — and you can see availability and booking history before you ask.' },
                { icon: ShieldCheck, t: 'Managed end to end by AICL', d: 'Approvals, payment, QR passes and gate checks keep the market orderly and safe.' },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">{f.t}</p>
                    <p className="text-[15px] leading-relaxed text-ink-soft">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4">
            <Photo src={MARKET.shops} alt="Shop lane in Garki Market" className="col-span-4 row-span-4 aspect-[4/3] rounded-3xl shadow-card" />
            <Photo src={ACTIVATION.sampling} alt="Product sampling stall" className="col-span-2 row-span-3 rounded-3xl shadow-card" />
            <Photo src={ACTIVATION.indoorBooth} alt="Brand booth" className="col-span-2 row-span-3 rounded-3xl shadow-card" />
            <Photo src={MARKET.intl03} alt="Garki Market street" className="col-span-4 row-span-2 rounded-3xl shadow-card" />
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop ring-1 ring-line">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-st-available-soft text-st-available-ink">
                <Users className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold leading-tight text-ink">
                {num(LANDING_STATS.dailyVisitors)}
                <span className="block text-xs font-medium text-ink-mute">visitors every day</span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-sand-100 py-20">
        <Container>
          <SectionHeading align="center" eyebrow="How it works" title="From idea to activation in five steps" />
          <ol className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <span className="absolute left-[10%] right-[10%] top-[34px] hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-accent-400 lg:block" aria-hidden />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white text-brand-700 shadow-card ring-4 ring-sand-100">
                  <s.icon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-extrabold text-white">{i + 1}</span>
                </span>
                <h3 className="mt-5 text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* STATS */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" aria-hidden />
        <Container className="relative">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow className="text-accent-300">Audience &amp; footfall</Eyebrow>
              <h2 className="font-display mt-2 max-w-lg text-3xl font-semibold leading-[1.1] sm:text-4xl">An audience that is already there, already buying</h2>
              <dl className="mt-10 grid grid-cols-2 gap-6">
                {[
                  { k: 'Daily visitors', v: num(LANDING_STATS.dailyVisitors) },
                  { k: 'Shops & stalls', v: `${num(LANDING_STATS.shops)}+` },
                  { k: 'Peak hours', v: LANDING_STATS.peakHours },
                  { k: 'Friday peak', v: num(LANDING_STATS.fridayPeak) },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl bg-white/8 p-5 ring-1 ring-inset ring-white/15">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-brand-200">{s.k}</dt>
                    <dd className="font-display mt-1.5 text-3xl font-semibold sm:text-[34px]">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl bg-white/8 p-6 ring-1 ring-inset ring-white/15">
                <h3 className="text-sm font-bold">Visitor profile</h3>
                <ul className="mt-4 space-y-3.5">
                  {LANDING_STATS.profile.map((p) => (
                    <li key={p.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-100">{p.label}</span>
                        <b>{p.value}%</b>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-300" style={{ width: `${p.value}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-white/8 p-6 ring-1 ring-inset ring-white/15">
                <h3 className="text-sm font-bold">Typical hourly footfall</h3>
                <p className="text-xs text-brand-200">Open {LANDING_STATS.peakHours} · green bars = busiest hours</p>
                <div className="mt-3">
                  <Footfall />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-xs text-brand-300">Figures shown are indicative demo data for this prototype.</p>
        </Container>
      </section>

      {/* PROMOTION TYPES */}
      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading align="center" eyebrow="Two ways to promote" title="Choose the format that fits your campaign" lead="Fixed location or on the move — both are booked, approved and paid for in one place." />
          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {[
              {
                id: 'space',
                icon: Store,
                title: 'Rent a Promotional Space',
                body: 'A fixed bay for your booth, kiosk, display, demo or sampling stand — placed on a route your shoppers already walk.',
                bullets: ['Booth, kiosk, display or demo table', '120 – 300 sq ft, power on request', 'Reserved for the full day'],
                from: `${naira(minSpace)} / day`,
                img: ACTIVATION.indoorBooth,
                cta: 'Choose a space',
              },
              {
                id: 'mobile',
                icon: Footprints,
                title: 'Mobile Promotion',
                body: 'Brand ambassadors walk designated zones handing out flyers and samples — no fixed space, maximum reach.',
                bullets: ['Flyers, samples and sign-ups', '3 designated zones along the main routes', 'Priced per promoter, per day'],
                from: `${naira(minZone)} / promoter / day`,
                img: ACTIVATION.crowdStreet,
                cta: 'Plan mobile promotion',
              },
            ].map((t) => (
              <article key={t.id} className="group overflow-hidden rounded-[28px] border border-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop">
                <div className="relative">
                  <Photo src={t.img} alt={t.title} className="aspect-[16/9]" imgClassName="transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-lg">
                    <t.icon className="h-6 w-6" />
                  </span>
                  <span className="absolute bottom-4 right-5 rounded-full bg-accent-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">From {t.from}</span>
                </div>
                <div className="p-7">
                  <h3 className="font-display text-2xl font-semibold text-ink">{t.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{t.body}</p>
                  <ul className="mt-5 space-y-2">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                        <Check className="h-4 w-4 text-st-available" strokeWidth={3} /> {b}
                      </li>
                    ))}
                  </ul>
                  <Button to={`/plan?type=${t.id}`} variant="primary" size="lg" className="mt-7" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t.cta}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* GALLERY */}
      <section className="bg-sand-100 py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Proof it works" title="Previous promotions at Garki Market" />
            <p className="max-w-xs text-sm text-ink-mute">Sample activations by brands using the platform (illustrative).</p>
          </div>
          <div className="mt-10 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4">
            {GALLERY.map((g, i) => (
              <figure key={g.brand + i} className={cn('group relative overflow-hidden rounded-3xl shadow-card', g.tall ? 'row-span-2' : '', i === 0 ? 'md:col-span-1' : '')}>
                <Photo src={g.src} alt={`${g.brand} — ${g.activity}`} className="h-full w-full" imgClassName="transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-sm font-bold leading-tight">{g.brand}</p>
                  <p className="text-xs text-brand-100">
                    {g.activity} · {g.when}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* CLOSING CTA */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 py-20 text-white">
        <div className="absolute -left-20 top-0 -z-10 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl" aria-hidden />
        <Container className="text-center">
          <h2 className="font-display mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl">Ready to meet 567 shoppers every day?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">See what's open this week, request your dates and get your team's passes — all online.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button to="/plan" variant="accent" size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
              Plan Your Promotion
            </Button>
            <Link to="/plan?type=mobile" className="inline-flex h-14 items-center rounded-2xl px-6 text-base font-semibold text-white ring-1 ring-inset ring-white/35 transition hover:bg-white/10">
              Explore mobile promotion
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
