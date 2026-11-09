/* Shared helpers: formatting, small HTML builders */
(function (T) {
  'use strict';
  const I = T.icon;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = n => String(n).padStart(2, '0');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n).toLocaleString('en-GB');
  const money = n => 'GHS ' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const date = (ts, withTime) => {
    const d = new Date(ts);
    let s = pad(d.getDate()) + ' ' + MONTHS[d.getMonth()];
    if (d.getFullYear() !== new Date().getFullYear()) s += ' ' + d.getFullYear();
    return withTime ? s + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : s;
  };
  const rel = ts => {
    const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'just now';
    const m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    const d = Math.round(h / 24); if (d < 14) return d + ' d ago';
    return date(ts);
  };
  const initials = name => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const tone = name => hash(String(name)) % 3;
  const avatar = (name, size, photo) =>
    '<span class="avatar av-' + tone(name) + '" style="--sz:' + (size || 36) + 'px">' +
    (photo ? '<img src="' + esc(photo) + '" alt="">' : esc(initials(name))) + '</span>';

  const badge = (kind, text, dot) =>
    '<span class="badge b-' + kind + '">' + (dot === false ? '' : '<i></i>') + esc(text) + '</span>';

  const status = {
    member: s => ({ approved: badge('ok', 'Approved'), pending: badge('neutral', 'Pending'), suspended: badge('bad', 'Suspended') }[s]),
    dues: s => s === 'paid' ? badge('ok', 'Paid') : badge('bad', 'Unpaid'),
    payment: s => ({ success: badge('ok', 'Success'), pending: badge('neutral', 'Pending'), failed: badge('bad', 'Failed') }[s]),
    complaint: s => ({ open: badge('bad', 'Open'), progress: badge('ink', 'In progress'), resolved: badge('ok', 'Resolved') }[s]),
    admin: s => ({ active: badge('ok', 'Active'), suspended: badge('bad', 'Suspended'), invited: badge('neutral', 'Invite sent') }[s])
  };

  const select = (id, options, value, cls) =>
    '<select class="select ' + (cls || '') + '" id="' + id + '">' +
    options.map(o => {
      const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';

  const toggle = (id, checked, label, large) =>
    '<label class="switch' + (large ? ' switch-lg' : '') + '"><input type="checkbox" role="switch" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
    '<span class="track"><span class="thumb"></span></span>' + (label ? '<span class="sw-label">' + esc(label) + '</span>' : '') + '</label>';

  const pageHeader = o =>
    '<header class="page-head"><div><div class="eyebrow">' + esc(o.eyebrow) + '</div><h1>' + esc(o.title) + '</h1>' +
    (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') + '</div>' +
    (o.actions ? '<div class="page-actions">' + o.actions + '</div>' : '') + '</header>';

  const empty = (icon, title, text) =>
    '<div class="empty"><div class="ring">' + I(icon, 22) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>';

  const debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; };

  const copy = (text, done) => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); done(ok);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
      else fallback();
    } catch (e) { fallback(); }
  };

  const readImage = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ src: r.result, name: file.name });
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const localDateInput = ts => { const d = new Date(ts || Date.now()); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

  T.screens = T.screens || {};
  T.state = { role: 'main', memberQuery: '', contentTab: 'events' };
  T.ui = { esc, num, money, date, rel, initials, avatar, badge, status, select, toggle, pageHeader, empty, debounce, copy, readImage, localDateInput, MONTHS, pad };
})(window.TEIN = window.TEIN || {});
