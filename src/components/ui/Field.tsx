import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/format';

const control =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-ink-mute/70 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-sand-100 disabled:text-ink-mute';

export function controlClass(error?: boolean) {
  return cn(control, error ? 'border-st-booked focus:border-st-booked' : 'border-line hover:border-brand-300 focus:border-brand-500');
}

export function FieldShell({
  label,
  error,
  hint,
  required,
  htmlFor,
  className,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-st-booked">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-st-booked-ink" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>
      )}
    </div>
  );
}

interface TextProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextField({ label, error, hint, required, wrapperClassName, className, id, ...rest }: TextProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={id} className={wrapperClassName}>
      <input id={id} required={false} aria-invalid={!!error} className={cn(controlClass(!!error), 'h-11', className)} {...rest} />
    </FieldShell>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function SelectField({ label, error, hint, required, wrapperClassName, className, id, children, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={id} className={wrapperClassName}>
      <select id={id} aria-invalid={!!error} className={cn(controlClass(!!error), 'h-11 appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-9', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a8099' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextAreaField({ label, error, hint, required, wrapperClassName, className, id, ...rest }: AreaProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={id} className={wrapperClassName}>
      <textarea id={id} aria-invalid={!!error} className={cn(controlClass(!!error), 'min-h-[104px] py-3', className)} {...rest} />
    </FieldShell>
  );
}
