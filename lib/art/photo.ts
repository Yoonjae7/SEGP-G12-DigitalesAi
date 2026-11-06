/**
 * The clip Lisa shares: a cut-paper still of Sarah frozen in the middle of her presentation, with a joke caption and the
 * controls of a video. It is a cartoon in the game's own style, never a real photograph or a real person.
 * (The names and the file stay "photo" because the story engine calls it a photo tile.)
 * Drawn in a 240 x 168 box. The shapes are self-contained (no shared defs), so it also works when a scene is
 * turned into a 3D texture.
 */
export const PHOTO_W = 240;
export const PHOTO_H = 168;

const INK = '#1C1B19';
const line = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`;
const FONT = 'font-family="Verdana, Arial, sans-serif" font-weight="700"';

export const PHOTO_INNER = [
  // a soft blur, so the picture looks like a hurried phone recording. The edge and the video controls are drawn crisp, outside the blur.
  `<defs><filter id="photo-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`,
  `<g filter="url(#photo-soft)">`,
  // the lecture room wall, and the projector screen with a slide on it
  `<rect x="-30" y="-30" width="300" height="228" fill="#E7DFCE"/>`,
  `<rect x="112" y="10" width="116" height="78" rx="3" fill="#F8F4EA" ${line}/>`,
  `<rect x="124" y="20" width="58" height="6" rx="2" fill="${INK}" opacity=".55"/>`,
  `<rect x="124" y="32" width="38" height="4" rx="2" fill="${INK}" opacity=".3"/>`,
  `<rect x="128" y="58" width="16" height="22" fill="#4F7080" stroke="${INK}" stroke-width="1.5"/>`,
  `<rect x="150" y="46" width="16" height="34" fill="#B8864F" stroke="${INK}" stroke-width="1.5"/>`,
  `<rect x="172" y="64" width="16" height="16" fill="#6F8F72" stroke="${INK}" stroke-width="1.5"/>`,
  `<rect x="194" y="52" width="16" height="28" fill="#CDBB84" stroke="${INK}" stroke-width="1.5"/>`,
  // Sarah behind the lectern: shoulders (her teal top), neck, head
  `<path d="M16,126 C16,98 38,86 62,86 C86,86 108,98 108,126 Z" fill="#2E7D7A" ${line}/>`,
  `<rect x="52" y="74" width="20" height="16" rx="6" fill="#D9A27C" stroke="${INK}" stroke-width="2"/>`,
  `<ellipse cx="62" cy="54" rx="22" ry="25" fill="#E3B08A" ${line}/>`,
  `<path d="M39,52 C36,28 50,20 64,22 C80,24 88,36 85,54 C80,44 72,38 62,38 C52,38 44,44 39,52 Z" fill="#2B2320" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
  `<path d="M39,52 C37,64 39,74 44,80 C41,70 42,62 44,54 Z" fill="#2B2320"/>`,
  // wide eyes, raised brows, a small open mouth, and a drop of sweat: she has lost her place
  `<circle cx="53" cy="56" r="5" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="72" cy="56" r="5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`,
  `<circle cx="54" cy="57" r="2.2" fill="${INK}"/><circle cx="73" cy="57" r="2.2" fill="${INK}"/>`,
  `<path d="M46,46 q7,-6 14,0 M65,46 q7,-6 14,0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
  `<ellipse cx="62" cy="71" rx="4.5" ry="5.5" fill="#5B1F1F" stroke="${INK}" stroke-width="1.8"/>`,
  `<circle cx="45" cy="64" r="4" fill="#E58A7A" opacity=".55"/><circle cx="80" cy="64" r="4" fill="#E58A7A" opacity=".55"/>`,
  `<path d="M90,40 q5,8 0,13 q-5,-5 0,-13 Z" fill="#CFE8EF" stroke="${INK}" stroke-width="1.4"/>`,
  // the lectern in front of her
  `<rect x="10" y="118" width="104" height="60" rx="4" fill="#8F6A3E" ${line}/>`,
  `<rect x="22" y="128" width="80" height="6" rx="2" fill="#6F4F2C" opacity=".6"/>`,
  `</g>`,
  // the joke caption across the picture
  `<rect x="30" y="100" width="180" height="28" rx="3" fill="${INK}" opacity=".88"/>`,
  `<text x="120" y="120" text-anchor="middle" fill="#fff" font-size="17" ${FONT}>buffering...</text>`,
  // video controls: a play mark, a progress bar and the time
  `<path d="M12,146 L12,160 L24,153 Z" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
  `<rect x="32" y="150" width="150" height="6" rx="3" fill="#fff" opacity=".6"/><rect x="32" y="150" width="62" height="6" rx="3" fill="#E5502B"/>`,
  `<text x="226" y="158" text-anchor="end" fill="#fff" font-size="11" ${FONT} stroke="${INK}" stroke-width=".6">0:12</text>`,
  `<rect x="1.5" y="1.5" width="237" height="165" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="3"/>`,
].join('');

/** The picture as a nested <svg> at x, y, w, h. Used inside the big scene art. */
export function photoNested(x: number, y: number, w: number, h: number): string {
  return `<g><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" preserveAspectRatio="xMidYMid slice">${PHOTO_INNER}</svg>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="2"/></g>`;
}
