import { PHOTO_H, PHOTO_INNER, PHOTO_W } from '@/lib/art/photo';
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

export function Icon({ id, size = 24 }: { id: 'ic-sound' | 'ic-sound-off' | 'ic-settings' | 'ic-exit' | 'ic-back' | 'ic-replay' | 'ic-support' | 'ic-next' | 'ic-play' | 'ic-pause'; size?: number }) {
  return (
    <svg className="ic" width={size} height={size} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

/** The photo in the story: a cut-paper cartoon of Sarah asleep on the bus. Never a real photograph. */
export function PhotoTile({ w = 240, h = 168 }: { w?: number; h?: number }) {
  return (
    <svg
      className="photo-tile" viewBox={`0 0 ${PHOTO_W} ${PHOTO_H}`} width={w} height={h} role="img" aria-label={copy.player.photo}
      preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: PHOTO_INNER }}
    />
  );
}
