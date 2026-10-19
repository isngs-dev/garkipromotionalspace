import { useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';
import type { Booking, MobileZone, Space, SpaceStatus, TimeSlotId } from '../../types';
import { RATE_PER_SQFT_PER_DAY, slotById } from '../../data/constants';
import { slotFactor, spaceDayPrice, zoneDayPrice } from '../../lib/pricing';
import { SPACES, ZONES } from '../../data/spaces';
import { COMPOUND, GATES, MAP_H, MAP_W, PARKING, PLAZA, SHOP_BLOCKS, TREES, WALKWAY_H, WALKWAY_V } from '../../data/mapGeometry';
import { nextAvailableDate, nextZoneAvailableDate, spaceStatusOverRange, zoneRemainingForRange, zoneStatusOverRange } from '../../lib/availability';
import { fmtShort } from '../../lib/dates';
import { naira, num } from '../../lib/format';
import { STATUS } from '../../lib/status';
import { StatusPill } from '../ui/StatusPill';
import { cn } from '../../lib/format';
import { MousePointerClick, Lock } from 'lucide-react';

const box = (m: { x: number; y: number; w: number; h: number }) => ({ x: m.x, y: m.y, width: m.w, height: m.h });

type Hover =
  | { kind: 'space'; id: string; x: number; y: number }
  | { kind: 'zone'; id: string; x: number; y: number }
  | null;

interface Props {
  mode: 'space' | 'mobile';
  /** First day of the chosen period; statuses are computed across date → endDate. */
  date: string;
  endDate?: string;
  /** Time window — prices on the map follow it. */
  slot?: TimeSlotId;
  bookings: Booking[];
  /** Spaces failing this predicate are dimmed (filters). */
  matches?: (space: Space, status: SpaceStatus) => boolean;
  selectedZoneId?: string | null;
  onSelectZone?: (zone: MobileZone) => void;
  onSpaceClick?: (space: Space) => void;
  onUnavailableClick?: (space: Space, status: SpaceStatus) => void;
  /** Mini map: static, labelled only for the highlighted space. */
  highlightId?: string;
  /** Mini map for a mobile booking: outline this zone. */
  highlightZoneId?: string;
  mini?: boolean;
  className?: string;
}

export function MarketMap({
  mode,
  date,
  endDate: endDateProp,
  slot = 'full',
  bookings,
  matches,
  selectedZoneId,
  onSelectZone,
  onSpaceClick,
  onUnavailableClick,
  highlightId,
  highlightZoneId,
  mini,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);

  const endDate = endDateProp && endDateProp >= date ? endDateProp : date;

  const spaceStatus = useMemo(() => {
    const m = new Map<string, SpaceStatus>();
    for (const s of SPACES) m.set(s.id, spaceStatusOverRange(s, bookings, date, endDate));
    return m;
  }, [bookings, date, endDate]);

  const zoneStatus = useMemo(() => {
    const m = new Map<string, SpaceStatus>();
    for (const z of ZONES) m.set(z.id, zoneStatusOverRange(z, bookings, date, endDate));
    return m;
  }, [bookings, date, endDate]);

  const placePointer = (e: PointerEvent<SVGGElement>, kind: 'space' | 'zone', id: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    setHover({ kind, id, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const placeFocus = (e: FocusEvent<SVGGElement>, kind: 'space' | 'zone', id: string) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const t = e.currentTarget.getBoundingClientRect();
    setHover({ kind, id, x: t.left + t.width / 2 - r.left, y: t.top + t.height / 2 - r.top });
  };

  const clickSpace = (s: Space) => {
    const st = spaceStatus.get(s.id)!;
    if (st === 'available') onSpaceClick?.(s);
    else onUnavailableClick?.(s, st);
  };

  const interactive = !mini;

  return (
    <div ref={wrapRef} className={cn('relative select-none', className)} onPointerLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Interactive floor plan of Garki Market showing promotional spaces by status"
      >
        <defs>
          <pattern id="gm-shops" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#d6dbe4" />
            <path d="M0 0V20" stroke="#bcc3d1" strokeWidth="1.6" />
            <path d="M0 10H20" stroke="#c9cfda" strokeWidth="1" />
          </pattern>
          <pattern id="gm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#e5e9ef" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#a3afbf" strokeWidth="2.4" />
          </pattern>
          <pattern id="gm-zone-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="9" height="9" fill="#e5e9ef" fillOpacity="0.85" />
            <line x1="0" y1="0" x2="0" y2="9" stroke="#94a3b8" strokeWidth="2.6" />
          </pattern>
          <filter id="gm-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f1f3d" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* Ground */}
        <rect width={MAP_W} height={MAP_H} fill="#e8f0f7" />

        {/* Parking */}
        <rect {...box(PARKING)} rx="14" fill="#cdd2da" stroke="#b3bac6" strokeWidth="2" />
        {Array.from({ length: 29 }, (_, i) => (
          <g key={i}>
            <line x1={78 + i * 36} y1={PARKING.y + 12} x2={78 + i * 36} y2={PARKING.y + 36} stroke="#fff" strokeWidth="2" opacity="0.8" />
            <line x1={78 + i * 36} y1={PARKING.y + PARKING.h - 36} x2={78 + i * 36} y2={PARKING.y + PARKING.h - 12} stroke="#fff" strokeWidth="2" opacity="0.8" />
          </g>
        ))}
        <text x={600} y={PARKING.y + PARKING.h / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="3" fill="#5b6478">
          VISITOR PARKING · 240 BAYS
        </text>

        {/* Compound */}
        <rect {...box(COMPOUND)} rx="20" fill="#dcebe4" stroke="#9db8ab" strokeWidth="3" />

        {/* Walkways */}
        <rect {...box(WALKWAY_V)} fill="#ffffff" />
        <rect {...box(WALKWAY_H)} fill="#ffffff" />
        <line x1={600} y1={COMPOUND.y} x2={600} y2={COMPOUND.y + COMPOUND.h} stroke="#cfdde6" strokeWidth="2" strokeDasharray="10 10" />
        <line x1={COMPOUND.x} y1={365} x2={COMPOUND.x + COMPOUND.w} y2={365} stroke="#cfdde6" strokeWidth="2" strokeDasharray="10 10" />

        {/* Central plaza */}
        <circle cx={PLAZA.cx} cy={PLAZA.cy} r={PLAZA.r} fill="#e8f1fa" stroke="#bcd5ec" strokeWidth="3" />
        <circle cx={PLAZA.cx} cy={PLAZA.cy} r={PLAZA.r - 22} fill="#cfe3f5" stroke="#a9cbe8" strokeWidth="2" />
        <text x={PLAZA.cx} y={PLAZA.cy - 3} textAnchor="middle" fontSize="10.5" fontWeight="800" letterSpacing="1.5" fill="#4a6d8f">
          CENTRAL
        </text>
        <text x={PLAZA.cx} y={PLAZA.cy + 10} textAnchor="middle" fontSize="10.5" fontWeight="800" letterSpacing="1.5" fill="#4a6d8f">
          PLAZA
        </text>

        {/* Shop blocks (not bookable) */}
        {SHOP_BLOCKS.map((b) => (
          <g key={b.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="7" fill="url(#gm-shops)" stroke="#a9b1c2" strokeWidth="1.6" />
            {!mini && (
              <>
                <rect x={b.x + b.w / 2 - 58} y={b.y + b.h / 2 - 11} width="116" height="22" rx="11" fill="#fff" opacity="0.82" />
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#5b6478">
                  {b.label}
                </text>
              </>
            )}
          </g>
        ))}

        {/* Trees */}
        {TREES.map(([x, y], i) => (
          <g key={i} opacity="0.9">
            <circle cx={x} cy={y} r="10" fill="#9bcfa5" />
            <circle cx={x - 2} cy={y - 2} r="5" fill="#b6e0bd" />
          </g>
        ))}

        {/* Gates */}
        {GATES.map((g) => {
          const horizontal = g.side === 'n' || g.side === 's';
          const w = 74;
          const h = 26;
          return (
            <g key={g.id}>
              <rect
                x={g.x - (horizontal ? w / 2 : w / 2)}
                y={g.y - h / 2}
                width={w}
                height={h}
                rx="13"
                fill="#1d4ed8"
                stroke="#fff"
                strokeWidth="3"
              />
              <text x={g.x} y={g.y + 4.5} textAnchor="middle" fontSize={mini ? 10 : 11} fontWeight="800" letterSpacing="1" fill="#fff">
                {g.label}
              </text>
              {!mini && (
                <text
                  x={g.x}
                  y={g.side === 'n' ? g.y - 20 : g.side === 's' ? g.y - 19 : g.y - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  letterSpacing="1.4"
                  fill="#64748b"
                >
                  {g.sub.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Promotional spaces */}
        {SPACES.map((s) => {
          const st = spaceStatus.get(s.id)!;
          const meta = STATUS[st];
          const isHL = highlightId === s.id;
          const dimmedByFilter = matches ? !matches(s, st) : false;
          const dimmed = mode === 'mobile' || dimmedByFilter || (mini && !!highlightId && !isHL);
          const clickable = interactive && mode === 'space' && st === 'available';
          const label = s.id.slice(-2);
          const cx = s.map.x + s.map.w / 2;
          const cy = s.map.y + s.map.h / 2;
          return (
            <g
              key={s.id}
              className="map-space"
              data-clickable={clickable}
              data-active={hover?.kind === 'space' && hover.id === s.id}
              opacity={dimmed ? (mini ? 0.45 : 0.22) : 1}
              style={{ cursor: !interactive || mode === 'mobile' ? 'default' : clickable ? 'pointer' : 'not-allowed', pointerEvents: interactive && mode === 'space' ? 'auto' : 'none' }}
              tabIndex={interactive && mode === 'space' ? 0 : undefined}
              role={interactive && mode === 'space' ? 'button' : undefined}
              aria-label={`${s.id}, ${meta.label}, ${s.areaSqFt} square feet, ${naira(spaceDayPrice(s, slot))} per day`}
              onPointerEnter={(e) => placePointer(e, 'space', s.id)}
              onPointerMove={(e) => placePointer(e, 'space', s.id)}
              onFocus={(e) => placeFocus(e, 'space', s.id)}
              onBlur={() => setHover(null)}
              onClick={() => clickSpace(s)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  clickSpace(s);
                }
              }}
            >
              {isHL && (
                <>
                  <rect x={s.map.x - 9} y={s.map.y - 9} width={s.map.w + 18} height={s.map.h + 18} rx="12" fill="none" stroke="#1d4ed8" strokeWidth="4" strokeDasharray="1 0">
                    <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
                  </rect>
                  <rect x={s.map.x - 20} y={s.map.y - 20} width={s.map.w + 40} height={s.map.h + 40} rx="20" fill="#1d4ed8" opacity="0.12" />
                </>
              )}
              <rect
                x={s.map.x}
                y={s.map.y}
                width={s.map.w}
                height={s.map.h}
                rx="5"
                fill={st === 'blocked' ? 'url(#gm-hatch)' : meta.fill}
                stroke={meta.stroke}
                strokeWidth={isHL ? 3 : 2}
              />
              {(!mini || isHL) && (
                <text
                  x={cx}
                  y={cy + 4.5}
                  textAnchor="middle"
                  fontSize={mini ? 15 : 12.5}
                  fontWeight="800"
                  fill={st === 'blocked' ? '#475569' : meta.ink}
                  style={{ pointerEvents: 'none' }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Mobile promotion zones */}
        {mode === 'mobile' &&
          !mini &&
          ZONES.map((z) => {
            const st = zoneStatus.get(z.id)!;
            const meta = STATUS[st];
            const selected = selectedZoneId === z.id;
            const free = zoneRemainingForRange(z, bookings, date, endDate);
            const hovered = hover?.kind === 'zone' && hover.id === z.id;
            const cx = z.map.x + z.map.w / 2;
            const cy = z.map.y + z.map.h / 2;
            const labelXs = z.code === 'B' ? [300, 900] : [cx];
            const labelY = z.code === 'B' ? 360 : cy;
            return (
              <g
                key={z.id}
                role="button"
                tabIndex={0}
                aria-label={`Zone ${z.code}, ${z.name}, ${meta.label}`}
                style={{ cursor: 'pointer' }}
                onPointerEnter={(e) => placePointer(e, 'zone', z.id)}
                onPointerMove={(e) => placePointer(e, 'zone', z.id)}
                onFocus={(e) => placeFocus(e, 'zone', z.id)}
                onBlur={() => setHover(null)}
                onClick={() => onSelectZone?.(z)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectZone?.(z);
                  }
                }}
              >
                <rect
                  x={z.map.x}
                  y={z.map.y}
                  width={z.map.w}
                  height={z.map.h}
                  rx="14"
                  fill={st === 'blocked' ? 'url(#gm-zone-hatch)' : meta.fill}
                  fillOpacity={st === 'blocked' ? 1 : hovered || selected ? 0.62 : 0.46}
                  stroke={selected ? '#0f1f3d' : meta.stroke}
                  strokeWidth={selected ? 5 : hovered ? 4 : 2.5}
                  strokeDasharray={selected ? undefined : '9 6'}
                  filter={selected ? 'url(#gm-soft)' : undefined}
                />
                {labelXs.map((x) => (
                  <g key={x} style={{ pointerEvents: 'none' }}>
                    <rect x={x - 62} y={labelY - 28} width="124" height="56" rx="14" fill="#fff" opacity="0.94" />
                    <text x={x} y={labelY - 7} textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="1.5" fill="#0f1f3d">
                      ZONE {z.code}
                    </text>
                    <text x={x} y={labelY + 11} textAnchor="middle" fontSize="11" fontWeight="700" fill={st === 'blocked' ? '#475569' : meta.stroke}>
                      {st === 'blocked' ? 'Not permitted' : st === 'booked' ? 'Fully booked' : `${free} of ${z.capacity} free`}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}

        {/* Mini map of a mobile-promotion booking: just the booked zone, outlined */}
        {mode === 'mobile' &&
          mini &&
          highlightZoneId &&
          (() => {
            const z = ZONES.find((x) => x.id === highlightZoneId);
            if (!z) return null;
            const lx = z.code === 'B' ? 300 : z.map.x + z.map.w / 2;
            const ly = z.code === 'B' ? 365 : z.map.y + z.map.h / 2;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={z.map.x} y={z.map.y} width={z.map.w} height={z.map.h} rx="14" fill="#1d4ed8" fillOpacity="0.3" stroke="#1d4ed8" strokeWidth="6">
                  <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
                </rect>
                <rect x={lx - 56} y={ly - 22} width="112" height="44" rx="12" fill="#fff" opacity="0.95" />
                <text x={lx} y={ly + 6} textAnchor="middle" fontSize="18" fontWeight="800" letterSpacing="1.5" fill="#0f1f3d">
                  ZONE {z.code}
                </text>
              </g>
            );
          })()}

        {/* Compass + scale */}
        {!mini && (
          <>
            <g transform="translate(1108 742)" style={{ pointerEvents: 'none' }}>
              <circle r="22" fill="#fff" stroke="#9db8ab" strokeWidth="2" />
              <path d="M0 -15 L7 6 L0 2 L-7 6 Z" fill="#1d4ed8" />
              <text y="-26" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1d4ed8">N</text>
            </g>
            <text x={1148} y={796} textAnchor="end" fontSize="10" fill="#64748b" style={{ pointerEvents: 'none' }}>
              Schematic plan · not to scale
            </text>
          </>
        )}
      </svg>

      {interactive && hover && wrapRef.current && (
        <MapTooltip hover={hover} wrap={wrapRef.current} date={date} endDate={endDate} slot={slot} bookings={bookings} spaceStatus={spaceStatus} zoneStatus={zoneStatus} />
      )}
    </div>
  );
}

function MapTooltip({
  hover,
  wrap,
  date,
  endDate,
  slot,
  bookings,
  spaceStatus,
  zoneStatus,
}: {
  hover: NonNullable<Hover>;
  wrap: HTMLDivElement;
  date: string;
  endDate: string;
  slot: TimeSlotId;
  bookings: Booking[];
  spaceStatus: Map<string, SpaceStatus>;
  zoneStatus: Map<string, SpaceStatus>;
}) {
  const W = 288;
  const left = hover.x + 18 + W > wrap.clientWidth ? Math.max(8, hover.x - W - 18) : hover.x + 18;
  const flipUp = hover.y > wrap.clientHeight * 0.62;
  const style = { left, top: flipUp ? undefined : hover.y + 14, bottom: flipUp ? wrap.clientHeight - hover.y + 14 : undefined, width: W };

  if (hover.kind === 'space') {
    const s = SPACES.find((x) => x.id === hover.id)!;
    const st = spaceStatus.get(s.id)!;
    const next = nextAvailableDate(s, bookings, date);
    const nextLabel =
      st === 'blocked' ? 'Not available' : st === 'available' ? (endDate !== date ? 'Free for your dates' : 'Available on this date') : next ? fmtShort(next) : 'No dates in 6 months';
    return (
      <div className="animate-pop-in pointer-events-none absolute z-20 overflow-hidden rounded-2xl border border-line bg-white shadow-pop" style={style}>
        <div className="flex items-start justify-between gap-2 border-b border-line bg-sand-50 px-4 py-3">
          <div>
            <p className="font-mono text-[13px] font-bold tracking-tight text-ink">{s.id}</p>
            <p className="text-xs font-medium text-ink-soft">{s.name}</p>
          </div>
          <StatusPill status={st} size="sm" />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3 text-xs">
          <div>
            <dt className="text-ink-mute">Approx. size</dt>
            <dd className="font-semibold text-ink">{num(s.areaSqFt)} sq ft</dd>
          </div>
          <div>
            <dt className="text-ink-mute">Price per day</dt>
            <dd className="font-semibold text-ink">
              {naira(spaceDayPrice(s, slot))}
              <span className="block text-[10px] font-medium text-ink-mute">
                {naira(Math.round(RATE_PER_SQFT_PER_DAY * slotFactor(slot)))} / sq ft · {slotById(slot).label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-ink-mute">Location</dt>
            <dd className="font-semibold text-ink">{s.location}</dd>
          </div>
          <div>
            <dt className="text-ink-mute">Next available</dt>
            <dd className="font-semibold text-ink">{nextLabel}</dd>
          </div>
        </dl>
        <div
          className={cn(
            'flex items-center gap-2 border-t border-line px-4 py-2 text-[11px] font-semibold',
            st === 'available' ? 'bg-st-available-soft text-st-available-ink' : 'bg-sand-50 text-ink-mute',
          )}
        >
          {st === 'available' ? <MousePointerClick className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {st === 'available' ? 'Click to view details & book' : st === 'blocked' ? s.blocked?.reason : endDate !== date ? 'Not free for all your dates' : 'Not open for booking on this date'}
        </div>
      </div>
    );
  }

  const z = ZONES.find((x) => x.id === hover.id)!;
  const st = zoneStatus.get(z.id)!;
  const free = zoneRemainingForRange(z, bookings, date, endDate);
  const next = nextZoneAvailableDate(z, bookings, date);
  return (
    <div className="animate-pop-in pointer-events-none absolute z-20 overflow-hidden rounded-2xl border border-line bg-white shadow-pop" style={style}>
      <div className="flex items-start justify-between gap-2 border-b border-line bg-sand-50 px-4 py-3">
        <div>
          <p className="text-[13px] font-bold text-ink">Zone {z.code}</p>
          <p className="text-xs font-medium text-ink-soft">{z.name}</p>
        </div>
        <StatusPill status={st} size="sm" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3 text-xs">
        <div>
          <dt className="text-ink-mute">Per promoter / day</dt>
          <dd className="font-semibold text-ink">{naira(zoneDayPrice(z, slot))}</dd>
        </div>
        <div>
          <dt className="text-ink-mute">Promoter slots</dt>
          <dd className="font-semibold text-ink">
            {z.blocked ? '—' : `${free} of ${z.capacity} free`}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-mute">Route</dt>
          <dd className="font-semibold text-ink">{z.route}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-mute">Next available</dt>
          <dd className="font-semibold text-ink">
            {z.blocked ? 'Not available' : free > 0 ? (endDate !== date ? 'Slots free for your dates' : 'Slots free on this date') : next ? fmtShort(next) : '—'}
          </dd>
        </div>
      </dl>
      <div className="flex items-center gap-2 border-t border-line bg-sand-50 px-4 py-2 text-[11px] font-semibold text-ink-mute">
        {z.blocked ? <Lock className="h-3.5 w-3.5" /> : <MousePointerClick className="h-3.5 w-3.5" />}
        {z.blocked ? z.blocked.reason : 'Click to select this zone'}
      </div>
    </div>
  );
}
