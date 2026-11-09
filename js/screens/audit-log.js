/* Audit log: read-only record of what every admin did. Main admin only. */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;

  T.screens['audit-log'] = {
    mainOnly: true,
    render(view) {
      const db = T.db, st = { q: '', action: '', actor: '' };
      const actors = Array.from(new Set(db.audit.map(a => a.actor))).sort();

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Access', title: 'Audit log',
        desc: 'A permanent record of sign-ins and changes. Entries cannot be edited or deleted.'
      }) + '<section class="card"><div class="toolbar">' +
        '<label class="search">' + I('search', 16) + '<input class="input" id="xq" type="search" placeholder="Search target or person" aria-label="Search the audit log"></label>' +
        U.select('xaction', [['', 'All actions']].concat(Object.keys(db.ACTIONS).map(k => [k, db.ACTIONS[k].label])), '') +
        U.select('xactor', [['', 'Everyone']].concat(actors.map(a => [a, a])), '') +
        '</div><div id="xtable"></div></section>';

      const table = T.table(view.querySelector('#xtable'), {
        pageSize: 15, sort: { key: 'ts', dir: -1 },
        getRows: () => {
          const q = st.q.trim().toLowerCase();
          return db.audit.filter(a => (!st.action || a.action === st.action) && (!st.actor || a.actor === st.actor) &&
            (!q || (a.target + ' ' + a.actor + ' ' + db.ACTIONS[a.action].label).toLowerCase().includes(q)));
        },
        empty: U.empty('clipboard', 'No entries', 'Nothing in the log matches these filters.'),
        columns: [
          { key: 'ts', label: 'When', sortable: true, nowrap: true, render: a => '<span class="num">' + U.date(a.ts, true) + '</span>' },
          { key: 'actor', label: 'Who', sortable: true, render: a => '<div class="cell-person" style="min-width:170px">' + U.avatar(a.actor, 30) + '<div><b>' + esc(a.actor) + '</b><small>' + esc(a.role) + '</small></div></div>' },
          { key: 'action', label: 'Action', sortable: true, sortVal: a => db.ACTIONS[a.action].label, render: a => U.badge(db.ACTIONS[a.action].kind, db.ACTIONS[a.action].label) },
          { key: 'target', label: 'Details', render: a => esc(a.target) },
          { key: 'ip', label: 'IP address', render: a => '<span class="mono muted">' + esc(a.ip) + '</span>' }
        ]
      });

      view.querySelector('#xq').addEventListener('input', U.debounce(e => { st.q = e.target.value; table.resetPage(); }, 160));
      view.querySelector('#xaction').addEventListener('change', e => { st.action = e.target.value; table.resetPage(); });
      view.querySelector('#xactor').addEventListener('change', e => { st.actor = e.target.value; table.resetPage(); });
    }
  };
})(window.TEIN = window.TEIN || {});
