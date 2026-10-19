import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, Menu, ScanLine, ShieldCheck, X } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import { cn } from '../../lib/format';
import { timeAgo } from '../../lib/dates';
import { Container } from '../ui/misc';
import { useToast } from '../ui/Toast';
import type { Role } from '../../types';
import logoDark from '../../assets/logo.png';
import logoLight from '../../assets/logo-light.png';

/** Site logo: the GSD Solutions mark, followed by the product name. `light` = white lettering for dark backgrounds. */
export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3.5" aria-label="GSD Solutions — Garki Market Promotional Spaces">
      <img src={light ? logoLight : logoDark} alt="GSD Solutions" className="h-10 w-auto select-none" draggable={false} />
      <span className={cn('hidden h-8 w-px sm:block', light ? 'bg-white/25' : 'bg-line')} aria-hidden />
      <span className="hidden whitespace-nowrap leading-tight sm:block">
        <span className={cn('block text-[15px] font-extrabold tracking-tight', light ? 'text-white' : 'text-ink')}>Garki Market</span>
        <span className={cn('block text-[11px] font-semibold uppercase tracking-[0.14em]', light ? 'text-white/70' : 'text-ink-mute')}>
          Promotional Spaces
        </span>
      </span>
    </Link>
  );
}

function RoleSwitch() {
  const { role, setRole } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const pick = (r: Role) => {
    if (r === role) return;
    setRole(r);
    navigate(r === 'admin' ? '/admin' : '/my-bookings');
    toast({
      kind: 'info',
      title: r === 'admin' ? 'Now viewing as AICL Admin' : 'Now viewing as Business',
      body: r === 'admin' ? 'Review and decide on promotion requests.' : 'Track your bookings, pay and collect passes.',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-ink-mute xl:block">View as</span>
      <div className="relative flex rounded-xl bg-sand-100 p-1 ring-1 ring-inset ring-line" role="group" aria-label="Demo role switch">
        {(
          [
            ['business', 'Business', Building2],
            ['admin', 'AICL Admin', ShieldCheck],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => pick(id)}
            aria-pressed={role === id}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all',
              role === id ? 'bg-brand-700 text-white shadow' : 'text-ink-soft hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationBell() {
  const { role, notifications, markNotificationsRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const mine = notifications.filter((n) => n.audience === role);
  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-brand-300 hover:text-ink"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-pop-in absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">
              {role === 'admin' ? 'AICL notifications' : 'Your notifications'}
            </p>
            <button
              className="text-xs font-semibold text-brand-600 hover:underline disabled:text-ink-mute"
              disabled={!unread}
              onClick={() => markNotificationsRead(role)}
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
            {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-mute">Nothing yet.</li>}
            {mine.slice(0, 12).map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    if (n.to) navigate(n.to);
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-sand-50"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent-500')} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-ink-mute">{timeAgo(n.at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { role, myBookings } = useStore();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();

  useEffect(() => setMenu(false), [loc.pathname]);

  const toPay = myBookings.filter((b) => b.status === 'awaiting_payment').length;

  const links =
    role === 'admin'
      ? [
          { to: '/admin', label: 'Admin Dashboard', end: false },
          { to: '/plan', label: 'Floor Plan', end: false },
          { to: '/gate-scan', label: 'Gate Scan', end: false },
        ]
      : [
          { to: '/', label: 'Home', end: true },
          { to: '/plan', label: 'Plan Your Promotion', end: false },
          { to: '/my-bookings', label: 'My Bookings', end: false, badge: toPay },
          { to: '/gate-scan', label: 'Gate Scan', end: false },
        ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      {role === 'admin' && (
        <div className="bg-brand-900 py-1 text-center text-[11px] font-semibold tracking-wide text-brand-100">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
          Demo mode · You are viewing as AICL Admin
        </div>
      )}
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-sand-100 hover:text-ink',
                  )
                }
              >
                {l.label === 'Gate Scan' && <ScanLine className="h-4 w-4" />}
                {l.label}
                {'badge' in l && l.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
                    {l.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <RoleSwitch />
          </div>
          <NotificationBell />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line lg:hidden"
            onClick={() => setMenu((m) => !m)}
            aria-label="Menu"
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      {menu && (
        <div className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <div className="mb-3 sm:hidden">
            <RoleSwitch />
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('rounded-lg px-3 py-2.5 text-sm font-semibold', isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
