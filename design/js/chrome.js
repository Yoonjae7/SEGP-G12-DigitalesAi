/* DigiTales AI: shared page chrome for the Phase 1 previews.
   Shared SVG defs, wordmark, top bar, footer, state switch, parallax, deckle edge, embed height. */
(function (root) {
  'use strict';

  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <filter id="wobble" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="lift" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#06141a" flood-opacity=".42"/></filter>
  <filter id="liftsm" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#06141a" flood-opacity=".36"/></filter>
  <filter id="liftlt" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#5a4025" flood-opacity=".30"/></filter>
  <filter id="liftlts" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#5a4025" flood-opacity=".30"/></filter>
  <filter id="blur2"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="tint-night" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".66 0 0 0 .01  0 .78 0 0 .03  0 0 .86 0 .06  0 0 0 1 0"/></filter>
  <filter id="tint-warm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 .02  0 .96 0 0 .01  0 0 .84 0 0  0 0 0 1 0"/></filter>
  <filter id="tint-grey" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".5 .3 .1 0 .05  .2 .6 .2 0 .08  .15 .25 .6 0 .12  0 0 0 1 0"/></filter>
  <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10242B"/><stop offset="1" stop-color="#1D3B46"/></linearGradient>
  <linearGradient id="sky-morning" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE8EF"/><stop offset="1" stop-color="#F6D9B8"/></linearGradient>
  <linearGradient id="sky-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D9B8"/><stop offset="1" stop-color="#F0C75E"/></linearGradient>
  <linearGradient id="sky-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9C6CB"/><stop offset="1" stop-color="#9DAEB6"/></linearGradient>
  <pattern id="photo-stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="16" height="16" fill="#D6CDB6"/><rect width="8" height="16" fill="#B7AC92"/></pattern>

  <symbol id="mk-tell" viewBox="0 0 80 80"><path d="M14 12 L60 8 L66 20 L63 34 L67 48 L62 66 L18 70 L12 56 L15 40 L11 26 Z" transform="translate(3 4)" fill="#1C1B19" opacity=".18"/><path d="M14 12 L60 8 L66 20 L63 34 L67 48 L62 66 L18 70 L12 56 L15 40 L11 26 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><rect x="21" y="39" width="35" height="8" fill="#F0C75E"/><path d="M22 24 H54 M22 33 H48 M22 43 H56 M22 54 H40" stroke="#4A4741" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="mk-choice" viewBox="0 0 80 80"><rect x="40" y="12" width="6" height="62" transform="translate(3 4)" fill="#1C1B19" opacity=".18"/><rect x="37" y="8" width="6" height="66" fill="#4A4741" stroke="#1C1B19" stroke-width="2" stroke-linejoin="round"/><path d="M43 16 H66 L75 24 L66 32 H43 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M37 40 H14 L5 48 L14 56 H37 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/></symbol>
  <symbol id="mk-why" viewBox="0 0 80 80"><path d="M10 64 H70 M10 54 H44" stroke="#4A4741" stroke-width="2.4" stroke-linecap="round"/><g transform="rotate(-38 40 38)"><rect x="12" y="32" width="46" height="13" transform="translate(3 4)" fill="#1C1B19" opacity=".18"/><rect x="18" y="32" width="40" height="13" fill="#F0C75E" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M58 32 L74 38.5 L58 45 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M69.5 36.8 L74 38.5 L69.5 40.2 Z" fill="#1C1B19"/><rect x="9" y="32" width="9" height="13" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2"/><rect x="16" y="32" width="3.5" height="13" fill="#4A4741"/></g></symbol>
  <symbol id="mk-see" viewBox="0 0 80 80"><rect x="18" y="16" width="44" height="50" transform="translate(3 4)" fill="#1C1B19" opacity=".18"/><rect x="18" y="16" width="44" height="50" fill="#10242B" stroke="#1C1B19" stroke-width="2.2"/><circle cx="48" cy="32" r="6" fill="#CFE8EF"/><path d="M26 66 V54 H34 V66 M38 66 V48 H46 V66" fill="#1D3B46"/><path d="M12 12 H34 Q30 40 33 68 H12 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M68 12 H46 Q50 40 47 68 H68 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M20 18 Q18 40 21 64 M27 16 Q25 40 28 66 M60 18 Q62 40 59 64 M53 16 Q55 40 52 66" stroke="#4A4741" stroke-width="1.4" fill="none"/><path d="M6 11 H74" stroke="#1C1B19" stroke-width="3" stroke-linecap="round"/></symbol>
  <symbol id="mk-ticket" viewBox="0 0 120 80"><path d="M8 14 H112 V32 a8 8 0 0 0 0 16 V66 H8 V48 a8 8 0 0 0 0 -16 Z" transform="translate(4 5)" fill="#1C1B19" opacity=".18"/><path d="M8 14 H112 V32 a8 8 0 0 0 0 16 V66 H8 V48 a8 8 0 0 0 0 -16 Z" fill="#E7DFCE" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M84 14 V66" stroke="#1C1B19" stroke-width="2" stroke-dasharray="4 5"/><text x="42" y="52" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-size="34" fill="#1C1B19">18+</text></symbol>
  <symbol id="mk-lamp" viewBox="0 0 80 80"><path d="M16 70 H52 V66 H16 Z" fill="#4A4741" stroke="#1C1B19" stroke-width="2"/><path d="M34 66 L30 38 L50 20" fill="none" stroke="#1C1B19" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 14 L64 24 L56 40 L38 30 Z" fill="#F0C75E" stroke="#1C1B19" stroke-width="2.2" stroke-linejoin="round"/><path d="M56 44 L70 70 H42 Z" fill="#F0C75E" opacity=".25"/></symbol>

  <symbol id="ic-sound" viewBox="0 0 24 24"><path d="M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16.5 9 Q18.5 12 16.5 15 M19 6.5 Q23 12 19 17.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="ic-sound-off" viewBox="0 0 24 24"><path d="M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M17 9.5 L22 14.5 M22 9.5 L17 14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="ic-settings" viewBox="0 0 24 24"><path d="M3 7 H21 M3 12 H21 M3 17 H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="14" y="4.5" width="4" height="5" fill="var(--paper)" stroke="currentColor" stroke-width="2"/><rect x="6" y="9.5" width="4" height="5" fill="var(--paper)" stroke="currentColor" stroke-width="2"/><rect x="12" y="14.5" width="4" height="5" fill="var(--paper)" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="ic-support" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5.6 5.6 L9.4 9.4 M18.4 5.6 L14.6 9.4 M5.6 18.4 L9.4 14.6 M18.4 18.4 L14.6 14.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="ic-exit" viewBox="0 0 24 24"><path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="ic-back" viewBox="0 0 24 24"><path d="M10 6 L4 12 L10 18 M4 12 H20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="ic-replay" viewBox="0 0 24 24"><path d="M5 12 a7 7 0 1 0 2.2 -5.1 M5 4.5 V8.5 H9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  </defs></svg>`;

  const DT = {};

  DT.wordmark = (cls) => `<a class="wordmark ${cls || ''}" href="index.html" aria-label="DigiTales AI, home">Dig<span class="wm-i" aria-hidden="true">ı</span>Tales<span class="wm-ai" aria-hidden="true">AI</span></a>`;
  DT.topbar = () => `<header class="topbar">${DT.wordmark()}<nav aria-label="Site"><a href="about.html">About and AI use</a><a href="support.html">Need support?</a></nav></header>`;
  DT.footer = () => `<footer class="footer"><span>SEGP Group 012. Prototype for supervisor feedback.</span><nav aria-label="Footer"><a href="about.html">About and AI use</a><a href="support.html">Need support?</a></nav></footer>`;
  DT.icon = (id, size) => `<svg class="ic" width="${size || 24}" height="${size || 24}" aria-hidden="true"><use href="#${id}"/></svg>`;
  DT.mark = (id, size, cls) => `<svg class="mk ${cls || ''}" width="${size || 72}" height="${size || 72}" viewBox="0 0 ${id === 'mk-ticket' ? '120 80' : '80 80'}" aria-hidden="true"><use href="#${id}"/></svg>`;
  // Photo tile: always a blurred stripe pattern with a label. The photo itself is never drawn.
  DT.photo = (w, h, label) => `<svg class="photo-tile" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Photo (hidden)" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="url(#photo-stripes)" filter="url(#blur2)"/><rect x="${w / 2 - 54}" y="${h / 2 - 15}" width="108" height="30" rx="4" fill="#F4EEE3" stroke="#1C1B19" stroke-width="1.5"/><text x="${w / 2}" y="${h / 2 + 5.5}" text-anchor="middle" font-family="Atkinson Hyperlegible Next, Atkinson Hyperlegible, sans-serif" font-weight="700" font-size="15" fill="#1C1B19">${label || 'Photo (hidden)'}</text></svg>`;

  /* deckle: a torn-paper edge made with a jittered clip-path (three hero elements at most) */
  DT.deckle = function (el, opt) {
    opt = Object.assign({ amp: 5, step: 13, edges: 'tblr', seed: 7 }, opt || {});
    const rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(opt.seed);
    function build() {
      const w = el.offsetWidth, h = el.offsetHeight, a = opt.amp, st = opt.step, e = opt.edges, pts = [];
      const j = () => (rnd() - .5) * 2 * a * .6 + a * .6;
      const t = e.includes('t'), b = e.includes('b'), l = e.includes('l'), r = e.includes('r');
      for (let x = 0; x <= w; x += st) pts.push([x, t ? j() : 0]);
      for (let y = 0; y <= h; y += st) pts.push([w - (r ? j() : 0), y]);
      for (let x = w; x >= 0; x -= st) pts.push([x, h - (b ? j() : 0)]);
      for (let y = h; y >= 0; y -= st) pts.push([l ? j() : 0, y]);
      el.style.clipPath = 'polygon(' + pts.map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';
    }
    build();
    if (root.ResizeObserver) new ResizeObserver(() => { opt.seed && build(); }).observe(el);
  };

  /* pointer and tilt parallax for dioramas */
  DT.parallax = function (host) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layers = [].slice.call(host.querySelectorAll('.lyr'));
    function move(nx, ny) { layers.forEach(l => { const d = parseFloat(l.dataset.depth || 0); l.style.transform = `translate(${(-nx * d * 26).toFixed(1)}px, ${(-ny * d * 12).toFixed(1)}px)`; }); }
    root.addEventListener('pointermove', ev => move(ev.clientX / root.innerWidth - .5, ev.clientY / root.innerHeight - .5), { passive: true });
    root.addEventListener('deviceorientation', ev => { if (ev.gamma == null) return; move(Math.max(-.5, Math.min(.5, ev.gamma / 60)), Math.max(-.5, Math.min(.5, (ev.beta - 45) / 90))); }, { passive: true });
  };

  /* state switch: ?s=name shows only the [data-show~="name"] blocks */
  DT.state = function (def) {
    const s = new URLSearchParams(location.search).get('s') || def || '';
    document.body.dataset.state = s;
    document.querySelectorAll('[data-show]').forEach(el => { el.hidden = !el.dataset.show.split(/\s+/).includes(s); });
    return s;
  };

  DT.init = function () {
    document.body.insertAdjacentHTML('afterbegin', DEFS);
    document.querySelectorAll('[data-topbar]').forEach(el => { el.outerHTML = DT.topbar(); });
    document.querySelectorAll('[data-footer]').forEach(el => { el.outerHTML = DT.footer(); });
    document.querySelectorAll('[data-wordmark]').forEach(el => { el.outerHTML = DT.wordmark(el.dataset.wordmark); });
    document.querySelectorAll('[data-mark]').forEach(el => { el.innerHTML = DT.mark(el.dataset.mark, el.dataset.size); });
    document.querySelectorAll('[data-icon]').forEach(el => { el.insertAdjacentHTML('afterbegin', DT.icon(el.dataset.icon, el.dataset.size)); });
    document.querySelectorAll('[data-photo]').forEach(el => { const p = el.dataset.photo.split('x'); el.innerHTML = DT.photo(+p[0], +p[1]); });
    if (root.Scenes) root.Scenes.mount(document);
    document.querySelectorAll('.diorama').forEach(DT.parallax);
    /* tell a parent gallery how tall this page is */
    if (root.parent !== root) {
      const post = () => root.parent.postMessage({ dtHeight: document.documentElement.scrollHeight, dtSrc: location.pathname.split('/').pop() + location.search }, '*');
      root.addEventListener('load', post);
      if (root.ResizeObserver) new ResizeObserver(post).observe(document.body);
    }
  };

  root.DT = DT;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => {}); // scripts sit at the end of body
})(window);

/* hidden attribute must win over display rules */
(function () { const st = document.createElement('style'); st.textContent = '[hidden]{display:none !important}'; document.head.appendChild(st); })();
