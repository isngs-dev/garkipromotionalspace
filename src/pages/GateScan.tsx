import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, ScanLine, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { QR } from '../components/pass/QR';
import { Button } from '../components/ui/Button';
import { Card, Container, PageHeader } from '../components/ui/misc';
import { passesFor, verifyScan, type ScanResult } from '../lib/passes';
import { fmtDate, fmtRange, fmtTimeRange, todayISO } from '../lib/dates';
import { cn } from '../lib/format';
import type { Pass } from '../types';

const UNKNOWN_QR = 'GKM|GKP-9999-0000-01|GKM-9999-0000|GM-PS-00|2026-01-01|2026-01-02';

interface LogItem {
  at: string;
  who: string;
  id: string;
  ok: boolean;
  note: string;
}

export default function GateScan() {
  const { bookings } = useStore();
  const [params] = useSearchParams();
  const today = todayISO();

  const all = useMemo(
    () =>
      bookings
        .flatMap((b) => passesFor(b).map((p) => ({ p, r: verifyScan(p.qr, bookings, today) })))
        .map(({ p, r }) => ({ p, valid: r.valid, expired: !r.valid && r.reason === 'expired' }))
        .sort((a, b) => Number(b.valid) - Number(a.valid) || a.p.company.localeCompare(b.p.company)),
    [bookings, today],
  );

  const [payload, setPayload] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState('');
  const [selected, setSelected] = useState<string>(params.get('pass') ?? '');
  const [log, setLog] = useState<LogItem[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const scan = (raw: string) => {
    window.clearTimeout(timer.current);
    setPayload(raw);
    setResult(null);
    setPhase('scanning');
    timer.current = window.setTimeout(() => {
      const r = verifyScan(raw, bookings, today);
      setResult(r);
      setPhase('result');
      setLog((l) =>
        [
          {
            at: new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
            who: r.pass?.holder ?? 'Unknown code',
            id: r.pass?.id ?? raw.split('|')[1] ?? raw,
            ok: r.valid,
            note: r.valid ? 'Valid' : r.reason === 'expired' ? 'Expired' : 'Invalid',
          },
          ...l,
        ].slice(0, 6),
      );
    }, 1500);
  };

  const firstValid = all.find((x) => x.valid && x.p.company.startsWith('Zuma')) ?? all.find((x) => x.valid);
  const firstExpired = all.find((x) => x.expired);

  const selectedPass = all.find((x) => x.p.id === selected)?.p;
  const reset = () => {
    window.clearTimeout(timer.current);
    setPhase('idle');
    setResult(null);
    setPayload(null);
  };

  const manualScan = () => {
    const v = manual.trim();
    if (!v) return;
    scan(v.startsWith('GKM|') ? v : all.find((x) => x.p.id.toLowerCase() === v.toLowerCase())?.p.qr ?? `GKM|${v}|x|x|x|x`);
  };

  return (
    <>
      <PageHeader
        title="Gate scan"
        lead="What security staff see at the market gates: scan a promoter's QR pass and get an instant valid / invalid decision."
      />
      <Container className="py-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Scanner */}
          <div className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-[28px] bg-brand-950 p-4 shadow-pop ring-1 ring-brand-900">
              <div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold text-brand-200">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-st-available" /> Gate 1 · North · Scanner online
                </span>
                <span>{fmtDate(today)}</span>
              </div>
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand-900 to-black">
                {/* viewfinder corners */}
                {['left-5 top-5 border-l-4 border-t-4 rounded-tl-xl', 'right-5 top-5 border-r-4 border-t-4 rounded-tr-xl', 'left-5 bottom-5 border-l-4 border-b-4 rounded-bl-xl', 'right-5 bottom-5 border-r-4 border-b-4 rounded-br-xl'].map((c) => (
                  <span key={c} className={cn('absolute h-10 w-10', c, phase === 'result' ? (result?.valid ? 'border-st-available' : 'border-st-booked') : 'border-white/80')} />
                ))}
                {phase === 'idle' && (
                  <div className="text-center text-brand-200">
                    <ScanLine className="mx-auto h-12 w-12 opacity-70" />
                    <p className="mt-3 text-sm font-semibold">Point the camera at a pass QR</p>
                    <p className="mt-1 text-xs text-brand-300">…or pick a demo scenario below</p>
                  </div>
                )}
                {payload && phase !== 'idle' && (
                  <div className={cn('rounded-2xl bg-white p-3 shadow-2xl transition-all', phase === 'result' && 'scale-95 opacity-60')}>
                    <QR value={payload} size={170} />
                  </div>
                )}
                {phase === 'scanning' && (
                  <>
                    <span className="animate-scan-line absolute left-6 right-6 h-0.5 rounded bg-st-available shadow-[0_0_18px_4px_rgba(34,197,94,0.7)]" />
                    <span className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Reading code…</span>
                  </>
                )}
                {phase === 'result' && result && (
                  <span
                    className={cn(
                      'animate-pop-in absolute flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl',
                      result.valid ? 'bg-st-available' : 'bg-st-booked',
                    )}
                  >
                    {result.valid ? <CheckCircle2 className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
                  </span>
                )}
              </div>
            </div>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-ink">Demo scenarios</h2>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Button variant="success" size="md" disabled={!firstValid || phase === 'scanning'} onClick={() => firstValid && scan(firstValid.p.qr)} icon={<ShieldCheck className="h-4 w-4" />}>
                  Valid pass
                </Button>
                <Button variant="danger" size="md" disabled={!firstExpired || phase === 'scanning'} onClick={() => firstExpired && scan(firstExpired.p.qr)} icon={<Clock className="h-4 w-4" />}>
                  Expired pass
                </Button>
                <Button variant="outline" size="md" disabled={phase === 'scanning'} onClick={() => scan(UNKNOWN_QR)} icon={<ShieldAlert className="h-4 w-4" />}>
                  Unknown QR
                </Button>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <label htmlFor="pass-select" className="mb-1.5 block text-[13px] font-semibold text-ink">
                  Or choose any issued pass
                </label>
                <div className="flex gap-2">
                  <select
                    id="pass-select"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  >
                    <option value="">Select a pass…</option>
                    {all.map(({ p, valid }) => (
                      <option key={p.id} value={p.id}>
                        {p.id} · {p.holder} · {p.company} {valid ? '✓ valid today' : '✕ not valid today'}
                      </option>
                    ))}
                  </select>
                  <Button disabled={!selectedPass || phase === 'scanning'} onClick={() => selectedPass && scan(selectedPass.qr)} icon={<ScanLine className="h-4 w-4" />}>
                    Scan
                  </Button>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                    <input
                      value={manual}
                      onChange={(e) => setManual(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && manualScan()}
                      placeholder="Type a pass ID, e.g. GKP-2610-1005-01"
                      className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    />
                  </div>
                  <Button variant="outline" onClick={manualScan} disabled={!manual.trim() || phase === 'scanning'}>
                    Verify
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Result */}
          <div className="min-w-0 space-y-5 lg:sticky lg:top-24">
            <ResultPanel phase={phase} result={result} onReset={reset} />
            <Card className="p-5">
              <h2 className="text-sm font-bold text-ink">Recent scans</h2>
              {log.length === 0 ? (
                <p className="mt-3 text-sm text-ink-mute">No scans yet this session.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {log.map((l, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className={cn('h-2.5 w-2.5 rounded-full', l.ok ? 'bg-st-available' : 'bg-st-booked')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{l.who}</span>
                        <span className="block font-mono text-[11px] text-ink-mute">{l.id}</span>
                      </span>
                      <span className={cn('text-xs font-bold', l.ok ? 'text-st-available-ink' : 'text-st-booked-ink')}>{l.note}</span>
                      <span className="text-xs text-ink-mute">{l.at}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}

function Detail({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{k}</dt>
      <dd className={cn('mt-0.5 text-sm font-bold', mono && 'font-mono')}>{v}</dd>
    </div>
  );
}

function ResultPanel({ phase, result, onReset }: { phase: 'idle' | 'scanning' | 'result'; result: ScanResult | null; onReset: () => void }) {
  if (phase !== 'result' || !result) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ScanLine className={cn('h-8 w-8', phase === 'scanning' && 'animate-pulse')} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">{phase === 'scanning' ? 'Checking the AICL pass register…' : 'Awaiting scan'}</h2>
        <p className="mt-1 max-w-xs text-sm text-ink-soft">
          {phase === 'scanning' ? 'Verifying booking status, payment and validity window.' : 'Scan a promoter pass to see an instant valid or invalid result with booking details.'}
        </p>
      </Card>
    );
  }

  const ok = result.valid;
  const p: Pass | undefined = result.pass;
  const b = result.booking;

  return (
    <div
      className={cn(
        'animate-pop-in overflow-hidden rounded-3xl border-2 shadow-pop',
        ok ? 'border-st-available bg-st-available-soft' : 'border-st-booked bg-st-booked-soft',
      )}
      role="status"
      aria-live="assertive"
    >
      <div className={cn('flex items-center gap-4 px-6 py-5 text-white', ok ? 'bg-st-available' : 'bg-st-booked')}>
        {ok ? <CheckCircle2 className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
        <div>
          <p className="text-3xl font-extrabold tracking-tight">{ok ? 'Valid pass' : 'Invalid / expired'}</p>
          <p className="text-sm font-medium opacity-90">{ok ? 'Allow entry · booking confirmed and paid' : result.message}</p>
        </div>
      </div>
      <div className={cn('px-6 py-5', ok ? 'text-st-available-ink' : 'text-st-booked-ink')}>
        {p && b ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Detail k="Representative" v={p.holder} />
            <Detail k="Company / brand" v={p.company} />
            <Detail k={p.type === 'space' ? 'Space' : 'Zone'} v={p.targetLabel} mono={p.type === 'space'} />
            <Detail k="Promotion type" v={p.typeLabel} />
            <Detail k="Valid date" v={fmtRange(p.startDate, p.endDate)} />
            <Detail k="Valid time" v={fmtTimeRange(p.startTime, p.endTime)} />
            <Detail k="Booking" v={b.ref} mono />
            <Detail k="Pass ID" v={p.id} mono />
          </dl>
        ) : (
          <p className="text-sm font-semibold">
            {result.valid ? '' : result.message} Deny entry and refer the visitor to the AICL market office.
          </p>
        )}
        {!ok && p && <p className="mt-4 rounded-xl bg-white/60 px-4 py-2.5 text-sm font-semibold">Do not admit — direct the holder to the AICL market office.</p>}
      </div>
      <div className="flex justify-end border-t border-black/5 bg-white/50 px-6 py-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          Scan next
        </Button>
      </div>
    </div>
  );
}
