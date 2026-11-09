/* Charts: line, bar, donut. Plain SVG, drawn to the container width, colours from theme tokens. */
(function (T) {
  'use strict';
  const { esc, num } = T.ui;

  /* tooltip */
  let tipEl;
  const tip = {
    show(html, x, y) {
      if (!tipEl || !document.body.contains(tipEl)) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); }
      tipEl.innerHTML = html; tipEl.style.display = 'block';
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      tipEl.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
      tipEl.style.top = Math.max(8, y - h - 14) + 'px';
    },
    hide() { if (tipEl) tipEl.style.display = 'none'; }
  };

  function nice(min, max, count) {
    const range = (max - min) || 1, rough = range / count, pow = Math.pow(10, Math.floor(Math.log10(rough))), f = rough / pow;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
    return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
  }
  const compact = v => { const a = Math.abs(v); return a >= 1000 ? (+(v / 1000).toFixed(1)) + 'k' : String(v); };

  function mount(host, draw) {
    draw();
    if (typeof ResizeObserver === 'function') {
      let last = host.clientWidth;
      new ResizeObserver(() => { if (host.clientWidth !== last) { last = host.clientWidth; draw(); } }).observe(host);
    }
  }
  function bindHits(host, fn) {
    host.querySelectorAll('.hit').forEach(r => {
      const go = e => { const t = e.touches ? e.touches[0] : e; fn(+r.dataset.i, r, t.clientX, t.clientY); };
      r.addEventListener('mouseenter', go); r.addEventListener('mousemove', go); r.addEventListener('touchstart', go, { passive: true });
      r.addEventListener('mouseleave', () => fn(-1)); r.addEventListener('touchend', () => setTimeout(() => fn(-1), 1200));
    });
  }

  /* ---------- line ---------- */
  function line(host, o) {
    mount(host, () => {
      const W = Math.max(280, host.clientWidth), H = o.height || 250, m = { t: 22, r: 22, b: 30, l: 46 };
      const v = o.values, n = v.length, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v);
      const sc = nice(mn - (mx - mn) * .15, mx, 4), iw = W - m.l - m.r, ih = H - m.t - m.b;
      const X = i => m.l + i * iw / (n - 1), Y = val => m.t + ih - (val - sc.lo) / (sc.hi - sc.lo) * ih;
      const pts = v.map((val, i) => X(i).toFixed(1) + ',' + Y(val).toFixed(1));
      const skip = W < 520 ? 2 : 1;
      let g = '';
      for (let t = sc.lo; t <= sc.hi + 1e-6; t += sc.step) {
        g += '<line class="gridline" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text x="' + (m.l - 10) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + compact(t) + '</text>';
      }
      const labels = o.labels.map((l, i) => (n - 1 - i) % skip === 0 ? '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>' : '').join('');
      const bw = iw / (n - 1);
      const hits = v.map((_, i) => '<rect class="hit" data-i="' + i + '" x="' + (X(i) - bw / 2) + '" y="' + m.t + '" width="' + bw + '" height="' + ih + '"/>').join('');
      const ex = X(n - 1), ey = Y(v[n - 1]);
      host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Line chart') + '">' + g +
        '<path d="M' + pts.join('L') + 'L' + ex + ',' + (m.t + ih) + 'L' + X(0) + ',' + (m.t + ih) + 'Z" style="fill:var(--c-green);opacity:.1"/>' +
        '<path d="M' + pts.join('L') + '" fill="none" style="stroke:var(--c-green)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="' + ex + '" cy="' + ey + '" r="9" style="fill:var(--c-red);opacity:.16"/><circle cx="' + ex + '" cy="' + ey + '" r="4.5" style="fill:var(--c-red)"/>' +
        '<text class="val" x="' + ex + '" y="' + (ey - 16) + '" text-anchor="end">' + num(v[n - 1]) + '</text>' + labels +
        '<line id="guide" y1="' + m.t + '" y2="' + (m.t + ih) + '" style="stroke:var(--line-strong)" stroke-dasharray="3 3" visibility="hidden"/><circle id="hdot" r="5" style="fill:var(--surface);stroke:var(--c-green)" stroke-width="2.4" visibility="hidden"/>' + hits + '</svg>';
      const guide = host.querySelector('#guide'), dot = host.querySelector('#hdot');
      bindHits(host, (i, r, cx, cy) => {
        if (i < 0) { guide.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hide(); return; }
        guide.setAttribute('x1', X(i)); guide.setAttribute('x2', X(i)); guide.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(v[i])); dot.setAttribute('visibility', 'visible');
        tip.show('<b>' + num(v[i]) + '</b> ' + esc(o.unit || '') + '<br>' + esc((o.full || o.labels)[i]), cx, cy);
      });
    });
  }

  /* ---------- bars ---------- */
  function bars(host, o) {
    mount(host, () => {
      const W = Math.max(280, host.clientWidth), H = o.height || 250, m = { t: 22, r: 10, b: 30, l: 46 };
      const v = o.values, n = v.length, mx = Math.max.apply(null, v), sc = nice(0, mx, 4);
      const iw = W - m.l - m.r, ih = H - m.t - m.b, band = iw / n, bw = Math.min(34, band * .62);
      const Y = val => m.t + ih - (val - sc.lo) / (sc.hi - sc.lo) * ih;
      const skip = W < 520 ? 2 : 1;
      let g = '';
      for (let t = sc.lo; t <= sc.hi + 1e-6; t += sc.step) {
        g += '<line class="gridline" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text x="' + (m.l - 10) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + compact(t) + '</text>';
      }
      let b = '', lab = '', hits = '';
      v.forEach((val, i) => {
        const x = m.l + band * i + (band - bw) / 2, y = Y(val), last = i === n - 1;
        b += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(0, m.t + ih - y) + '" rx="3" style="fill:var(' + (last ? '--c-red' : '--c-green') + ')"/>';
        if ((n - 1 - i) % skip === 0) lab += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(o.labels[i]) + '</text>';
        hits += '<rect class="hit" data-i="' + i + '" x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + ih + '"/>';
      });
      const lx = m.l + band * (n - 1) + band / 2;
      host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Bar chart') + '">' + g + b +
        '<text class="val" x="' + Math.min(lx, W - 28) + '" y="' + (Y(v[n - 1]) - 8) + '" text-anchor="middle">' + compact(v[n - 1]) + '</text>' + lab + hits + '</svg>';
      bindHits(host, (i, r, cx, cy) => {
        if (i < 0) { tip.hide(); return; }
        tip.show('<b>GHS ' + num(v[i]) + '</b><br>' + esc((o.full || o.labels)[i]) + (i === n - 1 ? ' (to date)' : ''), cx, cy);
      });
    });
  }

  /* ---------- donut ---------- */
  function donut(host, o) {
    const total = o.items.reduce((s, i) => s + i.value, 0);
    const r = 66, sw = 26, C = 2 * Math.PI * r, gap = 2.5;
    let acc = 0, segs = '';
    o.items.forEach((it, i) => {
      const len = it.value / total * C;
      segs += '<circle class="hit" data-i="' + i + '" cx="88" cy="88" r="' + r + '" fill="none" stroke-width="' + sw + '" style="stroke:' + it.color + '" ' +
        'stroke-dasharray="' + Math.max(len - gap, 0) + ' ' + C + '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90 88 88)"/>';
      acc += len;
    });
    host.innerHTML = '<div class="donut"><svg viewBox="0 0 176 176" role="img" aria-label="' + esc(o.aria || 'Donut chart') + '">' + segs +
      '<text class="center-num" x="88" y="92" text-anchor="middle">' + num(total) + '</text><text class="center-lab" x="88" y="110" text-anchor="middle">' + esc(o.center || 'total') + '</text></svg>' +
      '<ul class="legend">' + o.items.map(it => '<li><i style="background:' + it.color + '"></i><b>' + esc(it.label) + '</b><span class="v"><strong>' + num(it.value) + '</strong>' + Math.round(it.value / total * 100) + '%</span></li>').join('') + '</ul></div>';
    host.querySelectorAll('.hit').forEach(c => {
      const go = e => { const it = o.items[+c.dataset.i]; tip.show('<b>' + esc(it.label) + '</b><br>' + num(it.value) + ' members (' + Math.round(it.value / total * 100) + '%)', e.clientX, e.clientY); };
      c.addEventListener('mouseenter', go); c.addEventListener('mousemove', go); c.addEventListener('mouseleave', tip.hide);
    });
  }

  T.charts = { line, bars, donut };
})(window.TEIN = window.TEIN || {});
