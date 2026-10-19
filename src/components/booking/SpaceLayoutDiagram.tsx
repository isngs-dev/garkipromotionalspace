import type { Space } from '../../types';

/** Simple top-down layout sketch of the bay at its real proportions, with typical furniture. */
export function SpaceLayoutDiagram({ space }: { space: Space }) {
  const VW = 360;
  const VH = 250;
  const padX = 56;
  const padY = 52;
  const scale = Math.min((VW - padX * 2) / space.widthFt, (VH - padY * 2) / space.depthFt);
  const w = space.widthFt * scale;
  const h = space.depthFt * scale;
  const x = (VW - w) / 2;
  const y = (VH - h) / 2 + 4;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label={`Layout of ${space.id}: ${space.widthFt} by ${space.depthFt} feet`}>
      <defs>
        <pattern id="gm-grid" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0H0V14" fill="none" stroke="#dbeafe" strokeWidth="1" />
        </pattern>
        <marker id="gm-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#3b82f6" />
        </marker>
      </defs>
      <rect width={VW} height={VH} rx="14" fill="#f0f7ff" />
      <rect width={VW} height={VH} rx="14" fill="url(#gm-grid)" />

      {/* bay */}
      <rect x={x} y={y} width={w} height={h} rx="6" fill="#fff" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="1 0" />
      {/* counter along the back wall */}
      <rect x={x + 10} y={y + 10} width={w - 20} height={Math.max(14, h * 0.16)} rx="3" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
      <text x={x + w / 2} y={y + 10 + Math.max(14, h * 0.16) / 2 + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#047857">
        COUNTER / DEMO TABLE
      </text>
      {/* banner stand */}
      <rect x={x + w - 26} y={y + h - 30} width="14" height="20" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={x + w - 19} y={y + h - 17} textAnchor="middle" fontSize="7" fontWeight="700" fill="#1d4ed8">
        BANNER
      </text>
      {/* promoters */}
      <circle cx={x + w * 0.3} cy={y + h * 0.5} r="7" fill="#3b82f6" />
      <circle cx={x + w * 0.5} cy={y + h * 0.5} r="7" fill="#3b82f6" />
      <text x={x + w * 0.4} y={y + h * 0.5 + 24} textAnchor="middle" fontSize="8" fontWeight="700" fill="#3b82f6">
        PROMOTERS
      </text>
      {/* power */}
      <circle cx={x + 8} cy={y + h - 10} r="4.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      <text x={x + 16} y={y + h - 7} fontSize="7.5" fontWeight="600" fill="#64748b">
        13A
      </text>

      {/* shopper flow */}
      <line x1={x + w / 2} y1={y + h + 30} x2={x + w / 2} y2={y + h + 8} stroke="#3b82f6" strokeWidth="2" markerEnd="url(#gm-arrow)" />
      <text x={x + w / 2 + 8} y={y + h + 25} fontSize="8.5" fontWeight="700" fill="#3b82f6">
        Shopper flow
      </text>

      {/* dimensions */}
      <line x1={x} y1={y - 14} x2={x + w} y2={y - 14} stroke="#64748b" strokeWidth="1.2" markerStart="url(#gm-arrow)" markerEnd="url(#gm-arrow)" />
      <rect x={x + w / 2 - 22} y={y - 24} width="44" height="18" rx="9" fill="#fff" stroke="#bfdbfe" />
      <text x={x + w / 2} y={y - 11.5} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
        {space.widthFt} ft
      </text>
      <line x1={x - 16} y1={y} x2={x - 16} y2={y + h} stroke="#64748b" strokeWidth="1.2" markerStart="url(#gm-arrow)" markerEnd="url(#gm-arrow)" />
      <rect x={x - 40} y={y + h / 2 - 9} width="44" height="18" rx="9" fill="#fff" stroke="#bfdbfe" />
      <text x={x - 18} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
        {space.depthFt} ft
      </text>
    </svg>
  );
}
