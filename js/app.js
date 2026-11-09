/* App: shell, hash router, theme toggle, global events */
(function (T) {
  'use strict';
  const app = document.getElementById('app');
  const html = document.documentElement;
  const ROUTES = ['overview', 'members', 'payments', 'complaints', 'content', 'subscribers', 'site-settings', 'sub-admins', 'audit-log'];
  let current = 'overview';

  /* ---------- storage (per viewer, optional) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- theme ---------- */
  function setTheme(t) { html.setAttribute('data-theme', t); store.set('tein-theme', t); T.chrome.refresh(); }
  const savedTheme = store.get('tein-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') html.setAttribute('data-theme', savedTheme);
  if (store.get('tein-rail') === '1') html.classList.add('rail-collapsed');

  /* ---------- chrome (rail + top bar) ---------- */
  T.chrome = {
    refresh() {
      const rail = document.getElementById('rail'), bar = document.getElementById('topbar');
      if (!rail || !bar) return;
      rail.outerHTML = T.sidebar.html(current);
      bar.outerHTML = T.topbar.html();
      const bn = document.getElementById('bnav-wrap'); if (bn) bn.outerHTML = T.bottomnav.html(current);
    }
  };

  function mountShell() {
    app.innerHTML = '<div class="shell">' + T.sidebar.html(current) + '<div class="main">' + T.topbar.html() +
      '<main class="content" id="view" tabindex="-1"></main></div></div><div class="drawer-scrim" data-act="drawer-close"></div>' + T.bottomnav.html(current);
    route();
  }

  /* ---------- router ---------- */
  function route() {
    const old = document.getElementById('view'); if (!old) return;
    let id = location.hash.replace('#', '') || 'overview';
    if (ROUTES.indexOf(id) < 0) id = 'overview';
    current = id;
    const screen = T.screens[id];
    html.classList.remove('drawer-open', 'qa-open');
    document.querySelectorAll('.tip').forEach(t => { t.style.display = 'none'; });
    /* a fresh container per page, so one screen's event listeners never leak into the next */
    const view = old.cloneNode(false);
    old.replaceWith(view);
    if (screen.mainOnly && T.state.role !== 'main') {
      view.innerHTML = '<section class="card">' + T.ui.empty('lock', 'Main admin only', 'Your role does not include this area. Ask the main admin if you need access.') + '</section>';
    } else {
      screen.render(view);
    }
    T.chrome.refresh();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- menus ---------- */
  function closeMenus() {
    document.querySelectorAll('.menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('[data-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenus(); html.classList.remove('drawer-open', 'qa-open'); } });

  /* ---------- global clicks ---------- */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-menu]');
    if (m) {
      const menu = document.getElementById('menu-' + m.dataset.menu), was = menu.hidden;
      closeMenus();
      menu.hidden = !was; m.setAttribute('aria-expanded', String(was));
      return;
    }
    if (!e.target.closest('.menu')) closeMenus();
    else if (e.target.closest('a.notif')) closeMenus();

    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'theme') { closeMenus(); setTheme(T.topbar.effectiveTheme() === 'dark' ? 'light' : 'dark'); }
    else if (act === 'collapse') { html.classList.toggle('rail-collapsed'); store.set('tein-rail', html.classList.contains('rail-collapsed') ? '1' : '0'); }
    else if (act === 'drawer-open') html.classList.add('drawer-open');
    else if (act === 'drawer-close') html.classList.remove('drawer-open');
    else if (act === 'qa-toggle') html.classList.toggle('qa-open');
    else if (act === 'qa-close') html.classList.remove('qa-open');
    else if (act === 'notif-read') { T.db.notifications.forEach(n => { n.unread = false; }); T.chrome.refresh(); }
    else if (act === 'role-toggle') {
      closeMenus();
      T.state.role = T.state.role === 'main' ? 'sub' : 'main';
      const restricted = T.screens[current].mainOnly && T.state.role !== 'main';
      if (restricted) history.replaceState(null, '', '#overview');
      route();
      T.toast(T.state.role === 'sub' ? 'Previewing as a sub-admin' : 'Back to main admin');
    }
    else if (act === 'logout') {
      closeMenus();
      app.innerHTML = T.login.html();
      history.replaceState(null, '', location.pathname + location.search);
    }
  });

  /* ---------- global search and sign-in ---------- */
  document.addEventListener('submit', e => {
    if (e.target.matches('form.gsearch')) {
      e.preventDefault();
      const q = e.target.querySelector('input').value.trim();
      T.state.memberQuery = q;
      if (location.hash === '#members') route(); else location.hash = 'members';
    } else if (e.target.id === 'lgform') {
      e.preventDefault();
      T.state.role = 'main'; location.hash = 'overview'; mountShell();
    }
  });

  mountShell();
})(window.TEIN = window.TEIN || {});
