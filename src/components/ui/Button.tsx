import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'light';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/20 disabled:bg-brand-300',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-md shadow-accent-600/25 disabled:bg-accent-200',
  outline: 'border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50 disabled:text-ink-mute',
  ghost: 'text-ink-soft hover:bg-sand-100 hover:text-ink',
  danger: 'bg-st-booked text-white hover:bg-red-700 shadow-sm disabled:bg-red-300',
  success: 'bg-st-available text-white hover:bg-green-700 shadow-sm disabled:bg-green-300',
  light: 'bg-white text-brand-800 hover:bg-brand-50 shadow-md',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-14 px-7 text-base gap-2.5 rounded-2xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  to?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  full?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  icon,
  iconRight,
  loading,
  full,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  const cls = cn(
    'inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
    className,
  );
  const inner = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </>
  );
  if (to && !disabled) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}
