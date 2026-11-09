/* Newsletter subscribers: people who signed up from the public site */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.screens.subscribers = {
    render(view) {
      const db = T.db, st = { q: '' };
      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Subscribers', title: 'Newsletter subscribers', desc: 'Email addresses collected from the newsletter box on the public site.',
        actions: '<button class="btn btn-outline" type="button" data-act="copy">' + I('copy', 16) + 'Copy all emails</button>'
      }) + '<section class="card"><div class="toolbar"><label class="search">' + I('search', 16) + '<input class="input" id="sq" type="search" placeholder="Search email" aria-label="Search subscribers"></label>' +
        '<span class="muted" id="scount"></span></div><div id="stable"></div></section>';
      const rows = () => db.subscribers.filter(s => !st.q || s.email.toLowerCase().includes(st.q.toLowerCase()));
      const count = () => { view.querySelector('#scount').textContent = U.num(db.subscribers.length) + ' subscribers'; }; count();
      const table = T.table(view.querySelector('#stable'), {
        pageSize: 10, getRows: rows, sort: { key: 'ts', dir: -1 },
        empty: U.empty('mail', 'No subscribers', 'Nobody matches that search.'),
        columns: [
          { key: 'email', label: 'Email', sortable: true, render: s => '<b style="font-weight:500">' + esc(s.email) + '</b>' },
          { key: 'source', label: 'Signed up from', sortable: true, render: s => esc(s.source) },
          { key: 'ts', label: 'Date', sortable: true, nowrap: true, render: s => U.date(s.ts) },
          { key: 'a', label: '', align: 'right', render: s => '<div class="row-actions"><button class="btn btn-ghost btn-sm" type="button" data-act="remove" data-id="' + s.id + '">Remove</button></div>' }
        ]
      });
      view.querySelector('#sq').addEventListener('input', U.debounce(e => { st.q = e.target.value; table.resetPage(); }, 160));
      view.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'copy') U.copy(db.subscribers.map(s => s.email).join(', '), ok => T.toast(ok ? 'All emails copied' : 'Could not copy', ok ? 'ok' : 'bad'));
        else if (b.dataset.act === 'remove') {
          const s = db.subscribers.find(x => x.id === b.dataset.id);
          T.modal.confirm({ title: 'Remove ' + s.email + '?', tone: 'danger', confirmLabel: 'Remove', message: 'They will no longer receive newsletters.',
            onConfirm() { db.subscribers.splice(db.subscribers.indexOf(s), 1); db.log('subscriber.remove', s.email); T.toast('Subscriber removed'); count(); table.resetPage(); } });
        }
      });
    }
  };
})(window.TEIN = window.TEIN || {});
