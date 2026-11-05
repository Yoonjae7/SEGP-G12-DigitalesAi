import { DEFS_MARKUP } from '@/lib/art/defs';

/** Filters, skies, the photo-tile pattern, marks and icons. Rendered once, then used by id. */
export function SvgDefs() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: `<defs>${DEFS_MARKUP}</defs>` }} />;
}
