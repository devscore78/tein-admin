/* Sidebar: grouped navigation. Sub-admins never see Sub-admins or Audit log. */
(function (T) {
  'use strict';
  const I = T.icon;

  const GROUPS = [
    { title: 'Workspace', items: [
      { id: 'overview', label: 'Overview', icon: 'chart' },
      { id: 'members', label: 'Members', icon: 'users', count: () => T.db.members.filter(m => m.status === 'pending').length },
      { id: 'payments', label: 'Payments', icon: 'wallet' },
      { id: 'complaints', label: 'Complaints', icon: 'chat', count: () => T.db.complaints.filter(c => c.status === 'open').length }
    ] },
    { title: 'Public site', items: [
      { id: 'content', label: 'Content', icon: 'doc' },
      { id: 'subscribers', label: 'Subscribers', icon: 'mail' },
      { id: 'site-settings', label: 'Site settings', icon: 'sliders' }
    ] },
    { title: 'Access', mainOnly: true, items: [
      { id: 'sub-admins', label: 'Sub-admins', icon: 'shield' },
      { id: 'audit-log', label: 'Audit log', icon: 'clipboard' }
    ] }
  ];

  T.sidebar = {
    GROUPS,
    html(active) {
      const main = T.state.role === 'main';
      const nav = GROUPS.filter(g => main || !g.mainOnly).map(g =>
        '<div class="nav-group"><div class="nav-title">' + g.title + '</div>' + g.items.map(it => {
          const c = it.count ? it.count() : 0;
          return '<a class="nav-item' + (it.id === active ? ' is-active' : '') + '" href="#' + it.id + '" title="' + it.label + '"' + (it.id === active ? ' aria-current="page"' : '') + '>' +
            I(it.icon, 19) + '<span>' + it.label + '</span>' + (c ? '<em class="nav-count" style="font-style:normal">' + c + '</em>' : '') + '</a>';
        }).join('') + '</div>').join('');
      return '<aside class="rail" id="rail" aria-label="Main navigation">' +
        '<div class="rail-brand"><a class="wordmark" href="#overview"><b>TEIN</b><small>Admin</small></a>' +
        '<button class="btn-icon rail-close" type="button" data-act="drawer-close" aria-label="Close menu">' + I('x', 20) + '</button></div>' +
        '<nav>' + nav + '</nav>' +
        '<div class="rail-foot"><button class="rail-collapse" type="button" data-act="collapse" title="Collapse sidebar">' + I('panel', 19) + '<span>Collapse</span></button></div>' +
        '<div class="rail-actions"><a class="rail-btn is-green" href="#payments">Record payment</a>' +
        '<button class="rail-btn is-red" type="button" data-act="logout">Sign out</button>' +
        '<div class="rail-chips"><button type="button" data-act="theme">Theme</button><button type="button" data-act="role-toggle">Preview</button></div></div></aside>';
    }
  };
})(window.TEIN = window.TEIN || {});
