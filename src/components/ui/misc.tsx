import type { ReactNode } from 'react';
import { cn } from '../../lib/format';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-line bg-white shadow-card', className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-bold uppercase tracking-[0.18em] text-accent-600', className)}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto text-center', 'max-w-2xl', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-display mt-2 text-3xl font-semibold leading-[1.1] text-ink sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">{lead}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  lead,
  actions,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-white">
      <Container className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-[34px]">{title}</h1>
            {lead && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{lead}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}

export function KV({ k, v, className }: { k: string; v: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{k}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{v}</dd>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ id: T; label: string; count?: number }>;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-sand-100 p-1', className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
            value === it.id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                value === it.id ? 'bg-brand-100 text-brand-800' : 'bg-white/70 text-ink-mute',
              )}
            >
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
