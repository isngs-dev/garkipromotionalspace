import { useState } from 'react';
import { cn } from '../../lib/format';

/** Image with a branded illustrated fallback so the demo never shows a broken image. */
export function Photo({
  src,
  alt,
  className,
  imgClassName,
  position = 'center',
  eager,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  position?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-brand-100 via-sand-100 to-accent-100', className)}>
      {!failed && src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          style={{ objectPosition: position }}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
      {(failed || !src || !loaded) && (
        <svg
          className={cn('absolute inset-0 h-full w-full', failed || !src ? 'opacity-100' : 'opacity-60')}
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dbeafe" />
              <stop offset="1" stopColor="#ecfdf5" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#ph-sky)" />
          <rect y="190" width="400" height="70" fill="#e2e8f0" />
          {[20, 110, 200, 290].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 120 h80 l-8 -34 h-64 z`} fill={['#3b82f6', '#34d399', '#2563eb', '#059669'][i]} />
              <rect x={x + 8} y="120" width="64" height="70" fill="#fff" opacity="0.85" />
              <rect x={x + 18} y="140" width="44" height="30" rx="3" fill="#bfdbfe" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
