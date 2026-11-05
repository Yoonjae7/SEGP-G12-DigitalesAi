/**
 * The "photo" Lisa posts: a cut-paper picture of Sarah asleep on the bus with her mouth open.
 * It is a cartoon in the game's own style, never a real photograph, and no real person is shown.
 * Drawn in a 240 x 168 box. The shapes are self-contained (no shared defs), so it also works when a scene is
 * turned into a 3D texture.
 */
export const PHOTO_W = 240;
export const PHOTO_H = 168;

const INK = '#1C1B19';
const line = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`;

export const PHOTO_INNER = [
  // bus wall and window with a passing city
  // a soft blur, so the picture looks like a hurried phone shot. The edge is drawn crisp, outside the blur.
  `<defs><filter id="photo-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`,
  `<g filter="url(#photo-soft)">`,
  `<rect x="-30" y="-30" width="300" height="228" fill="#E7DFCE"/>`,
  `<rect x="128" y="14" width="100" height="74" rx="5" fill="#CFE8EF" ${line}/>`,
  `<path d="M131,87 V60 h13 V46 h16 V62 h12 V38 h18 V57 h14 V50 h13 V87 Z" fill="#8FB0B8" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
  `<circle cx="208" cy="29" r="8" fill="#F0C75E"/>`,
  // seat back and headrest
  `<rect x="22" y="44" width="146" height="130" rx="22" fill="#B8864F" ${line}/>`,
  `<rect x="70" y="22" width="84" height="52" rx="16" fill="#A5733E" ${line}/>`,
  // neck and shoulders (Sarah's teal)
  `<rect x="102" y="92" width="20" height="26" rx="6" fill="#D9A27C" stroke="${INK}" stroke-width="2"/>`,
  `<path d="M44,168 C44,128 74,110 112,110 C150,110 180,128 180,168 Z" fill="#2E7D7A" ${line}/>`,
  // head, tipped back against the seat
  `<g transform="rotate(-16 112 74)">`,
  `<ellipse cx="112" cy="72" rx="27" ry="30" fill="#E3B08A" ${line}/>`,
  `<path d="M84,70 C80,42 98,36 114,38 C134,40 144,54 139,72 C134,60 124,54 112,54 C100,54 90,60 84,70 Z" fill="#2B2320" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
  `<path d="M84,70 C82,82 84,92 90,98 C86,88 87,80 90,72 Z" fill="#2B2320"/>`,
  `<path d="M96,72 q6,5 12,0 M118,72 q6,5 12,0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  `<path d="M96,65 q6,-3 12,0 M118,65 q6,-3 12,0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  `<circle cx="97" cy="84" r="5" fill="#E58A7A" opacity=".55"/><circle cx="127" cy="84" r="5" fill="#E58A7A" opacity=".55"/>`,
  `<ellipse cx="112" cy="90" rx="9" ry="11" fill="#5B1F1F" stroke="${INK}" stroke-width="2"/>`,
  `<ellipse cx="112" cy="96" rx="5.5" ry="3.5" fill="#D96B6B"/>`,
  `<path d="M120,94 q4,8 1,15" fill="none" stroke="#CFE8EF" stroke-width="3" stroke-linecap="round"/>`,
  `<circle cx="121" cy="112" r="2.6" fill="#CFE8EF" stroke="${INK}" stroke-width="1"/>`,
  `</g>`,
  // bag on her lap and hands
  `<rect x="64" y="136" width="96" height="44" rx="10" fill="#3F6B4F" ${line}/>`,
  `<path d="M84,136 q28,-18 56,0" fill="none" stroke="${INK}" stroke-width="3"/>`,
  `<ellipse cx="84" cy="143" rx="11" ry="7" fill="#E3B08A" stroke="${INK}" stroke-width="2"/>`,
  `<ellipse cx="140" cy="143" rx="11" ry="7" fill="#E3B08A" stroke="${INK}" stroke-width="2"/>`,
  // zzz
  `<path d="M148,50 h8 l-8,10 h8 M160,34 h11 l-11,13 h11 M176,16 h13 l-13,15 h13" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  // handrail in front, and a thin photo edge
  `<rect x="190" y="0" width="7" height="168" fill="#9A978F" stroke="${INK}" stroke-width="1.5"/>`,
  `</g>`,
  `<rect x="1.5" y="1.5" width="237" height="165" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="3"/>`,
].join('');

/** The picture as a nested <svg> at x, y, w, h. Used inside the big scene art. */
export function photoNested(x: number, y: number, w: number, h: number): string {
  return `<g><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" preserveAspectRatio="xMidYMid slice">${PHOTO_INNER}</svg>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="2"/></g>`;
}
