import type { Era } from '@/lib/api';

export const ERA_STYLE: Record<Era, { color: string; glow: string; title: string; tagline: string; figure: string }> = {
  rome: {
    color: 'var(--color-rome)',
    glow: 'rgb(194 68 58 / 0.35)',
    title: 'Rome',
    tagline: 'From Republic to Empire',
    figure: 'Julius Caesar',
  },
  egypt: {
    color: 'var(--color-egypt)',
    glow: 'rgb(47 163 160 / 0.35)',
    title: 'Egypt',
    tagline: 'The last queen of the Nile',
    figure: 'Cleopatra',
  },
  napoleon: {
    color: 'var(--color-napoleon)',
    glow: 'rgb(82 119 214 / 0.35)',
    title: 'Napoleon',
    tagline: 'From captain to emperor',
    figure: 'Napoleon Bonaparte',
  },
};

/** Line-art emblems drawn in SVG, so there are no image assets to load or license. */
export function Emblem({ era, className = 'h-16 w-16', animate = false }: { era: Era; className?: string; animate?: boolean }) {
  const stroke = { stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const d = animate ? 'draw' : undefined;
  return (
    <svg viewBox="0 0 64 64" className={className} style={{ color: ERA_STYLE[era].color }} aria-hidden="true">
      {era === 'rome' && (
        <g {...stroke}>
          {/* laurel wreath */}
          <path className={d} d="M32 54c-11-2-19-11-19-23 0-6 2-11 5-15" />
          <path className={d} d="M32 54c11-2 19-11 19-23 0-6-2-11-5-15" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <path d={`M${15 + i * 0.6} ${44 - i * 7}c-5-1-7-4-7-7 3 0 6 2 7 7z`} />
              <path d={`M${49 - i * 0.6} ${44 - i * 7}c5-1 7-4 7-7-3 0-6 2-7 7z`} />
            </g>
          ))}
          <path d="M26 54l6 4 6-4" />
          <text x="32" y="37" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="serif" letterSpacing="1">
            SPQR
          </text>
        </g>
      )}
      {era === 'egypt' && (
        <g {...stroke}>
          {/* sun disk over a pyramid, with the eye */}
          <circle className={d} cx="32" cy="16" r="7" />
          <path className={d} d="M8 54L32 26l24 28z" />
          <path d="M20 54l12-14 12 14" opacity=".5" />
          <path d="M24 45c5-4 11-4 16 0-5 4-11 4-16 0z" />
          <circle cx="32" cy="45" r="2" fill="currentColor" stroke="none" />
          <path d="M32 47v5M36 47c1 3 3 4 5 4" />
        </g>
      )}
      {era === 'napoleon' && (
        <g {...stroke}>
          {/* bicorne hat worn sideways, with the tricolour cockade */}
          <path
            className={d}
            d="M4 44 Q10 40 16 30 Q24 16 32 16 Q40 16 48 30 Q54 40 60 44 Q46 38 32 38 Q18 38 4 44z"
            fill="currentColor"
            fillOpacity=".14"
          />
          <path d="M8 43 Q32 33 56 43" opacity=".55" />
          <circle cx="32" cy="27" r="5" />
          <circle cx="32" cy="27" r="2.2" fill="currentColor" stroke="none" />
          <text x="32" y="58" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif" letterSpacing="2">
            N · 1804
          </text>
        </g>
      )}
    </svg>
  );
}
