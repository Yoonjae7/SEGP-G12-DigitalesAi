// @ts-nocheck
// Ported from the approved design pack (design/js/scenes.js). It writes SVG strings, so it is not type-annotated.
/* DigiTales AI: scene art (Phase 1 preview)
   Each scene is a stack of cut-paper layers with a depth value (0 = far, 1 = near) used for parallax.
   16:9 master (1600 x 900). Portrait crops follow `focus`. Light is described per scene in META. */
import { Rig } from './rig';
  const K = { paper: '#F4EEE3', deep: '#E7DFCE', ink: '#1C1B19', soft: '#4A4741', night: '#10242B', lift: '#1D3B46', glow: '#CFE8EF', morning: '#F6D9B8', ping: '#E5502B', moss: '#3F6B4F', butter: '#F0C75E' };
  let PU = 0;
  const OUT = 'stroke="#1C1B19" stroke-width="3" stroke-linejoin="round"';
  const FONT = 'style="font-family:var(--font-body)"';
  const r = (x, y, w, h, f, e) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${e || ''}/>`;
  const rr = (x, y, w, h, rad, f, e) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${f}" ${e || ''}/>`;
  const pa = (d, f, e) => `<path d="${d}" fill="${f}" ${e || ''}/>`;
  const ci = (x, y, rad, f, e) => `<circle cx="${x}" cy="${y}" r="${rad}" fill="${f}" ${e || ''}/>`;
  const el = (x, y, rx, ry, f, e) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${e || ''}/>`;
  const po = (pts, f, e) => `<polygon points="${pts}" fill="${f}" ${e || ''}/>`;
  const G = (inner, a) => `<g ${a || ''}>${inner}</g>`;
  const LY = (depth, inner) => `<g class="lyr" data-depth="${depth}">${inner}</g>`;
  const cutN = inner => G(inner, 'filter="url(#lift)"');     // paper lift, night scenes
  const cutL = inner => G(inner, 'filter="url(#liftlt)"');   // paper lift, day scenes
  const cutLs = inner => G(inner, 'filter="url(#liftlts)"');
  const tint = (f, inner) => G(inner, `filter="url(#${f})"`);
  let NOCHAR = false; // 3D mode draws the people itself, so the layers are rendered without them
  const Rg = (id, o) => (NOCHAR ? '' : Rig.draw(id, o));

  /* ---------- shared pieces ---------- */
  function photo(x, y, w, h) {
    const fs = Math.max(11, w * .075), lw = fs * 7.6, lh = fs * 2.1;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#photo-stripes)" filter="url(#blur2)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#1C1B19" stroke-opacity=".55" stroke-width="2"/>` +
      `<rect x="${x + w / 2 - lw / 2}" y="${y + h / 2 - lh / 2}" width="${lw}" height="${lh}" rx="3" fill="#F4EEE3" stroke="#1C1B19" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + h / 2 + fs * .36}" text-anchor="middle" ${FONT} font-weight="700" font-size="${fs}" fill="#1C1B19">Photo (hidden)</text></g>`;
  }
  // chat bubbles inside a phone screen. items: {k:'photo'|'text'|'bars', side:'l'|'r', who, lines, n, h}
  function chat(sx, sy, sw, sh, title, sub, items) {
    const fs = sw * .06, lh = fs * 1.32, bw = sw * .8;
    let s = r(sx, sy, sw, sh * .1, K.deep) + `<text x="${sx + sw * .05}" y="${sy + sh * .062}" ${FONT} font-weight="700" font-size="${fs * 1.2}" fill="#1C1B19">${title}</text>`;
    if (sub) s += `<text x="${sx + sw * .95}" y="${sy + sh * .062}" text-anchor="end" ${FONT} font-size="${fs * .9}" fill="#4A4741">${sub}</text>`;
    let y = sy + sh * .13;
    items.forEach(it => {
      const x = it.side === 'r' ? sx + sw - bw - sw * .04 : sx + sw * .04;
      if (it.who) { s += `<text x="${x + fs * .4}" y="${y + fs * .85}" ${FONT} font-weight="700" font-size="${fs * .8}" fill="#4A4741">${it.who}</text>`; y += fs * 1.15; }
      if (it.k === 'photo') { const ph = it.h || sw * .5; s += photo(x, y, bw, ph); y += ph + sh * .025; return; }
      const nl = it.k === 'bars' ? (it.n || 2) : it.lines.length, bh = nl * lh + fs * 1.0;
      s += rr(x, y, bw * (it.k === 'bars' ? (it.wf || .86) : 1), bh, fs * .9, it.side === 'r' ? K.morning : K.paper, 'stroke="#1C1B19" stroke-opacity=".35" stroke-width="1.5"');
      if (it.k === 'bars') for (let i = 0; i < nl; i++) s += rr(x + fs * .6, y + fs * .6 + i * lh, bw * (i === nl - 1 ? .42 : .6), fs * .5, fs * .25, '#4A4741', 'opacity=".55"');
      else it.lines.forEach((t, i) => { s += `<text x="${x + fs * .6}" y="${y + fs * 1.15 + i * lh}" ${FONT} font-size="${fs}" fill="#1C1B19">${t}</text>`; });
      y += bh + sh * .022;
    });
    return s;
  }
  function phone(cx, cy, w, h, o) {
    o = o || {};
    const x = -w / 2, y = -h / 2, pad = Math.max(8, w * .035), sx = x + pad, sy = y + pad * 1.8, sw = w - 2 * pad, sh = h - pad * 3.4;
    let s = `<g transform="translate(${cx} ${cy}) rotate(${o.rot || 0})">`;
    if (o.glow !== false) [[2.0, .05], [1.55, .07], [1.22, .1]].forEach(k => { s += rr(x - w * (k[0] - 1) / 2, y - h * (k[0] - 1) / 2, w * k[0], h * k[0], w * .12 * k[0], K.glow, `opacity="${k[1]}"`); });
    s += G(rr(x, y, w, h, w * .11, '#0B171C', OUT), 'filter="url(#lift)"');
    s += rr(sx, sy, sw, sh, w * .06, K.glow);
    const cid = 'pc' + (++PU);
    s += `<clipPath id="${cid}"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${w * .06}"/></clipPath>` + G(o.content ? o.content(sx, sy, sw, sh) : '', `clip-path="url(#${cid})"`);
    if (o.ping) {
      const pr = w * .07, px = x + w - pad * 1.1, py = y + pad * 1.4;
      s += ci(px, py, pr * 2.6, K.glow, 'class="glow-pulse" opacity="0"') + ci(px, py, pr, K.ping, `class="ping-dot" stroke="#1C1B19" stroke-width="2"`);
    }
    return s + '</g>';
  }
  const curtain = (x, y, w, h) => {
    const n = 6; let d = `M${x},${y} H${x + w} L${x + w - 10},${y + h} `;
    for (let i = n; i > 0; i--) d += `Q${x + w * (i - .5) / n},${y + h + 28} ${x + w * (i - 1) / n},${y + h} `;
    let s = cutN(pa(d + 'Z', '#17333D'));
    for (let i = 1; i < n; i++) s += r(x + w * i / n - 2, y, 4, h - 6, '#0F262E', 'opacity=".75"');
    return s;
  };
  function paperPerson(x, base, h, col) { const w = h * .34; return cutLs(rr(x - w / 2, base - h * .62, w, h * .62, w * .42, col) + ci(x, base - h * .76, h * .14, col)); }
  const longShadow = (x, base, len, w, op, col) => po(`${x - w},${base} ${x + w},${base} ${x + w + len},${base + len * .16} ${x - w + len},${base + len * .16}`, col || '#5a3a1e', `opacity="${op || .2}"`);

  /* ---------- S1: Ping (dorm room, night) ---------- */
  function s1() {
    let o = '';
    // far wall and window
    const wx = 170, wy = 80, ww = 400, wh = 450;
    let wall = r(0, 0, 1600, 900, K.lift) + r(0, 560, 1600, 340, '#17333D');
    wall += cutN(rr(wx - 18, wy - 18, ww + 36, wh + 36, 4, '#2B4A56'));
    wall += r(wx, wy, ww, wh, 'url(#sky-night)');
    [[0, .62, .16], [.14, .48, .2], [.32, .66, .12], [.42, .4, .22], [.62, .58, .14], [.74, .5, .18], [.9, .64, .1]].forEach(b => { wall += r(wx + b[0] * ww, wy + b[1] * wh, b[2] * ww, wh - b[1] * wh, '#1D3B46'); });
    [[.04, .7], [.1, .8], [.2, .58], [.26, .72], [.46, .5], [.5, .62], [.56, .74], [.66, .66], [.78, .6], [.84, .72], [.93, .78]].forEach(p => { wall += r(wx + p[0] * ww, wy + p[1] * wh, 9, 12, K.butter, 'opacity=".85"'); });
    wall += ci(wx + ww * .76, wy + wh * .2, 30, K.glow) + ci(wx + ww * .76 + 15, wy + wh * .2 - 9, 26, '#13303A');
    wall += r(wx + ww / 2 - 5, wy, 10, wh, '#2B4A56') + r(wx, wy + wh * .4, ww, 10, '#2B4A56');
    o += LY(.08, wall);
    o += LY(.16, curtain(30, 34, 190, 620) + curtain(520, 34, 190, 620) + cutN(r(20, 24, 710, 14, '#4A4741')));
    // shelf, posters, plant
    let sh = '';
    sh += cutN(rr(960, 110, 150, 210, 3, K.deep, OUT)) + ci(1035, 190, 34, K.butter) + po('975,300 1035,215 1095,300', K.moss) + r(975, 300, 120, 8, '#10242B');
    sh += cutN(rr(1140, 150, 90, 120, 3, '#CDBB84', OUT)) + ci(1185, 195, 20, K.paper) + r(1155, 236, 60, 8, '#1D3B46');
    const cols = ['#6F8F72', '#B8864F', '#4F7080', '#CDBB84', '#8F5A48', '#E7DFCE', '#7C9A8F', '#C9A15B'];
    let bx = 1000, i = 0, books = '';
    while (bx < 1300) { const bw = 22 + ((i * 7) % 14), bh = 64 + ((i * 13) % 40); books += rr(bx, 420 - bh, bw, bh, 2, cols[i % cols.length], 'stroke="#1C1B19" stroke-width="2"'); bx += bw + 3; i++; }
    books += cutN(rr(980, 420, 380, 16, 2, '#6E5A44', OUT));
    books += rr(1318, 372, 42, 48, 4, '#B8864F', OUT) + pa('M1339,372 C1300,330 1306,300 1339,330 C1330,300 1360,296 1339,372Z', K.moss, OUT) + pa('M1339,372 C1380,340 1392,320 1356,334 Z', '#4F7F5E', OUT);
    sh += books;
    o += LY(.24, sh);
    // desk and lamp, warm light
    let dk = '';
    dk += el(1340, 400, 330, 250, K.butter, 'opacity=".06"') + el(1340, 400, 210, 160, K.butter, 'opacity=".08"');
    dk += r(890, 590, 22, 240, '#3B2D22') + r(1420, 590, 22, 240, '#3B2D22');
    dk += cutN(rr(860, 556, 620, 32, 3, '#7A5F45', OUT));
    dk += po('1306,392 1392,430 1130,558 1520,558', K.butter, 'opacity=".16"') + po('1296,392 1402,436 1030,558 1590,558', K.butter, 'opacity=".09"');
    dk += rr(1020, 514, 38, 42, 5, K.paper, OUT) + pa('M1058,524 q18,2 0,24', 'none', OUT);
    dk += cutN(rr(1100, 530, 190, 26, 3, '#2A2C2B', OUT));
    dk += el(1390, 552, 50, 9, '#2A2C2B') + `<path d="M1390,548 L1352,430 L1430,356" fill="none" stroke="#2A2C2B" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
    dk += po('1402,330 1486,368 1456,422 1380,378', K.butter, OUT) + ci(1430, 392, 17, '#FFF3C8');
    o += LY(.34, dk);
    // pillow behind learner
    o += LY(.5, cutN(rr(30, 520, 360, 150, 46, '#8FA6AB', OUT)));
    // the learner, from behind, in cool light
    o += LY(.62, tint('tint-night', Rg('you', { view: 'back', pose: 'look-phone', scale: 8.2, x: 410, y: 985, blob: false })));
    // bed
    let bed = cutN(pa('M0,672 Q300,628 640,656 T1280,644 T1600,654 V900 H0 Z', '#3E5B67', OUT));
    bed += pa('M0,740 Q420,712 840,742 T1600,730', 'none', 'stroke="#5B7C89" stroke-width="3"') + pa('M0,812 Q460,786 900,816 T1600,804', 'none', 'stroke="#5B7C89" stroke-width="3"');
    bed += el(1040, 780, 560, 190, K.glow, 'opacity=".05"') + el(1040, 790, 400, 140, K.glow, 'opacity=".07"') + el(1040, 800, 250, 90, K.glow, 'opacity=".1"');
    o += LY(.8, bed);
    // hands and phone, the nearest layer
    let hd = '';
    hd += cutN(pa('M590,900 L760,900 L950,790 L880,690 Z', '#8F8D86', OUT) + pa('M1000,900 L1170,900 L1190,800 L1100,750 Z', '#8F8D86', OUT));
    hd += phone(1030, 520, 250, 430, { rot: -9, ping: true, content: (sx, sy, sw, sh) => chat(sx, sy, sw, sh, 'Study Crew', '12', [{ k: 'photo', side: 'l', h: sw * .46 }, { k: 'bars', side: 'l', n: 2 }, { k: 'bars', side: 'l', n: 1, wf: .5 }, { k: 'bars', side: 'l', n: 1, wf: .7 }]) });
    hd += cutN(pa('M860,770 C830,720 870,660 930,670 C960,676 962,720 950,748 C942,792 880,800 860,770Z', '#C79A74', OUT) + pa('M934,672 C940,632 962,612 976,622 C984,640 966,668 958,690Z', '#C79A74', OUT));
    hd += cutN(pa('M1090,780 C1070,740 1110,690 1170,704 C1196,712 1190,756 1170,784 C1150,812 1104,806 1090,780Z', '#C79A74', OUT) + pa('M1112,706 C1100,676 1112,648 1130,650 C1146,656 1144,684 1140,708Z', '#C79A74', OUT));
    o += LY(1, hd);
    return o;
  }

  /* ---------- S2: Your Move (phone fills the frame) ---------- */
  function s2() {
    let o = LY(.05, r(0, 0, 1600, 900, K.night) + r(0, 640, 1600, 260, '#0E1F25'));
    o += LY(.14, curtain(-40, 0, 230, 800) + curtain(1410, 0, 230, 800));
    const chatC = (sx, sy, sw, sh) => chat(sx, sy, sw, sh, 'Study Crew', '12 people', [
      { k: 'photo', side: 'l', who: 'Lisa', h: sw * .42 },
      { k: 'text', side: 'l', who: 'Marco', lines: ['Ha! Legend.'] },
      { k: 'text', side: 'l', who: 'Dev', lines: ['Send this to Hall B.'] },
      { k: 'text', side: 'l', who: 'Lisa', lines: ['Isn’t it perfect?'] }]) +
      rr(sx + sw * .04, sy + sh - sh * .075, sw * .92, sh * .055, sh * .028, K.deep) + `<text x="${sx + sw * .08}" y="${sy + sh - sh * .037}" ${FONT} font-size="${sw * .05}" fill="#4A4741">Message</text>`;
    o += LY(.5, phone(800, 450, 540, 880, { rot: -3, content: chatC }));
    // floating paper cut-out bubbles, nearest depth
    const fl = (x, y, rot, w, h, t, f) => cutN(`<g transform="translate(${x} ${y}) rotate(${rot})">${rr(-w / 2, -h / 2, w, h, h / 2.2, f || K.paper, OUT)}<text x="0" y="${h * .16}" text-anchor="middle" ${FONT} font-weight="700" font-size="${h * .4}" fill="#1C1B19">${t}</text></g>`);
    o += LY(1.1, fl(1250, 250, 7, 330, 96, 'Isn’t it perfect?') + fl(290, 600, -8, 230, 84, 'Ha! Legend.') + fl(1290, 760, -5, 300, 84, 'Send this to Hall B.', K.morning));
    o += LY(1.0, cutN(`<g transform="translate(1300 480) rotate(8)">${photo(-95, -75, 190, 150)}</g>`));
    return o;
  }

  /* ---------- S3: Two More Groups (three phones, one paper chain) ---------- */
  function s3() {
    let o = LY(.05, r(0, 0, 1600, 900, K.night) + r(0, 700, 1600, 200, '#0E1F25'));
    // three small rooms far behind
    let rooms = '';
    [[110, 'a'], [600, 'b'], [1090, 'c']].forEach(a => { rooms += rr(a[0], 120, 400, 520, 4, '#16313B') + r(a[0] + 30, 160, 120, 150, '#10242B') + r(a[0] + 250, 520, 120, 80, '#1D3B46') + r(a[0] + 20, 600, 360, 40, '#1D3B46'); });
    o += LY(.12, rooms);
    const mk = (title, sub, items) => (sx, sy, sw, sh) => chat(sx, sy, sw, sh, title, sub, items);
    const items = [{ k: 'photo', side: 'l', h: 150 }, { k: 'bars', side: 'l', n: 2 }, { k: 'bars', side: 'r', n: 1, wf: .6 }];
    // paper chain, behind phones
    let chain = '';
    const link = (x, y, w, h, c, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0})">${rr(-w / 2, -h / 2, w, h, h / 2.4, 'none', `stroke="${c}" stroke-width="14"`)}${rr(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, h / 2, 'none', 'stroke="#1C1B19" stroke-width="2.5"')}${rr(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, h / 3, 'none', 'stroke="#1C1B19" stroke-width="2.5"')}</g>`;
    const cs = [K.butter, K.deep, K.glow];
    for (let i = 0; i < 18; i++) chain += link(i * 95 - 10, 470 + (i % 2 ? 0 : 0), 118, 54, cs[i % 3]);
    o += LY(.4, cutN(chain));
    o += LY(.6, phone(340, 450, 330, 580, { rot: -4, content: mk('Study Crew', '12', items) }));
    o += LY(.7, phone(800, 450, 330, 580, { rot: 0, content: mk('Hall B', '31', items) }));
    o += LY(.8, phone(1260, 450, 330, 580, { rot: 4, content: mk('Film Night', '24', items) }));
    return o;
  }

  /* ---------- S4: Morning (campus café, queue) ---------- */
  function cafeBack(floorCol) {
    let o = r(0, 0, 1600, 900, K.morning) + r(0, 610, 1600, 290, floorCol || '#D9B98C');
    for (let y = 640; y < 900; y += 46) o += r(0, y, 1600, 2, '#B99A6C', 'opacity=".5"');
    return o;
  }
  function windowDay(x, y, w, h) {
    let s = cutL(rr(x - 12, y - 12, w + 24, h + 24, 3, '#C9A77C'));
    s += r(x, y, w, h, 'url(#sky-morning)') + ci(x + w * .3, y + h * .82, 70, '#7FA088') + ci(x + w * .7, y + h * .9, 90, '#6C9378');
    s += r(x + w / 2 - 4, y, 8, h, '#C9A77C') + r(x, y + h * .36, w, 8, '#C9A77C');
    return s;
  }
  function s4() {
    let o = LY(.05, cafeBack());
    let wins = windowDay(120, 90, 220, 400) + windowDay(420, 90, 220, 400) + windowDay(720, 90, 220, 400);
    o += LY(.12, wins);
    // light shafts, stepped and flat
    let sh = '';
    [[120, 90], [420, 90], [720, 90]].forEach(a => { sh += po(`${a[0]},${a[1] + 400} ${a[0] + 220},${a[1] + 400} ${a[0] + 560},900 ${a[0] + 160},900`, K.butter, 'opacity=".13"') + po(`${a[0] + 40},${a[1] + 400} ${a[0] + 180},${a[1] + 400} ${a[0] + 420},900 ${a[0] + 200},900`, K.butter, 'opacity=".1"'); });
    o += LY(.2, sh);
    // counter, machine, menu
    let ct = cutL(rr(1060, 130, 440, 150, 4, K.night, OUT)) + `<g ${FONT} font-weight="700" font-size="38" fill="#F4EEE3"><text x="1100" y="200">Coffee</text><text x="1250" y="200">Tea</text><text x="1340" y="200">Toast</text></g>` + r(1100, 222, 360, 3, K.butter, 'opacity=".7"');
    ct += cutL(rr(1100, 330, 210, 100, 6, '#7C8C8E', OUT) + rr(1130, 300, 60, 40, 4, '#5E6D70', OUT) + ci(1250, 380, 22, '#4A5658', OUT));
    ct += cutL(rr(1020, 424, 540, 34, 3, '#C79B6C', OUT) + rr(1040, 458, 500, 250, 3, '#9C7450', OUT));
    for (let x = 1070; x < 1540; x += 52) ct += r(x, 470, 4, 226, '#845F3E', 'opacity=".6"');
    ct += rr(1400, 396, 36, 30, 4, K.paper, OUT) + rr(1448, 396, 36, 30, 4, K.paper, OUT);
    o += LY(.3, ct);
    // faceless crowd
    let cr = '';
    [[1010, 660, 250, '#B9A58A'], [1070, 668, 270, '#8F9F8C'], [940, 650, 230, '#A4B3B7'], [1130, 662, 260, '#C9A28A']].forEach(p => { cr += paperPerson(p[0], p[1], p[2], p[3]); });
    o += LY(.42, cr);
    // small tables behind the rail
    let tbl = '';
    [[190, 650], [470, 656]].forEach(t => { tbl += cutL(r(t[0] - 5, t[1] - 54, 10, 52, '#7A5F45', OUT) + el(t[0], t[1] - 2, 36, 7, '#7A5F45', OUT) + el(t[0], t[1] - 62, 68, 13, '#C79B6C', OUT)); });
    o += LY(.46, tbl);
    // queue rail
    let rail = '', px = [90, 330, 560, 790];
    px.forEach(x => { rail += r(x, 560, 12, 160, '#4A4741', 'stroke="#1C1B19" stroke-width="2.5"') + ci(x + 6, 556, 12, K.butter, OUT); });
    for (let i = 0; i < 3; i++) rail += pa(`M${px[i] + 6},576 Q${(px[i] + px[i + 1]) / 2 + 6},640 ${px[i + 1] + 6},576`, 'none', `stroke="${K.moss}" stroke-width="9" stroke-linecap="round"`);
    o += LY(.5, rail);
    // Marco and Dev, background level
    o += LY(.56, tint('tint-warm', Rg('marco', { view: 'front', pose: 'look-phone', expr: 'amused', scale: 4.8, x: 700, y: 792 }) + Rg('dev', { view: 'front', pose: 'look-phone', expr: 'flat', scale: 4.6, x: 810, y: 798 })));
    // long shadows
    o += LY(.62, longShadow(700, 792, 300, 40, .18) + longShadow(810, 798, 300, 30, .18));
    // Sarah, then the learner behind her in the queue
    o += LY(.7, longShadow(600, 806, 340, 60, .2) + tint('tint-warm', Rg('sarah', { view: 'back', pose: 'idle-breathe', scale: 6.4, x: 600, y: 806 })));
    o += LY(.9, longShadow(300, 960, 380, 80, .2) + tint('tint-warm', Rg('you', { view: 'back', pose: 'idle-breathe', scale: 7.8, x: 300, y: 960 })));
    return o;
  }

  /* ---------- S5: Sarah Knows (café table, two-shot) ---------- */
  function s5() {
    let o = LY(.05, r(0, 0, 1600, 900, '#F3DEC2') + r(0, 600, 1600, 300, '#E2C79F'));
    o += LY(.12, cutLs(rr(100, 110, 300, 360, 4, 'url(#sky-morning)', 'stroke="#C9A77C" stroke-width="12"')) + cutLs(rr(1220, 150, 260, 220, 4, '#E6CDAA')) + cutLs(rr(640, 90, 300, 120, 4, '#E6CDAA')));
    o += LY(.4, tint('tint-warm', Rg('sarah', { view: 'front', pose: 'idle-breathe', expr: 'hurt', yaw: .2, scale: 8.2, x: 670, y: 846 })));
    // table, cups, steam
    let tb = cutL(pa('M200,650 L1400,650 L1520,730 L80,730 Z', '#C79B6C', OUT) + rr(80, 730, 1440, 44, 3, '#A9805B', OUT));
    tb += cutL(rr(600, 596, 70, 56, 8, K.paper, OUT) + pa('M670,610 q26,4 0,34', 'none', OUT));
    tb += pa('M622,580 q-14,-24 0,-42 q14,-18 0,-38 M648,580 q-14,-24 0,-42 q14,-18 0,-38', 'none', `stroke="${K.paper}" stroke-width="7" stroke-linecap="round" opacity=".85"`);
    tb += cutL(rr(850, 604, 70, 52, 8, K.paper, OUT));
    o += LY(.6, tb);
    o += LY(.9, tint('tint-warm', Rg('you', { view: 'back', pose: 'idle-breathe', scale: 8.2, x: 1020, y: 1160 })));
    return o;
  }

  /* ---------- S6: Lisa's Excuse (corner by the door) ---------- */
  function s6() {
    let o = LY(.05, r(0, 0, 1600, 900, '#F1D9B8') + r(0, 620, 1600, 280, '#DBBE92'));
    let door = cutLs(rr(70, 90, 470, 700, 4, '#B28A5E', OUT)) + r(110, 130, 390, 440, 'url(#sky-morning)') + ci(210, 540, 80, '#7FA088') + ci(400, 560, 100, '#6C9378') + r(300, 130, 8, 440, '#B28A5E') + rr(120, 600, 370, 140, 3, '#9C7450', OUT) + ci(470, 680, 11, K.butter, OUT);
    o += LY(.14, door);
    o += LY(.2, po('110,570 500,570 800,900 260,900', K.butter, 'opacity=".14"') + po('140,570 400,570 560,900 300,900', K.butter, 'opacity=".1"'));
    // coat hooks and notice board
    let hk = cutLs(rr(1180, 190, 340, 190, 4, '#C9A77C', OUT)) + r(1210, 215, 90, 70, K.paper) + r(1330, 220, 60, 90, K.deep) + r(1415, 228, 80, 60, K.paper);
    hk += cutLs(rr(1170, 420, 360, 12, 3, '#4A4741')) + [1210, 1300, 1390, 1470].map((x, i) => `<g>${rr(x - 6, 420, 12, 24, 3, '#4A4741')}${pa(`M${x - 38},${444} Q${x},${436} ${x + 38},${444} L${x + 44},${600} H${x - 44} Z`, ['#6F8F72', '#B8864F', '#4F7080', '#8F5A48'][i], OUT)}</g>`).join('');
    o += LY(.3, hk);
    o += LY(.6, longShadow(970, 840, 340, 70, .18) + tint('tint-warm', Rg('lisa', { view: 'front', pose: 'shrug', expr: 'defensive', scale: 6.4, x: 970, y: 840 })));
    o += LY(.9, longShadow(620, 990, 300, 80, .18) + tint('tint-warm', Rg('you', { view: 'back', pose: 'idle-breathe', scale: 7.6, x: 620, y: 990 })));
    return o;
  }

  /* ---------- S7: library steps. A is warm and low, B is flat grey-blue. ---------- */
  function library(pal) {
    let o = r(0, 0, 1600, 900, `url(#${pal.sky})`);
    o += pal.sun || '';
    let fac = cutL(r(420, 150, 1000, 430, pal.wall, OUT)) + cutL(po('400,160 920,40 1440,160', pal.wall, OUT));
    for (let i = 0; i < 6; i++) fac += cutLs(rr(470 + i * 170, 190, 62, 380, 3, pal.col, OUT));
    fac += rr(850, 270, 160, 310, 80, pal.door, OUT) + rr(880, 300, 100, 280, 50, pal.door2);
    fac += `<g ${FONT} font-weight="700" font-size="34" letter-spacing="12" fill="${pal.text}" text-anchor="middle"><text x="920" y="118">LIBRARY</text></g>`;
    o += LY(.14, fac);
    o += LY(.3, cutL(r(330, 560, 1200, 70, pal.s1, OUT)) + r(330, 560, 1200, 8, pal.sh) + cutL(r(220, 630, 1400, 84, pal.s2, OUT)) + r(220, 630, 1400, 8, pal.sh) + cutL(r(90, 714, 1600, 100, pal.s3, OUT)) + r(90, 714, 1600, 8, pal.sh) + cutL(r(-20, 814, 1700, 100, pal.s4, OUT)) + r(-20, 814, 1700, 8, pal.sh));
    return o;
  }
  function s7a() {
    const pal = { sky: 'sky-warm', wall: '#D9C29E', col: '#E8D6B4', door: '#6A4C34', door2: '#3F2D20', text: '#7A5230', s1: '#E0C9A2', s2: '#D3B98F', s3: '#C7AB7E', s4: '#B99C6E', sh: '#F0DDB6',
      sun: ci(250, 470, 160, '#FBE9B8', 'opacity=".35"') + ci(250, 470, 120, '#FBE9B8', 'opacity=".5"') + ci(250, 470, 84, '#FFF3C8') };
    let o = library(pal);
    o += LY(.55, longShadow(1000, 782, 420, 50, .22, '#7A5230') + longShadow(790, 786, 420, 40, .22, '#7A5230') + longShadow(570, 806, 420, 56, .22, '#7A5230'));
    o += LY(.7, tint('tint-warm', Rg('sarah', { view: 'front', pose: 'idle-breathe', expr: 'steady', scale: 5.6, x: 790, y: 786 }) + Rg('lisa', { view: 'front', pose: 'idle-breathe', expr: 'sorry', yaw: -.15, scale: 5.0, x: 1000, y: 782 })));
    o += LY(.9, tint('tint-warm', Rg('you', { view: 'back', pose: 'idle-breathe', scale: 6.2, x: 570, y: 830 })));
    return o;
  }
  function s7b() {
    const pal = { sky: 'sky-grey', wall: '#8FA1A9', col: '#A8B7BD', door: '#4F6370', door2: '#33444D', text: '#4F6370', s1: '#9AAAB1', s2: '#8D9DA5', s3: '#7F8F98', s4: '#72828B', sh: '#B5C2C7' };
    let o = library(pal);
    // the empty place: a bench with nothing on it
    let bench = cutL(rr(640, 662, 300, 22, 3, '#6F7F88', OUT) + r(660, 684, 18, 52, '#5B6B74', OUT) + r(900, 684, 18, 52, '#5B6B74', OUT) + rr(640, 616, 300, 40, 3, '#7C8C95', OUT));
    o += LY(.5, bench);
    o += LY(.55, longShadow(1140, 830, 520, 60, .24, '#33444D') + longShadow(330, 612, 260, 20, .2, '#33444D') + longShadow(410, 614, 260, 20, .2, '#33444D'));
    // Marco, Dev and Lisa, small and far, on the top steps
    o += LY(.6, tint('tint-grey', Rg('marco', { view: 'front', pose: 'idle-breathe', expr: 'shrugF', scale: 2.6, x: 330, y: 612 }) + Rg('dev', { view: 'front', pose: 'idle-breathe', expr: 'flat', scale: 2.6, x: 410, y: 614 }) + Rg('lisa', { view: 'back', pose: 'turn-away', scale: 2.8, x: 520, y: 612, yaw: 1 })));
    o += LY(.9, tint('tint-grey', Rg('you', { view: 'back', pose: 'look-phone', scale: 6.4, x: 1140, y: 880 })));
    return o;
  }

  /* ---------- registry and rendering ---------- */
  const META = {
    s1: { id: 'S1', title: 'Ping', fn: s1, focus: 950, home: [230, 60, 960, 830], light: 'night' },
    s2: { id: 'S2', title: 'Your Move', fn: s2, focus: 800, light: 'night' },
    s3: { id: 'S3', title: 'Two More Groups', fn: s3, focus: 800, light: 'night' },
    s4: { id: 'S4', title: 'Morning', fn: s4, focus: 560, light: 'morning' },
    s5: { id: 'S5', title: 'Sarah Knows', fn: s5, focus: 845, light: 'morning' },
    s6: { id: 'S6', title: 'Lisa’s Excuse', fn: s6, focus: 800, light: 'morning' },
    s7a: { id: 'S7', title: 'Two Days Later: Ending A', fn: s7a, focus: 790, light: 'warm' },
    s7b: { id: 'S7', title: 'Two Days Later: Ending B', fn: s7b, focus: 940, light: 'grey' }
  };
  function render(id, o) {
    o = o || {};
    const m = META[id]; if (!m) return '';
    let vb = '0 0 1600 900';
    if (o.mode === 'portrait') { const w = 585; const x = Math.max(0, Math.min(1600 - w, m.focus - w / 2)); vb = `${Math.round(x)} 0 ${w} 900`; }
    if (o.mode === 'home' && m.home) vb = m.home.join(' ');
    return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false" class="scene-svg">${m.fn()}</svg>`;
  }
  function mount(scope) {
    (scope || document).querySelectorAll('[data-scene]').forEach(el => {
      if (el.closest('[hidden]')) return;
      let mode = el.dataset.mode;
      if ((!mode || mode === 'wide') && el.clientHeight > el.clientWidth) mode = 'portrait';   // a tall box gets the portrait column
      el.innerHTML = render(el.dataset.scene, { mode });
    });
  }
  /** The scene as separate paper layers, each a standalone SVG, for the 3D layer to hang in space. No people in them. */
  function layers(id) {
    const m = META[id];
    if (!m || typeof DOMParser === 'undefined') return [];
    NOCHAR = true;
    let inner = '';
    try { inner = m.fn(); } finally { NOCHAR = false; }
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>', 'image/svg+xml');
    const ser = new XMLSerializer();
    return [...doc.documentElement.children].filter((g) => g.getAttribute('class') && g.getAttribute('class').indexOf('lyr') > -1).map((g) => ({
      depth: parseFloat(g.getAttribute('data-depth') || '0'),
      inner: ser.serializeToString(g).replace(/ xmlns="[^"]*"/g, ''),
    }));
  }
  export const Scenes = { META, render, layers };


