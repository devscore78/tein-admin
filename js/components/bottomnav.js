/* Bottom nav (phones): floating pill with Home, Members, a centre Quick add button, Payments and More. */
(function (T) {
  'use strict';
  const I = T.icon;
  const ITEMS = [
    { id: 'overview', label: 'Home', icon: 'chart' },
    { id: 'members', label: 'Members', icon: 'users' },
    null,
    { id: 'payments', label: 'Payments', icon: 'wallet' },
    { more: true, label: 'More', icon: 'menu' }
  ];
  const QUICK = [
    { href: '#members', label: 'Add a member', icon: 'users' },
    { href: '#payments', label: 'Record a payment', icon: 'wallet' },
    { href: '#content', label: 'New event or post', icon: 'calendar' },
    { href: '#complaints', label: 'Open complaints', icon: 'chat' }
  ];
  T.bottomnav = {
    html(active) {
      const direct = ITEMS.filter(Boolean).filter(i => i.id).map(i => i.id);
      const items = ITEMS.map(it => {
        if (!it) return '<button class="bn-add" type="button" data-act="qa-toggle" aria-label="Quick add">' + I('plus', 28) + '</button>';
        if (it.more) return '<button class="bn' + (direct.indexOf(active) < 0 ? ' is-active' : '') + '" type="button" data-act="drawer-open" aria-label="More">' + I(it.icon, 22) + '<span>' + it.label + '</span></button>';
        const on = it.id === active;
        return '<a class="bn' + (on ? ' is-active' : '') + '" href="#' + it.id + '"' + (on ? ' aria-current="page"' : '') + '>' + I(it.icon, 22) + '<span>' + it.label + '</span></a>';
      }).join('');
      const quick = QUICK.map(q => '<a href="' + q.href + '"><span class="qa-ic">' + I(q.icon, 18) + '</span>' + q.label + '</a>').join('');
      return '<div id="bnav-wrap"><div class="qa" data-act="qa-close"><div class="qa-card" role="menu" aria-label="Quick add">' + quick + '</div></div>' +
        '<nav class="bnav" aria-label="Quick navigation">' + items + '</nav></div>';
    }
  };
})(window.TEIN = window.TEIN || {});
