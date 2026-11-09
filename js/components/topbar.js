/* Top bar: search, registration status, theme, notifications, account menu */
(function (T) {
  'use strict';
  const I = T.icon, U = T.ui, { esc } = U;

  function effectiveTheme() {
    const a = document.documentElement.getAttribute('data-theme');
    if (a === 'dark' || a === 'light') return a;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function notifMenu() {
    const list = T.db.notifications;
    return '<div class="menu wide" id="menu-notif" hidden>' +
      '<div class="menu-title"><span>Notifications</span><button type="button" data-act="notif-read">Mark all read</button></div>' +
      list.map(n => '<a class="notif' + (n.unread ? ' is-unread' : '') + '" href="' + n.href + '"><span class="nic">' + I(n.icon, 16) + '</span><div><p>' + esc(n.text) + '</p><small>' + U.rel(n.ts) + '</small></div></a>').join('') + '</div>';
  }
  function profileMenu() {
    const me = T.me(), main = T.state.role === 'main';
    return '<div class="menu" id="menu-profile" hidden>' +
      '<div class="menu-person">' + U.avatar(me.name, 40) + '<div><b>' + esc(me.name) + '</b><small>' + esc(me.email) + '</small></div></div><div class="menu-sep"></div>' +
      '<button class="menu-item" type="button" data-act="theme">' + I(effectiveTheme() === 'dark' ? 'sun' : 'moon', 18) + (effectiveTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') + '</button>' +
      '<button class="menu-item" type="button" data-act="role-toggle">' + I('eye', 18) + (main ? 'Preview as sub-admin' : 'Back to main admin') + '</button>' +
      '<div class="menu-sep"></div><button class="menu-item is-danger" type="button" data-act="logout">' + I('logout', 18) + 'Sign out</button></div>';
  }

  T.topbar = {
    effectiveTheme,
    html() {
      const me = T.me(), open = T.db.settings.registrationOpen, unread = T.db.notifications.filter(n => n.unread).length;
      const dark = effectiveTheme() === 'dark';
      return '<header class="topbar" id="topbar">' +
        (T.state.role === 'sub' ? '<div class="preview-strip"><span>You are previewing the dashboard as a sub-admin. Sub-admins and Audit log are hidden.</span><button type="button" data-act="role-toggle">Back to main admin</button></div>' : '') +
        '<div class="topbar-in">' +
        '<button class="btn-icon menu-btn" type="button" data-act="drawer-open" aria-label="Open menu">' + I('menu', 22) + '</button>' +
        '<form class="gsearch" role="search">' + I('search', 17) + '<input id="gsearch" type="search" placeholder="Search members" aria-label="Find a member"></form>' +
        '<div class="tb-right">' +
        '<a class="reg-pill' + (open ? '' : ' is-closed') + '" href="#site-settings" title="Registration is ' + (open ? 'open' : 'closed') + '. Click to change."><i></i><span class="txt">Registration ' + (open ? 'open' : 'closed') + '</span></a>' +
        '<button class="btn-icon" type="button" data-act="theme" aria-label="' + (dark ? 'Switch to light mode' : 'Switch to dark mode') + '" title="' + (dark ? 'Light mode' : 'Dark mode') + '">' + I(dark ? 'sun' : 'moon', 20) + '</button>' +
        '<div class="menu-wrap"><button class="btn-icon" type="button" data-menu="notif" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">' + I('bell', 20) + (unread ? '<span class="dot-count">' + unread + '</span>' : '') + '</button>' + notifMenu() + '</div>' +
        '<div class="menu-wrap"><button class="profile-btn" type="button" data-menu="profile" aria-haspopup="true" aria-expanded="false">' + U.avatar(me.name, 34) +
        '<span class="who"><b>' + esc(me.name.split(' ').slice(0, 2).join(' ')) + '</b><small>' + esc(me.title) + '</small></span>' + I('chevD', 15) + '</button>' + profileMenu() + '</div>' +
        '</div></div></header>';
    }
  };
})(window.TEIN = window.TEIN || {});
