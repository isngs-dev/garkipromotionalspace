import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, Mail, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/format';

type ToastKind = 'success' | 'info' | 'warning' | 'email';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface ToastApi {
  toast: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  email: Mail,
};
const TONES: Record<ToastKind, string> = {
  success: 'text-st-available',
  info: 'text-brand-600',
  warning: 'text-st-pending',
  email: 'text-accent-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = ++idRef.current;
      setItems((p) => [...p.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="animate-slide-in pointer-events-auto flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-pop"
              role="status"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONES[t.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm leading-snug text-ink-soft">{t.body}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="h-6 w-6 shrink-0 rounded-md text-ink-mute hover:bg-sand-100"
                aria-label="Dismiss"
              >
                <X className="mx-auto h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
