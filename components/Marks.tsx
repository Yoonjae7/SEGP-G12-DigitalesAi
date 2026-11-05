import { copy } from '@/lib/copy';

/** Hand-cut marks, drawn for this project. Defined once in SvgDefs. */
export function Mark({ id, size = 72, className = '' }: { id: 'mk-tell' | 'mk-choice' | 'mk-why' | 'mk-see' | 'mk-ticket' | 'mk-lamp'; size?: number; className?: string }) {
  const vb = id === 'mk-ticket' ? '0 0 120 80' : '0 0 80 80';
  const h = id === 'mk-ticket' ? (size * 80) / 120 : size;
  return (
    <svg className={`mk ${className}`} width={size} height={h} viewBox={vb} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

export function Icon({ id, size = 24 }: { id: 'ic-sound' | 'ic-sound-off' | 'ic-settings' | 'ic-exit' | 'ic-back' | 'ic-replay' | 'ic-support'; size?: number }) {
  return (
    <svg className="ic" width={size} height={size} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

/** The photo is never drawn. Always a blurred stripe tile with a label. */
export function PhotoTile({ w = 240, h = 168 }: { w?: number; h?: number }) {
  const label = copy.player.photo;
  return (
    <svg className="photo-tile" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <rect width={w} height={h} fill="url(#photo-stripes)" filter="url(#blur2)" />
      <rect x={w / 2 - 54} y={h / 2 - 15} width={108} height={30} rx={4} fill="#F4EEE3" stroke="#1C1B19" strokeWidth={1.5} />
      <text x={w / 2} y={h / 2 + 5.5} textAnchor="middle" style={{ fontFamily: 'var(--font-body)' }} fontWeight={700} fontSize={15} fill="#1C1B19">
        {label}
      </text>
    </svg>
  );
}
