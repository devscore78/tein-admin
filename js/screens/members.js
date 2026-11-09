/* Members: search, filters, bulk actions, row actions, profile modal */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;

  function csv(list) {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    return [['Name', 'Student ID', 'Phone', 'Email', 'Level', 'Hall', 'Dues', 'Status'].join(',')]
      .concat(list.map(m => [m.name, m.studentId, m.phone, m.email, m.level + 'L', m.hall, m.dues, m.status].map(q).join(','))).join('\n');
  }

  T.screens.members = {
    render(view) {
      const db = T.db;
      const st = { q: T.state.memberQuery || '', level: '', hall: '', dues: '', status: '' };
      T.state.memberQuery = '';
      const halls = Array.from(new Set(db.members.map(m => m.hall))).sort();

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Members', title: 'Members',
        desc: 'Review registrations, check dues and manage access for every member.',
        actions: '<button class="btn btn-outline" type="button" data-act="export">' + I('download', 16) + 'Export CSV</button>'
      }) +
        '<section class="card">' +
        '<div class="toolbar">' +
        '<label class="search">' + I('search', 16) + '<input class="input" id="mq" type="search" placeholder="Search name, student ID or phone" aria-label="Search members" value="' + esc(st.q) + '"></label>' +
        U.select('mlevel', [['', 'All levels'], ['100', '100 level'], ['200', '200 level'], ['300', '300 level'], ['400', '400 level']], '') +
        U.select('mhall', [['', 'All halls']].concat(halls.map(h => [h, h])), '') +
        U.select('mdues', [['', 'Any dues status'], ['paid', 'Paid'], ['unpaid', 'Unpaid']], '') +
        U.select('mstatus', [['', 'Any status'], ['pending', 'Pending'], ['approved', 'Approved'], ['suspended', 'Suspended']], '') +
        '<button class="btn btn-ghost btn-sm" type="button" id="mclear">Clear filters</button></div>' +
        '<div class="bulkbar" id="mbulk" hidden></div>' +
        '<div id="mtable"></div></section>';

      const rows = () => {
        const q = st.q.trim().toLowerCase();
        return db.members.filter(m => {
          if (st.level && String(m.level) !== st.level) return false;
          if (st.hall && m.hall !== st.hall) return false;
          if (st.dues && m.dues !== st.dues) return false;
          if (st.status && m.status !== st.status) return false;
          return !q || (m.name + ' ' + m.studentId + ' ' + m.phone + ' ' + m.email).toLowerCase().includes(q);
        });
      };

      const bulk = view.querySelector('#mbulk');
      function showBulk(ids) {
        if (!ids.length) { bulk.hidden = true; return; }
        const pend = ids.filter(id => (db.member(id) || {}).status === 'pending').length;
        bulk.hidden = false;
        bulk.innerHTML = '<span>' + ids.length + ' selected</span><span class="spacer"></span>' +
          '<button class="btn btn-green btn-sm" type="button" data-act="bulk-approve"' + (pend ? '' : ' disabled title="None of the selected members are pending"') + '>' + I('check', 15) + 'Approve selected' + (pend ? ' (' + pend + ')' : '') + '</button>' +
          '<button class="btn btn-white btn-sm" type="button" data-act="export">' + I('download', 15) + 'Export selected</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="bulk-clear">Clear</button>';
      }

      const table = T.table(view.querySelector('#mtable'), {
        selectable: true, pageSize: 12, getRows: rows, sort: { key: 'joined', dir: -1 },
        onSelect: showBulk,
        note: 'These are sample records. Connect your database to load all ' + U.num(T.analytics.totalMembers) + ' members.',
        empty: U.empty('users', 'No members found', 'Try a different search or clear the filters.'),
        columns: [
          { key: 'name', label: 'Member', sortable: true, render: m => '<div class="cell-person">' + U.avatar(m.name, 34, m.photo) + '<div><b>' + esc(m.name) + '</b><small>' + esc(m.hall) + '</small></div></div>' },
          { key: 'studentId', label: 'Student ID', sortable: true, render: m => '<span class="mono">' + esc(m.studentId) + '</span>' },
          { key: 'phone', label: 'Phone', nowrap: true, render: m => '<span class="num">' + esc(m.phone) + '</span>' },
          { key: 'level', label: 'Level', sortable: true, render: m => m.level + 'L' },
          { key: 'dues', label: 'Dues', sortable: true, render: m => U.status.dues(m.dues) },
          { key: 'status', label: 'Status', sortable: true, render: m => U.status.member(m.status) },
          { key: 'joined', label: 'Registered', sortable: true, nowrap: true, render: m => '<span class="muted">' + U.date(m.joined) + '</span>' },
          {
            key: 'actions', label: '', align: 'right', render: m =>
              '<div class="row-actions"><button class="btn btn-white btn-sm" type="button" data-act="view" data-id="' + m.id + '">View</button>' +
              (m.status === 'pending' ? '<button class="btn btn-green btn-sm" type="button" data-act="approve" data-id="' + m.id + '">Approve</button>' : '') +
              (m.status === 'approved' ? '<button class="btn btn-outline-red btn-sm" type="button" data-act="suspend" data-id="' + m.id + '">Suspend</button>' : '') +
              (m.status === 'suspended' ? '<button class="btn btn-outline btn-sm" type="button" data-act="reinstate" data-id="' + m.id + '">Reinstate</button>' : '') + '</div>'
          }
        ]
      });

      const apply = () => { table.resetPage(); };
      view.querySelector('#mq').addEventListener('input', U.debounce(e => { st.q = e.target.value; apply(); }, 160));
      [['mlevel', 'level'], ['mhall', 'hall'], ['mdues', 'dues'], ['mstatus', 'status']].forEach(p =>
        view.querySelector('#' + p[0]).addEventListener('change', e => { st[p[1]] = e.target.value; apply(); }));
      view.querySelector('#mclear').addEventListener('click', () => {
        st.q = st.level = st.hall = st.dues = st.status = '';
        view.querySelector('#mq').value = '';
        ['mlevel', 'mhall', 'mdues', 'mstatus'].forEach(id => { view.querySelector('#' + id).value = ''; });
        apply();
      });

      function openExport() {
        const sel = table.selected();
        const list = sel.length ? sel.map(id => db.member(id)).filter(Boolean) : rows();
        const text = csv(list);
        T.modal.open({
          title: 'Export CSV', size: 'lg',
          subtitle: list.length + ' member' + (list.length === 1 ? '' : 's') + (sel.length ? ' selected' : ' matching the current filters'),
          body: '<label class="label" for="csvout">Copy this into a spreadsheet, or save it as a .csv file</label><textarea class="textarea mono" id="csvout" readonly rows="10" style="margin-top:6px;white-space:pre">' + esc(text) + '</textarea>',
          footer: '<button class="btn btn-ghost" type="button" data-close>Close</button><button class="btn btn-green" type="button" data-copy>' + I('copy', 16) + 'Copy CSV</button>',
          onMount(el) {
            el.querySelector('[data-copy]').addEventListener('click', () => U.copy(text, ok => {
              if (ok) T.toast('CSV copied', 'ok'); else { el.querySelector('#csvout').select(); T.toast('Press Ctrl+C to copy the selected text'); }
            }));
          }
        });
      }

      view.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const id = b.dataset.id, act = b.dataset.act;
        if (act === 'view') T.memberProfile.open(id, () => table.render());
        else if (act === 'approve') { T.actions.approve(id); table.render(); }
        else if (act === 'reinstate') { T.actions.reinstate(id); table.render(); }
        else if (act === 'suspend') {
          const m = db.member(id);
          T.modal.confirm({
            title: 'Suspend ' + m.name + '?', tone: 'danger', confirmLabel: 'Suspend member',
            message: 'They will lose access to member features until you reinstate them.',
            onConfirm() { T.actions.suspend(id); table.render(); }
          });
        }
        else if (act === 'bulk-approve') { const n = T.actions.approve(table.selected()); if (!n) T.toast('None of the selected members are pending'); table.clear(); }
        else if (act === 'bulk-clear') table.clear();
        else if (act === 'export') openExport();
      });
    }
  };
})(window.TEIN = window.TEIN || {});
