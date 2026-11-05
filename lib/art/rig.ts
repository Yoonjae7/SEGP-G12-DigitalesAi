// @ts-nocheck
// Ported from the approved design pack (design/js/rig.js). It writes SVG strings, so it is not type-annotated.
/* DigiTales AI: character rig (Phase 1 preview)
   A 2D cut-out version of the matte-clay cast. Same joints, same pose table, same colours
   as the planned 3D build (react-three-fiber). This is also the "Simple visuals" fallback.
   Units: 1u = 1/96 of a standard figure. Origin is the feet, y points down. Light is top-left. */
  const INK = '#1C1B19', OW = 0.85, NIGHT = '#10242B';
  let UID = 0;
  const RAD = Math.PI / 180;

  /* ---------- colour helpers ---------- */
  const rgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * p)); };
  const dark = (c, p) => mix(c, NIGHT, p);       // shadows lean cool, never black
  const lite = (c, p) => mix(c, '#FFF6E0', p);
  const n2 = n => Math.round(n * 100) / 100;

  /* ---------- cast ---------- */
  const CHARS = {
    sarah: { name: 'Sarah', ht: .80, wf: 1.0, hf: 1.0, fy: 0, skin: '#9A6A47', hair: '#241915', top: '#2E7D7A', bottom: '#38404D', shoe: '#2A2623', style: 'braid', glasses: true, scarf: '#C99A2E', pack: '#6B7A3E' },
    lisa:  { name: 'Lisa',  ht: 1.0, wf: 1.0, hf: 1.0, fy: 0, skin: '#F2CFB3', hair: '#8A4B2A', top: '#F0C75E', bottom: '#4F6D8F', shoe: '#F4EEE3', style: 'ponytail', coat: true, socks: true },
    marco: { name: 'Marco', ht: .87, wf: 1.32, hf: 1.1, fy: 1.6, skin: '#6B4129', hair: '#1F1612', top: '#8F8E88', bottom: '#6E6350', shoe: '#2A2623', style: 'beanie', beanie: '#2F5D3A' },
    dev:   { name: 'Dev',   ht: .96, wf: .80, hf: .94, fy: 0, skin: '#D3A57C', hair: '#2B2420', top: '#37393D', bottom: '#202226', shoe: '#C9C4B6', style: 'messy', hoodie: true, phones: '#C9C4B6' },
    you:   { name: 'You',   ht: .90, wf: 1.0, hf: 1.0, fy: 0, skin: '#C79A74', hair: '#3A2D26', top: '#9A978F', bottom: '#24272D', shoe: '#2A2623', style: 'short' }
  };

  /* ---------- pose table: joint rotations, eased 400 to 600 ms ----------
     L/R = [shoulder, elbow]. Shoulder: angle of the upper arm from hanging straight down, + moves away from the body.
     Elbow: extra turn of the forearm, + opens outward and up, - folds inward.
     lean = whole upper body about the hips. tilt = head roll. pitch = head nod (+ down). rise = shoulders up.
     drop = upper body sinks. stance = feet apart. yaw = turn of body and face away from camera (0 to 1). */
  const POSES = {
    'idle-breathe':  { L: [7, -7],    R: [7, -7],    lean: 0,  tilt: 0,  pitch: 0,   rise: 0,   drop: 0,   stance: 0,   yaw: 0 },
    'look-phone':    { L: [-8, -118], R: [-8, -118], lean: 2,  tilt: 0,  pitch: .9,  rise: 0,   drop: .5,  stance: 0,   yaw: 0, prop: 'phone' },
    'laugh':         { L: [44, 12],   R: [-4, -88],  lean: -3, tilt: -7, pitch: -.7, rise: .5,  drop: 0,   stance: 1,   yaw: 0 },
    'shrug':         { L: [48, 80],   R: [48, 80],   lean: 0,  tilt: 6,  pitch: 0,   rise: 2.2, drop: 0,   stance: 0,   yaw: 0 },
    'turn-away':     { L: [-6, -104], R: [-6, -104], lean: 3,  tilt: -3, pitch: .2,  rise: 0,   drop: 0,   stance: 0,   yaw: .85 },
    'hands-to-head': { L: [105, 95],  R: [105, 95],  lean: 1,  tilt: 0,  pitch: .3,  rise: 1,   drop: 0,   stance: 0,   yaw: 0 },
    'slump':         { L: [4, -4],    R: [4, -4],    lean: 5,  tilt: -4, pitch: .9,  rise: -1,  drop: 2.5, stance: 0,   yaw: 0 },
    'stand-firm':    { L: [14, -2],   R: [14, -2],   lean: 0,  tilt: 0,  pitch: -.2, rise: .5,  drop: 0,   stance: 3.5, yaw: 0 },
    'reach-out':     { L: [8, -8],    R: [82, 8],    lean: 2,  tilt: 5,  pitch: 0,   rise: 0,   drop: 0,   stance: 0,   yaw: 0 }
  };

  /* ---------- expressions: brows, eyes, mouth. Faces are two dots, brow lines, a small mouth. ---------- */
  const EXPR = {
    calm:        { t: 0,   lift: [0, 0],      eye: 'dot',  m: 'soft' },
    worried:     { t: 15,  lift: [-1, -1],    eye: 'dot',  m: 'wobble' },
    hurt:        { t: 19,  lift: [0, 0],      eye: 'down', m: 'frown' },
    steady:      { t: -4,  lift: [0, 0],      eye: 'dot',  m: 'set' },
    laughing:    { t: -7,  lift: [-2.2, -2.2], eye: 'dot', m: 'laugh', blush: 1 },
    smirk:       { t: -6,  lift: [0, -2.4],   eye: 'dot',  m: 'smirk' },
    defensive:   { t: -17, lift: [0, 0],      eye: 'dot',  m: 'grimace' },
    ashamed:     { t: 10,  lift: [0, 0],      eye: 'down', m: 'flatLow', blush: 1 },
    sorry:       { t: 21,  lift: [-.5, -.5],  eye: 'dot',  m: 'softFrown' },
    amused:      { t: -3,  lift: [-1.4, -1.4], eye: 'dot', m: 'smile' },
    shrugF:      { t: 6,   lift: [-2.2, -2.2], eye: 'dot', m: 'flatTilt' },
    embarrassed: { t: 12,  lift: [-1, -1],    eye: 'down', m: 'wobble', blush: 1 },
    flat:        { t: 0,   lift: [0, 0],      eye: 'dot',  m: 'flat' },
    bored:       { t: 0,   lift: [.6, .6],    eye: 'half', m: 'flatSm' },
    uneasy:      { t: 11,  lift: [0, -1.4],   eye: 'dot',  m: 'wobble' }
  };
  const EXPR_SETS = {
    sarah: [['calm', 'Calm'], ['worried', 'Worried'], ['hurt', 'Hurt'], ['steady', 'Steady']],
    lisa:  [['laughing', 'Laughing'], ['smirk', 'Smirk'], ['defensive', 'Defensive'], ['ashamed', 'Ashamed'], ['sorry', 'Sorry']],
    marco: [['amused', 'Amused'], ['shrugF', 'Shrug'], ['embarrassed', 'Embarrassed']],
    dev:   [['flat', 'Flat'], ['bored', 'Bored'], ['uneasy', 'Uneasy']],
    you:   []
  };

  /* ---------- drawing primitives ---------- */
  const ell = (cx, cy, rx, ry) => `M${n2(cx - rx)},${n2(cy)} a${n2(rx)},${n2(ry)} 0 1,0 ${n2(2 * rx)},0 a${n2(rx)},${n2(ry)} 0 1,0 ${n2(-2 * rx)},0 Z`;
  const rrect = (x, y, w, h, r) => `M${n2(x + r)},${n2(y)} H${n2(x + w - r)} Q${n2(x + w)},${n2(y)} ${n2(x + w)},${n2(y + r)} V${n2(y + h - r)} Q${n2(x + w)},${n2(y + h)} ${n2(x + w - r)},${n2(y + h)} H${n2(x + r)} Q${n2(x)},${n2(y + h)} ${n2(x)},${n2(y + h - r)} V${n2(y + r)} Q${n2(x)},${n2(y)} ${n2(x + r)},${n2(y)} Z`;

  // one clay piece: base fill, one shade step, one highlight step, thin ink outline (the "inverted hull" look)
  function part(d, fill, bb, o) {
    o = o || {};
    const id = 'rc' + (++UID), x0 = bb[0], y0 = bb[1], x1 = bb[2], y1 = bb[3], w = x1 - x0, h = y1 - y0;
    let s = `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${fill}"/>`;
    if (o.shade !== false) s += `<polygon points="${n2(x0 + .62 * w)},${n2(y0 - 1)} ${n2(x1 + 1)},${n2(y0 - 1)} ${n2(x1 + 1)},${n2(y1 + 1)} ${n2(x0 + .36 * w)},${n2(y1 + 1)}" fill="${dark(fill, .2)}"/>`;
    if (o.hl !== false && w > 8) s += `<polygon points="${n2(x0 - 1)},${n2(y0 - 1)} ${n2(x0 + .34 * w)},${n2(y0 - 1)} ${n2(x0 + .15 * w)},${n2(y0 + .5 * h)} ${n2(x0 - 1)},${n2(y0 + .58 * h)}" fill="${lite(fill, .16)}"/>`;
    s += `</g><path d="${d}" fill="none" stroke="${INK}" stroke-width="${OW}" stroke-linejoin="round"/>`;
    return s;
  }
  // a round-ended limb with ink outline and one shade stripe
  function limb(pts, w, fill) {
    const d = 'M' + pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' L');
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n2(w + OW * 2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="${d}" transform="translate(${n2(w * .2)} 0)" fill="none" stroke="${dark(fill, .2)}" stroke-width="${n2(w * .3)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const hand = (x, y, skin) => part(ell(x, y, 3.7, 3.7), skin, [x - 3.7, y - 3.7, x + 3.7, y + 3.7], { hl: false });
  const torsoPath = (tw, bw, top, bot, r) => `M${n2(-tw + r)},${top} H${n2(tw - r)} Q${tw},${top} ${tw},${n2(top + r)} L${bw},${n2(bot - r)} Q${bw},${bot} ${n2(bw - r)},${bot} H${n2(-bw + r)} Q${-bw},${bot} ${-bw},${n2(bot - r)} L${-tw},${n2(top + r)} Q${-tw},${top} ${n2(-tw + r)},${top} Z`;
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c || INK}" stroke-width="${w == null ? .55 : w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---------- face ---------- */
  function mouthPath(k, w) {
    switch (k) {
      case 'soft':      return [`M${-w * .5},0 Q0,${w * .26} ${w * .5},0`];
      case 'smile':     return [`M${-w * .6},${-w * .06} Q0,${w * .52} ${w * .6},${-w * .06}`];
      case 'smirk':     return [`M${-w * .5},${w * .12} Q${-w * .05},${w * .24} ${w * .5},${-w * .22}`];
      case 'laugh':     return [`M${-w * .68},${-w * .08} Q0,${w * .12} ${w * .68},${-w * .08} Q0,${w * 1.05} ${-w * .68},${-w * .08} Z`, INK];
      case 'frown':     return [`M${-w * .5},${w * .2} Q0,${-w * .28} ${w * .5},${w * .2}`];
      case 'softFrown': return [`M${-w * .38},${w * .12} Q0,${-w * .1} ${w * .38},${w * .12}`];
      case 'wobble':    return [`M${-w * .5},0 q${w * .125},${-w * .22} ${w * .25},0 t${w * .25},0 t${w * .25},0 t${w * .25},0`];
      case 'set':       return [`M${-w * .42},${-w * .02} L${w * .42},${-w * .02}`];
      case 'grimace':   return [`M${-w * .62},${-w * .1} L${-w * .46},${w * .1} L${w * .46},${w * .1} L${w * .62},${-w * .1}`];
      case 'flatLow':   return [`M${-w * .36},${w * .2} L${w * .36},${w * .2}`];
      case 'flatTilt':  return [`M${-w * .45},${w * .1} L${w * .45},${-w * .08}`];
      case 'flatSm':    return [`M${-w * .3},0 L${w * .3},0`];
      default:          return [`M${-w * .45},0 L${w * .45},0`];
    }
  }
  function face(exKey, o) {
    const E = EXPR[exKey] || EXPR.calm, yaw = o.yaw || 0, hf = o.hf || 1;
    const e = 6.2 * hf * (1 - .32 * Math.abs(yaw));
    const cx = o.cx + yaw * 5.2, cy = o.cy + (o.fy || 0) + o.pitch * 2.0 + .8;
    const lx = cx - e, rx = cx + e;
    let s = '';
    if (E.blush) s += `<ellipse cx="${n2(lx - 1.8)}" cy="${n2(cy + 3.6)}" rx="2.4" ry="1.3" fill="#C85A55" opacity=".38"/><ellipse cx="${n2(rx + 1.8)}" cy="${n2(cy + 3.6)}" rx="2.4" ry="1.3" fill="#C85A55" opacity=".38"/>`;
    const eyes = x => {
      if (E.eye === 'half') return `<circle cx="${n2(x)}" cy="${n2(cy)}" r="1.6" fill="${INK}"/><path d="M${n2(x - 2.1)},${n2(cy + .3)} A2.1,2.1 0 0 1 ${n2(x + 2.1)},${n2(cy + .3)} Z" fill="${o.skin}"/>` + line(`M${n2(x - 2.4)},${n2(cy + .3)} L${n2(x + 2.4)},${n2(cy + .3)}`, .7);
      return `<circle cx="${n2(x)}" cy="${n2(cy + (E.eye === 'down' ? 1.1 : 0))}" r="${E.eye === 'down' ? 1.4 : 1.6}" fill="${INK}"/>`;
    };
    s += eyes(lx) + eyes(rx);
    if (o.glasses) {
      const gl = x => `<circle cx="${n2(x)}" cy="${n2(cy)}" r="4.5" fill="#CFE8EF" fill-opacity=".22" stroke="${INK}" stroke-width=".6"/>`;
      s += gl(lx) + gl(rx) + line(`M${n2(lx + 4.5)},${n2(cy - .4)} Q${n2(cx)},${n2(cy - 1.6)} ${n2(rx - 4.5)},${n2(cy - .4)}`, .6) +
           line(`M${n2(lx - 4.5)},${n2(cy - .6)} L${n2(lx - 7)},${n2(cy - 1.4)}`, .6) + line(`M${n2(rx + 4.5)},${n2(cy - .6)} L${n2(rx + 7)},${n2(cy - 1.4)}`, .6);
    }
    const by = cy - 4.4 - (o.glasses ? 1.2 : 0), bl = 2.4;
    s += `<path d="M${n2(lx - bl)},${n2(by + E.lift[0])} L${n2(lx + bl)},${n2(by + E.lift[0])}" transform="rotate(${-E.t} ${n2(lx)} ${n2(by + E.lift[0])})" fill="none" stroke="${INK}" stroke-width="1.05" stroke-linecap="round"/>`;
    s += `<path d="M${n2(rx - bl)},${n2(by + E.lift[1])} L${n2(rx + bl)},${n2(by + E.lift[1])}" transform="rotate(${E.t} ${n2(rx)} ${n2(by + E.lift[1])})" fill="none" stroke="${INK}" stroke-width="1.05" stroke-linecap="round"/>`;
    const mp = mouthPath(E.m, 5.6 * hf), my = cy + 6.1;
    s += `<path d="${mp[0]}" transform="translate(${n2(cx)} ${n2(my)})" fill="${mp[1] || 'none'}" stroke="${INK}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  }
  function faceSide(exKey, o) {
    const E = EXPR[exKey] || EXPR.calm, hf = o.hf || 1;
    const x = o.cx + 6.6 * hf, cy = o.cy + (o.fy || 0) + o.pitch * 2.0 + .8;
    let s = `<circle cx="${n2(x)}" cy="${n2(cy + (E.eye === 'down' ? 1.1 : 0))}" r="1.55" fill="${INK}"/>`;
    if (E.eye === 'half') s += `<path d="M${n2(x - 2.1)},${n2(cy + .3)} A2.1,2.1 0 0 1 ${n2(x + 2.1)},${n2(cy + .3)} Z" fill="${o.skin}"/>` + line(`M${n2(x - 2.4)},${n2(cy + .3)} L${n2(x + 2.4)},${n2(cy + .3)}`, .7);
    if (o.glasses) s += `<ellipse cx="${n2(x - .4)}" cy="${n2(cy)}" rx="3.2" ry="4.4" fill="#CFE8EF" fill-opacity=".22" stroke="${INK}" stroke-width=".6"/>` + line(`M${n2(x - 3.4)},${n2(cy - .6)} L${n2(o.cx - 10 * hf)},${n2(cy - 1.4)}`, .6);
    const by = cy - 4.4 - (o.glasses ? 1.2 : 0);
    s += `<path d="M${n2(x - 2.4)},${n2(by + E.lift[0])} L${n2(x + 2.2)},${n2(by + E.lift[0])}" transform="rotate(${E.t * .8} ${n2(x)} ${n2(by)})" fill="none" stroke="${INK}" stroke-width="1.05" stroke-linecap="round"/>`;
    const mp = mouthPath(E.m, 4.1 * hf);
    s += `<path d="${mp[0]}" transform="translate(${n2(o.cx + 11 * hf)} ${n2(cy + 6.1)})" fill="${mp[1] || 'none'}" stroke="${INK}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  }

  /* ---------- head, by view ---------- */
  function head(C, view, o) {
    const hy = -79, rx = 16 * C.hf, ry = 14;
    let behind = '', front = '';
    const skinHead = (x, w) => part(ell(x, hy, w, ry), C.skin, [x - w, hy - ry, x + w, hy + ry]);
    const fo = { cx: 0, cy: hy, yaw: o.yaw, pitch: o.pitch, hf: C.hf, skin: C.skin, glasses: C.glasses, fy: C.fy };

    if (view === 'front') {
      // hair or hat that sits behind the head
      if (C.style === 'ponytail') behind += part(`M${n2(rx * .0)},${hy - ry + 3} C${n2(-rx * .1)},${hy - ry - 15} ${n2(rx * 1.15)},${hy - ry - 19} ${n2(rx * 1.6)},${hy - ry - 4} C${n2(rx * 1.78)},${hy - ry + 4} ${n2(rx * 1.6)},${hy - ry + 10} ${n2(rx * 1.4)},${hy - ry + 11} C${n2(rx * 1.45)},${hy - ry} ${n2(rx * 1.0)},${hy - ry - 9} ${n2(rx * .55)},${hy - ry + 3} Z`, C.hair, [0, hy - ry - 18, rx * 1.8, hy - ry + 11], { hl: false });
      front += skinHead(0, rx);
      front += face(o.expr, fo);
      if (C.style === 'braid' || C.style === 'short' || C.style === 'ponytail') {
        const fr = C.style === 'short' ? .5 : .62;
        front += part(`M${n2(-rx - .8)},${hy + 3} C${n2(-rx - 1.6)},${n2(hy - ry * 1.4)} ${n2(rx + 1.6)},${n2(hy - ry * 1.4)} ${n2(rx + .8)},${hy + 3} C${n2(rx * .82)},${n2(hy - ry * .12)} ${n2(rx * .5)},${n2(hy - ry * fr)} ${n2(rx * .05)},${n2(hy - ry * (fr - .06))} C${n2(-rx * .4)},${n2(hy - ry * .5)} ${n2(-rx * .9)},${n2(hy - ry * .2)} ${n2(-rx - .8)},${hy + 3} Z`, C.hair, [-rx - 2, hy - ry * 1.3, rx + 2, hy + 3]);
      }
      if (C.style === 'ponytail') front += part(rrect(rx * .1, hy - ry - .6, rx * .42, 3.8, 1.4), '#4F6D8F', [rx * .1, hy - ry - .6, rx * .52, hy - ry + 3.2], { hl: false });
      if (C.style === 'messy') {
        front += part(`M${n2(-rx - .6)},${hy + 1} C${n2(-rx - 1)},${n2(hy - ry * 1.25)} ${n2(rx + 1)},${n2(hy - ry * 1.25)} ${n2(rx + .6)},${hy + 1} C${n2(rx * .6)},${n2(hy - ry * .35)} ${n2(rx * .2)},${n2(hy - ry * .6)} ${n2(-rx * .2)},${n2(hy - ry * .42)} C${n2(-rx * .55)},${n2(hy - ry * .62)} ${n2(-rx * .85)},${n2(hy - ry * .3)} ${n2(-rx - .6)},${hy + 1} Z`, C.hair, [-rx - 1, hy - ry * 1.2, rx + 1, hy + 1]);
        front += part(`M${n2(-rx * .5)},${n2(hy - ry * .78)} l${n2(-1.8)},-5.2 l5.4,3.2 Z M${n2(rx * .05)},${n2(hy - ry * .86)} l1.2,-5.6 l4,4.6 Z M${n2(rx * .55)},${n2(hy - ry * .76)} l3.6,-4.6 l.4,5.6 Z`, C.hair, [-rx, hy - ry * 1.4, rx, hy - ry], { hl: false, shade: false });
      }
      if (C.style === 'beanie') {
        front += part(`M${n2(-rx - 1)},${n2(hy - ry * .4)} C${n2(-rx - 1)},${n2(hy - ry * 1.6)} ${n2(rx + 1)},${n2(hy - ry * 1.6)} ${n2(rx + 1)},${n2(hy - ry * .4)} Z`, C.beanie, [-rx - 1, hy - ry * 1.4, rx + 1, hy - ry * .4]);
        front += part(rrect(-rx - 1.6, hy - ry * .84, 2 * rx + 3.2, ry * .46, 2), mix(C.beanie, '#FFF6E0', .1), [-rx - 1.6, hy - ry * .84, rx + 1.6, hy - ry * .38]);
        front += line(`M${n2(-rx)},${n2(hy - ry * .62)} L${n2(rx)},${n2(hy - ry * .62)}`, .4, dark(C.beanie, .5));
        front += part(ell(0, hy - ry * 1.42, 2.8, 2.8), C.beanie, [-2.8, hy - ry * 1.42 - 2.8, 2.8, hy - ry * 1.42 + 2.8], { hl: false });
      }
    } else if (view === 'back') {
      if (C.style === 'ponytail') behind += part(`M${n2(-rx * .22)},${hy - ry + 1} C${n2(-rx * .3)},${hy - ry - 5} ${n2(rx * .3)},${hy - ry - 5} ${n2(rx * .25)},${hy - ry + 1} C${n2(rx * .95)},${hy - ry + 3} ${n2(rx * 1.05)},${hy + 6} ${n2(rx * .55)},${hy + 20} C${n2(rx * .1)},${hy + 18} ${n2(-rx * .55)},${hy + 18} ${n2(-rx * .7)},${hy + 8} C${n2(-rx * .8)},${hy - 2} ${n2(-rx * .5)},${hy - ry + 2} ${n2(-rx * .22)},${hy - ry + 1} Z`, C.hair, [-rx, hy - ry - 6, rx, hy + 20], { hl: false });
      front += part(ell(0, hy, rx + .4, ry + .4), C.hair, [-rx, hy - ry, rx, hy + ry]);
      front += line(`M0,${hy - ry} Q${n2(rx * .12)},${hy - 4} ${n2(-rx * .05)},${hy + 6}`, .5, dark(C.hair, .5));
      if (C.style === 'ponytail') front += part(rrect(-3.2, hy - ry - 1.2, 6.4, 3.4, 1.4), '#4F6D8F', [-3.2, hy - ry - 1.2, 3.2, hy - ry + 2.2], { hl: false });
      if (C.style === 'beanie') {
        front += part(`M${n2(-rx - 1)},${n2(hy + ry * .12)} C${n2(-rx - 1)},${n2(hy - ry * 1.55)} ${n2(rx + 1)},${n2(hy - ry * 1.55)} ${n2(rx + 1)},${n2(hy + ry * .12)} Z`, C.beanie, [-rx - 1, hy - ry * 1.4, rx + 1, hy + ry * .12]);
        front += part(rrect(-rx - 1.6, hy - ry * .1, 2 * rx + 3.2, ry * .42, 2), mix(C.beanie, '#FFF6E0', .1), [-rx - 1.6, hy - ry * .1, rx + 1.6, hy + ry * .32]);
        front += part(ell(0, hy - ry * 1.4, 2.8, 2.8), C.beanie, [-2.8, hy - ry * 1.4 - 2.8, 2.8, hy - ry * 1.4 + 2.8], { hl: false });
      }
      if (C.style === 'messy') front += part(`M${n2(-rx * .5)},${n2(hy - ry * .78)} l${n2(-1.8)},-5.2 l5.4,3.2 Z M${n2(rx * .05)},${n2(hy - ry * .86)} l1.2,-5.6 l4,4.6 Z M${n2(rx * .55)},${n2(hy - ry * .76)} l3.6,-4.6 l.4,5.6 Z`, C.hair, [-rx, hy - ry * 1.4, rx, hy - ry], { hl: false, shade: false });
    } else { // side, facing right
      const w = rx * .94;
      if (C.style === 'ponytail') behind += part(`M${n2(-w * .15)},${hy - ry + 2} C${n2(-w * .5)},${hy - ry - 16} ${n2(-w * 2.0)},${hy - ry - 16} ${n2(-w * 2.05)},${hy - ry + 4} C${n2(-w * 2.05)},${hy - ry + 10} ${n2(-w * 1.8)},${hy - ry + 14} ${n2(-w * 1.65)},${hy - ry + 15} C${n2(-w * 1.7)},${hy - ry + 2} ${n2(-w * 1.2)},${hy - ry - 6} ${n2(-w * .7)},${hy - ry + 6} Z`, C.hair, [-w * 2.1, hy - ry - 14, -w * .1, hy - ry + 15], { hl: false });
      front += skinHead(.5, w);
      front += faceSide(o.expr, Object.assign({}, fo, { cx: .5 }));
      if (C.style === 'braid' || C.style === 'short' || C.style === 'ponytail' || C.style === 'messy')
        front += part(`M${n2(-w + .4)},${hy + 5} C${n2(-w - 1.4)},${n2(hy - ry * 1.35)} ${n2(w + 2)},${n2(hy - ry * 1.45)} ${n2(w + 1.5)},${hy - 3} C${n2(w * .7)},${n2(hy - ry * .5)} ${n2(w * .3)},${n2(hy - ry * .4)} ${n2(-w * .1)},${hy - 1} C${n2(-w * .2)},${hy + 2} ${n2(-w * .3)},${hy + 4} ${n2(-w * .35)},${hy + 5} Z`, C.hair, [-w - 1, hy - ry * 1.3, w + 2, hy + 5]);
      if (C.style === 'ponytail') front += part(rrect(-w * .62, hy - ry + .6, 5, 3.6, 1.4), '#4F6D8F', [-w * .62, hy - ry + .6, -w * .62 + 5, hy - ry + 4.2], { hl: false });
      if (C.style === 'beanie') {
        front += part(`M${n2(-w - 2)},${n2(hy - ry * .4)} C${n2(-w - 2)},${n2(hy - ry * 1.6)} ${n2(w + 3)},${n2(hy - ry * 1.6)} ${n2(w + 2.4)},${n2(hy - ry * .4)} Z`, C.beanie, [-w - 2, hy - ry * 1.4, w + 3, hy - ry * .4]);
        front += part(rrect(-w - 2, hy - ry * .84, 2 * w + 5, ry * .46, 2), mix(C.beanie, '#FFF6E0', .1), [-w - 2, hy - ry * .84, w + 3, hy - ry * .38]);
        front += part(ell(.5, hy - ry * 1.42, 2.8, 2.8), C.beanie, [-2.3, hy - ry * 1.42 - 2.8, 3.3, hy - ry * 1.42 + 2.8], { hl: false });
      }
    }
    return { behind, front };
  }

  /* ---------- the whole figure ---------- */
  function figure(id, o) {
    const C = CHARS[id];
    let view = o.view;
    if (id === 'you') view = 'back';                              // the learner is never shown from the front, or in profile
    const base = POSES['idle-breathe'];
    let P = Object.assign({}, base, o.poseData || POSES[o.pose] || {});
    if (view === 'side' && !{ 'idle-breathe': 1, 'look-phone': 1, 'slump': 1, 'stand-firm': 1 }[o.pose]) P = Object.assign({}, P, { L: base.L, R: base.R });
    const yaw = o.yaw != null ? o.yaw : P.yaw;
    const wf = C.wf * (view === 'front' || view === 'back' ? (1 - .3 * Math.abs(yaw)) : 1);
    const tw = 14.2 * wf, bw = (C.coat ? 19.5 : 15.2) * wf, top = -64, bot = C.coat ? -21 : -28;
    const sideW = 8.2 * Math.pow(C.wf, .7);
    let body = '';

    /* behind the body */
    if (view === 'front' && id === 'sarah') body += part(rrect(-15.5, -61, 31, 28, 6), C.pack, [-15.5, -61, 15.5, -33]);
    if (view === 'side' && id === 'sarah') body += part(rrect(-sideW - 9, -61, 11, 29, 5), C.pack, [-sideW - 9, -61, -sideW + 2, -32]);

    /* legs */
    const st = P.stance || 0;
    const legCol = C.bottom;
    const shoeAt = (ax, fwd, flat) => part(ell(ax + fwd, -3.4, flat ? 7 : 6.4, 3.7), C.shoe, [ax + fwd - 7, -7, ax + fwd + 7, 0.3], { hl: false });
    if (view === 'side') {
      const far = limb([[-1.5, -30], [-5.5 - st * .4, -9]], 9, dark(legCol, .25));
      const near = limb([[1.5, -30], [4 + st * .5, -9]], 9, legCol);
      body += far + shoeAt(-5.5 - st * .4, 2.6, true) + near;
      if (C.socks) body += limb([[4 + st * .5, -11], [4 + st * .5, -6]], 7, '#F4EEE3') + line(`M${n2(4 + st * .5 - 3.2)},-9.4 L${n2(4 + st * .5 + 3.2)},-9.4`, .9);
      body += shoeAt(4 + st * .5, 2.6, true);
    } else {
      const sw = 5.2 * Math.min(1.25, C.wf);
      [-1, 1].forEach(sd => {
        const hx = sd * sw, ax = sd * (sw + st);
        if (C.socks) {
          body += limb([[hx, -30], [ax, -12]], 9.6, legCol);
          body += limb([[ax, -12], [ax, -6]], 7, '#F4EEE3');
          body += line(`M${n2(ax - 3.2)},-9.4 L${n2(ax + 3.2)},-9.4 M${n2(ax - 3.2)},-7.4 L${n2(ax + 3.2)},-7.4`, .9, '#1C1B19');
        } else body += limb([[hx, -30], [ax, -7]], 9.6, legCol);
        body += shoeAt(ax, sd * .7, false);
      });
    }

    /* upper body group: lean + drop */
    let up = '';
    const shY = -61 - P.rise;
    const armCol = C.top;
    const joints = (sd, a, e, L1, L2, sx) => {
      const p1 = a * RAD, p2 = (a + e) * RAD;
      let d1, d2;
      if (view === 'side') { d1 = [Math.sin(-p1), Math.cos(p1)]; d2 = [Math.sin(-p2), Math.cos(p2)]; }
      else { d1 = [sd * Math.sin(p1), Math.cos(p1)]; d2 = [sd * Math.sin(p2), Math.cos(p2)]; }
      const sy = shY, el = [sx + d1[0] * L1, sy + d1[1] * L1], hd = [el[0] + d2[0] * L2, el[1] + d2[1] * L2];
      return { s: [sx, sy], e: el, h: hd };
    };
    const drawArm = (j, sd, far) => {
      let col = far ? dark(armCol, .25) : armCol;
      return limb([j.s, j.e, j.h], 7.4, col) + (far ? part(ell(j.h[0], j.h[1], 3.7, 3.7), dark(C.skin, .22), [j.h[0] - 3.7, j.h[1] - 3.7, j.h[0] + 3.7, j.h[1] + 3.7], { hl: false, shade: false }) : hand(j.h[0], j.h[1], C.skin));
    };

    // torso + clothes
    let torso = '';
    if (view === 'side') {
      const sw = sideW, belly = C.wf > 1.2 ? 3.5 : 0;
      torso += part(`M${-sw},${top + 5} Q${-sw},${top} ${n2(-sw + 5)},${top} H${n2(sw - 4)} Q${sw},${top} ${sw},${top + 5} L${n2(sw + belly)},${bot - 8} Q${n2(sw + belly)},${bot} ${n2(sw + belly - 6)},${bot} H${n2(-sw + 5)} Q${-sw},${bot} ${-sw},${bot - 6} Z`, C.top, [-sw, top, sw + belly, bot]);
      if (id === 'sarah') torso += part(rrect(-sw - 1, -66, sw * 2 + 2, 6, 3), C.scarf, [-sw - 1, -66, sw + 1, -60], { hl: false });
      if (C.hoodie) torso += part(`M${-sw - 1},-64 q${sw},-6 ${sw * 2 + 2},0 l0,5 q${-sw},4 ${-sw * 2 - 2},0 Z`, dark(C.top, .15), [-sw - 1, -66, sw + 1, -58], { hl: false });
    } else {
      torso += part(torsoPath(tw, bw, top, bot, 6), C.top, [-bw, top, bw, bot]);
    }
    if (view === 'front') {
      if (id === 'sarah') {
        torso += line('M-4.6,-63.4 Q0,-59 4.6,-63.4', .55);
        torso += part(rrect(-9.5, -66.5, 19, 6.5, 3), C.scarf, [-9.5, -66.5, 9.5, -60]);
        torso += part('M-7,-61 L-10,-46 Q-6.5,-44 -3,-47 L-2.5,-60 Z', C.scarf, [-10, -61, -2.5, -44], { hl: false });
      }
      if (id === 'you') torso += line('M-4.6,-63.6 Q0,-59 4.6,-63.6', .55);
      if (C.coat) {
        torso += line(`M0,-58 L0,${bot}`, .6) + line('M-4.6,-64 L0,-57 L4.6,-64', .6);
        torso += `<circle cx="1.8" cy="-50" r=".9" fill="${INK}"/><circle cx="1.8" cy="-42" r=".9" fill="${INK}"/><circle cx="1.8" cy="-34" r=".9" fill="${INK}"/>`;
        torso += line(`M${n2(-bw * .75)},-38 h6 M${n2(bw * .75)},-38 h-6`, .6);
      }
      if (id === 'marco') torso += line('M-5.5,-63.6 Q0,-58.4 5.5,-63.6', .55);
      if (C.hoodie) {
        torso += part(rrect(-tw * .55, -41, tw * 1.1, 8, 2), dark(C.top, .12), [-tw * .55, -41, tw * .55, -33], { hl: false });
        torso += line(`M-3,-63 L-3.6,-50 M3,-63 L3.6,-50`, .6, '#C9C4B6');
      }
    }
    if (view === 'back') {
      if (id === 'sarah') {
        torso += part(rrect(-13.2, -62, 26.4, 30, 6), C.pack, [-13.2, -62, 13.2, -32]);
        torso += part(rrect(-9.5, -48, 19, 12, 3), dark(C.pack, .1), [-9.5, -48, 9.5, -36], { hl: false }) + line('M-9.5,-43 h19', .5);
        torso += part(rrect(-15.4, -42, 3.6, 11, 1.6), dark(C.pack, .15), [-15.4, -42, -11.8, -31], { hl: false }) + part(rrect(11.8, -42, 3.6, 11, 1.6), dark(C.pack, .15), [11.8, -42, 15.4, -31], { hl: false });
        torso += part(rrect(-9, -66, 18, 5.5, 2.6), C.scarf, [-9, -66, 9, -60.5], { hl: false });
        torso += line('M-5,-62 Q0,-69 5,-62', 1, dark(C.pack, .4));
      }
      if (C.coat) { torso += line(`M0,-58 L0,${bot}`, .5) + line(`M${-bw},-44 H${bw}`, .5) + line('M-4,-64 Q0,-61 4,-64', .5); }
      if (C.hoodie) {
        torso += part('M-10.5,-66 Q-11,-58 0,-56 Q11,-58 10.5,-66 Q0,-70 -10.5,-66 Z', dark(C.top, .15), [-11, -70, 11, -56], { hl: false });
        torso += line('M-12.4,-58 Q0,-52 12.4,-58', 1.3, C.phones) + line('M-12.4,-58 Q0,-52 12.4,-58', .5, INK);
      }
      if (id === 'you' || id === 'marco') torso += line('M-4,-63.6 Q0,-61 4,-63.6', .5);
    }

    // arms
    const sxL = -(tw - 1.1), sxR = tw - 1.1;
    let armsFront = '', armsBack = '', phone = '';
    if (view === 'side') {
      const nr = joints(1, P.R[0], P.R[1], 15, 14, 1);
      const fr = joints(1, P.L[0], P.L[1], 15, 14, 0);
      armsBack = drawArm(fr, 1, true);
      armsFront = drawArm(nr, 1, false);
    } else {
      const jl = joints(-1, P.L[0], P.L[1], 15, 14, sxL), jr = joints(1, P.R[0], P.R[1], 15, 14, sxR);
      const both = drawArm(jl, -1) + drawArm(jr, 1);
      if (view === 'back' && o.pose === 'look-phone') armsBack = both; else armsFront = both;
      if (P.prop === 'phone' && view === 'front') {
        const mx = (jl.h[0] + jr.h[0]) / 2, my = (jl.h[1] + jr.h[1]) / 2;
        phone += `<g class="rig-phone"><ellipse cx="${n2(mx)}" cy="${n2(my + 1)}" rx="11" ry="11" fill="#CFE8EF" opacity=".16"/><ellipse cx="${n2(mx)}" cy="${n2(my + 1)}" rx="7.5" ry="7.5" fill="#CFE8EF" opacity=".2"/>` +
          part(rrect(mx - 3.3, my - 5.6, 6.6, 11.2, 1.5), '#CFE8EF', [mx - 3.3, my - 5.6, mx + 3.3, my + 5.6], { hl: false, shade: false }) +
          `<circle cx="${n2(mx + 2.7)}" cy="${n2(my - 5.2)}" r="1.5" fill="#E5502B"/></g>`;
        // hands on top of phone
        phone += hand(jl.h[0], jl.h[1], C.skin) + hand(jr.h[0], jr.h[1], C.skin);
      }
    }

    // head
    const H = head(C, view, { expr: o.expr, yaw: yaw, pitch: P.pitch });
    const headG = `<g transform="rotate(${P.tilt} 0 -64) translate(0 ${n2(P.pitch * 1.4)})">${H.behind}${H.front}</g>`;
    // dev hood bunched behind head (front view)
    let hood = '';
    if (view === 'front' && C.hoodie) hood = part('M-12,-62 Q-13,-70 0,-70.5 Q13,-70 12,-62 Q0,-58 -12,-62 Z', dark(C.top, .18), [-13, -71, 13, -58], { hl: false });
    // braid
    let braid = '';
    if (id === 'sarah' && view === 'front') {
      const bx = -12.8; let b = '';
      for (let i = 0; i < 5; i++) b += part(ell(bx + (i % 2 ? .6 : -.6), -62 + i * 4.6, 2.7, 3.1), C.hair, [bx - 3, -65 + i * 4.6, bx + 3, -59 + i * 4.6], { hl: false });
      braid = b + part(rrect(bx - 2.3, -39.4, 4.6, 2, .8), C.scarf, [bx - 2.3, -39.4, bx + 2.3, -37.4], { hl: false });
    }
    if (id === 'sarah' && view === 'back') {
      let b = '';
      for (let i = 0; i < 6; i++) b += part(ell((i % 2 ? .7 : -.7), -73 + i * 4.8, 2.9, 3.3), C.hair, [-3, -76 + i * 4.8, 3, -70 + i * 4.8], { hl: false });
      braid = b;
    }
    if (id === 'sarah' && view === 'side') {
      let b = ''; for (let i = 0; i < 5; i++) b += part(ell(-sideW - 1.6 + (i % 2 ? .5 : -.5), -66 + i * 5, 2.8, 3.2), C.hair, [-sideW - 4.4, -69 + i * 5, -sideW + 1.2, -63 + i * 5], { hl: false });
      braid = b;
    }
    // dev headphones/hood on back and side
    let neckStuff = '';
    // headphones resting around the neck, drawn in front of the sleeves
    if (view === 'front' && C.hoodie) neckStuff = line(`M-8.6,-57 Q-12.5,-66 0,-66.5 Q12.5,-66 8.6,-57`, 1.5, C.phones) + line(`M-8.6,-57 Q-12.5,-66 0,-66.5 Q12.5,-66 8.6,-57`, .5, INK) +
      part(rrect(-9.6, -62, 5.4, 9.6, 2.4), C.phones, [-9.6, -62, -4.2, -52.4], { hl: false }) + part(rrect(4.2, -62, 5.4, 9.6, 2.4), C.phones, [4.2, -62, 9.6, -52.4], { hl: false });
    if (view === 'side' && C.hoodie) neckStuff = line(`M-6,-62 Q0,-67 7,-62`, 1.3, C.phones) + part(rrect(0, -64, 6, 9, 2.6), C.phones, [0, -64, 6, -55], { hl: false });

    const lean = P.lean + (view === 'side' ? 0 : 0);
    up = armsBack + torso + braid + hood + armsFront + phone + neckStuff + headG;
    body += `<g transform="translate(0 ${P.drop}) rotate(${lean} 0 -30)">${up}</g>`;

    // baked contact blob instead of real shadows
    const blob = o.blob === false ? '' : `<ellipse cx="0" cy="0.4" rx="${n2(15 + st * 2) * Math.min(1.3, C.wf)}" ry="3.2" fill="#10242B" opacity="${o.blobOpacity != null ? o.blobOpacity : .22}"/>`;
    return blob + body;
  }

  /* ---------- public API ---------- */
  function draw(id, o) {
    o = Object.assign({ view: 'front', pose: 'idle-breathe', expr: 'calm', scale: 3, x: 0, y: 0, flip: false, yaw: null, wobble: true }, o || {});
    const C = CHARS[id];
    const s = o.scale * C.ht;
    const inner = `<g class="rig rig-${id}" data-pose="${o.pose}" transform="translate(${n2(o.x)} ${n2(o.y)}) scale(${n2(o.flip ? -s : s)} ${n2(s)})">${figure(id, o)}</g>`;
    return o.wobble ? `<g filter="url(#wobble)">${inner}</g>` : inner;
  }
  // a standalone <svg> of one figure with guide lines, for the sheets
  function svg(id, o) {
    o = Object.assign({ w: 240, h: 360, scale: 3.4, guides: false }, o || {});
    const C = CHARS[id], s = o.scale * C.ht, cx = o.w / 2, cy = o.h - 20;
    let g = '';
    if (o.guides) {
      const lines = [[-97, 'head'], [-64, 'shoulder'], [-30, 'hip'], [0, 'floor']];
      lines.forEach(l => { const y = cy + l[0] * s; g += `<line x1="8" x2="${o.w - 8}" y1="${n2(y)}" y2="${n2(y)}" stroke="#1C1B19" stroke-opacity=".18" stroke-dasharray="3 4"/>`; });
    }
    return `<svg viewBox="0 0 ${o.w} ${o.h}" width="${o.w}" height="${o.h}" role="img" aria-label="${C.name}, ${o.view || 'front'} view">${g}${draw(id, Object.assign({}, o, { x: cx, y: cy, scale: o.scale }))}</svg>`;
  }
  // head only, for the expression atlas
  function headSvg(id, ex, size) {
    const C = CHARS[id], s = (size || 120) / 40;
    return `<svg viewBox="-25 -113 50 52" width="${size || 120}" height="${(size || 120) * 52 / 50}" role="img" aria-label="${C.name}, ${ex}">` +
      `<g filter="url(#wobble)"><g>${(function () { const H = head(C, 'front', { expr: ex, yaw: 0, pitch: 0 }); return `<g transform="scale(1)">${H.behind}${H.front}</g>`; })()}</g></g></svg>`;
  }

  export const Rig = { CHARS, POSES, EXPR, EXPR_SETS, draw, svg, headSvg, mix, dark, lite, mouthPath };

