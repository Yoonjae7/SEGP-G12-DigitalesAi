/* Scaled live previews: each frame embeds a real page at its real width (1440 or 390) and shrinks it to fit. */
(function () {
  const NAV = [['index.html', 'Start here'], ['tokens.html', 'Tokens'], ['desktop.html', 'Desktop 1440'], ['mobile.html', 'Mobile 390'], ['characters.html', 'Characters'], ['scenes.html', 'Scene boards'], ['motion-voice.html', 'Motion and voice']];
  window.GAL = {
    nav(current) {
      const el = document.getElementById('gnav');
      if (!el) return;
      el.innerHTML = '<a class="wordmark sm" href="index.html" aria-label="DigiTales AI design pack">Dig<span class="wm-i">ı</span>Tales<span class="wm-ai">AI</span></a>' +
        NAV.map(n => `<a class="t" href="${n[0]}"${n[0] === current ? ' aria-current="page"' : ''}>${n[1]}</a>`).join('');
    },
    // frames: [{src, w, h, title, note, auto, scale}]
    frames(host, list, opt) {
      opt = opt || {};
      const root = typeof host === 'string' ? document.querySelector(host) : host;
      list.forEach(f => {
        const fig = document.createElement('figure'); fig.className = 'frame';
        fig.innerHTML = `<div class="box"></div><figcaption><b>${f.title}</b><span>${f.note || ''}</span> <a href="${f.src}" target="_blank" rel="noopener">Open full size</a></figcaption>`;
        root.appendChild(fig);
        const box = fig.querySelector('.box');
        const ifr = document.createElement('iframe');
        ifr.src = f.src; ifr.width = f.w; ifr.height = f.h; ifr.title = f.title; ifr.loading = 'lazy'; ifr.tabIndex = -1;
        box.appendChild(ifr);
        if (f.scale) fig.style.width = Math.round(f.w * f.scale) + 'px';
        function fit() {
          const s = box.clientWidth / f.w;
          ifr.style.transform = `scale(${s})`;
          box.style.height = Math.round(+ifr.height * s) + 'px';
        }
        fig._fit = fit; fig._ifr = ifr; fig._auto = !!f.auto;
        fit();
        new ResizeObserver(fit).observe(box);
      });
      window.addEventListener('message', e => {
        if (!e.data || !e.data.dtHeight) return;
        root.querySelectorAll('.frame').forEach(fig => {
          if (fig._ifr && fig._ifr.contentWindow === e.source && fig._auto) { fig._ifr.height = Math.max(e.data.dtHeight, 200); fig._fit(); }
        });
      });
    }
  };
})();
