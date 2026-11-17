import { memo } from 'react';
import type { MeasurementDef } from '@/domain/measurements';
import { useI18n } from '@/i18n';

interface BodyFigureProps {
  defs: MeasurementDef[];
  activeKey?: string | null;
  doneKeys: Set<string>;
  onSelect?: (key: string) => void;
  className?: string;
}

const TORSO =
  'M92 63 C80 67 66 69 58 75 C52 80 54 92 55 100 L58 150 C59 170 58 185 59 200 L141 200 C142 185 141 170 142 150 L145 100 C146 92 148 80 142 75 C134 69 120 67 108 63 Z';
const ARM = 'M142 75 C150 80 153 90 153 100 L160 160 L168 214 C169 220 168 226 165 230 L158 230 C156 224 155 218 154 212 L146 165 L145 110 Z';
const LEG = 'M59 200 L100 200 L100 214 L97 260 L95 330 L93 432 L70 432 L69 330 L64 260 C61 240 59 220 59 200 Z';

/** Neutral front-view figure with every measurement drawn as a line. */
export const BodyFigure = memo(function BodyFigure({ defs, activeKey, doneKeys, onSelect, className }: BodyFigureProps) {
  const { t } = useI18n();
  const marked = defs.filter((d) => d.mark);

  return (
    <svg viewBox="0 0 200 460" className={className} role="img" aria-label={t.measurements.title}>
      <g fill="var(--figure)" stroke="var(--figure-line)" strokeWidth="1.2" strokeLinejoin="round">
        <ellipse cx="100" cy="35" rx="16" ry="20" />
        <path d="M92 50 L92 66 L108 66 L108 50 Z" />
        <path d={ARM} />
        <ellipse cx="162" cy="238" rx="6" ry="9" />
        <g transform="translate(200 0) scale(-1 1)">
          <path d={ARM} />
          <ellipse cx="162" cy="238" rx="6" ry="9" />
          <path d={LEG} />
          <ellipse cx="80" cy="440" rx="13" ry="6" />
        </g>
        <path d={LEG} />
        <ellipse cx="80" cy="440" rx="13" ry="6" />
        <path d={TORSO} />
      </g>

      {/* Inactive lines first so the active one is drawn on top. */}
      {[...marked].sort((a, b) => Number(a.key === activeKey) - Number(b.key === activeKey)).map((d) => {
        const m = d.mark!;
        const active = d.key === activeKey;
        const done = doneKeys.has(d.key);
        const color = active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--ink-3)';
        const [x1, y1, x2, y2] = m.kind === 'girth' ? [m.x1, m.y, m.x2, m.y] : [m.x1, m.y1, m.x2, m.y2];
        const dashed = m.kind === 'length' && m.back;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        // Perpendicular unit vector for end ticks.
        const px = (-(y2 - y1) / len) * 4;
        const py = ((x2 - x1) / len) * 4;
        const name = t.measurements.names[d.key] ?? d.key;
        return (
          <g
            key={d.key}
            opacity={active ? 1 : done ? 0.85 : 0.45}
            onClick={onSelect ? () => onSelect(d.key) : undefined}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            <title>{name}</title>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={active ? 3 : 1.8} strokeLinecap="round" strokeDasharray={dashed ? '4 3' : undefined} />
            {m.kind === 'length' ? (
              <>
                <line x1={x1 - px} y1={y1 - py} x2={x1 + px} y2={y1 + py} stroke={color} strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" />
                <line x1={x2 - px} y1={y2 - py} x2={x2 + px} y2={y2 + py} stroke={color} strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx={x1} cy={y1} r={active ? 2.6 : 1.8} fill={color} />
                <circle cx={x2} cy={y2} r={active ? 2.6 : 1.8} fill={color} />
              </>
            )}
            {onSelect && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="14" strokeLinecap="round" />}
          </g>
        );
      })}
    </svg>
  );
});
