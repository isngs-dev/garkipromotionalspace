import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Real, scannable QR code (rendered client-side). */
export function QR({ value, size = 160, className, dark = '#0f1f3d' }: { value: string; size?: number; className?: string; dark?: string }) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { width: size * 3, margin: 1, errorCorrectionLevel: 'M', color: { dark, light: '#ffffff' } })
      .then((u) => live && setSrc(u))
      .catch(() => live && setSrc(''));
    return () => {
      live = false;
    };
  }, [value, size, dark]);

  return src ? (
    <img src={src} width={size} height={size} alt={`QR code ${value}`} className={className} style={{ imageRendering: 'pixelated' }} />
  ) : (
    <div style={{ width: size, height: size }} className={`animate-pulse rounded bg-sand-200 ${className ?? ''}`} />
  );
}

export async function qrDataUrl(value: string, size = 600): Promise<string> {
  return QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' });
}
