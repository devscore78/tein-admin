/* Payments: totals, records table, manual entry, receipts */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;

  function receipt(p) {
    return (p.receipt ? '<img class="receipt-img" src="' + esc(p.receipt) + '" alt="Uploaded receipt">' : '') + '<div class="receipt"><div class="rhead"><div><div class="eyebrow">Amount received</div><div class="amount num">' + U.money(p.amount) + '</div></div>' + U.status.payment(p.status) + '</div>' +
      '<dl class="kv"><div><dt>Member</dt><dd>' + esc(p.name) + '</dd></div><div><dt>Student ID</dt><dd class="mono">' + esc(p.studentId) + '</dd></div>' +
      '<div><dt>Reference</dt><dd class="mono">' + esc(p.ref) + '</dd></div><div><dt>Date</dt><dd>' + U.date(p.ts, true) + '</dd></div>' +
      '<div><dt>Method</dt><dd>' + ({ manual: 'Manual entry', receipt: 'Uploaded receipt', paystack: 'Paystack' }[p.method]) + ' · ' + esc(p.channel) + '</dd></div>' +
      '<div><dt>For</dt><dd>Dues ' + esc(T.db.settings.academicYear) + '</dd></div>' + (p.note ? '<div><dt>Note</dt><dd>' + esc(p.note) + '</dd></div>' : '') + '</dl></div>';
  }

  T.screens.payments = {
    render(view) {
      const db = T.db, st = { q: '', method: '', status: '', period: '' };
      const midnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Payments', title: 'Payments',
        desc: 'Every dues payment, whether it came through Paystack or was entered by hand.',
        actions: '<button class="btn btn-green" type="button" data-act="record">' + I('plus', 16) + 'Record manual payment</button>'
      }) +
        '<div class="stack"><section class="card" id="ptotals" aria-label="Totals"></section><section class="card" id="rqueue" aria-label="Receipts to verify"></section>' +
        '<section class="card"><div class="toolbar">' +
        '<label class="search">' + I('search', 16) + '<input class="input" id="pq" type="search" placeholder="Search member, student ID or reference" aria-label="Search payments"></label>' +
        U.select('pmethod', [['', 'All methods'], ['paystack', 'Paystack'], ['manual', 'Manual'], ['receipt', 'Uploaded receipt']], '') +
        U.select('pstatus', [['', 'Any status'], ['success', 'Success'], ['pending', 'Pending'], ['failed', 'Failed']], '') +
        U.select('pperiod', [['', 'All time'], ['today', 'Today'], ['week', 'Last 7 days']], '') +
        '</div><div id="ptable"></div></section></div>';

      function totals() {
        const pend = T.money.pending();
        view.querySelector('#ptotals').innerHTML = '<div class="kpis three">' +
          '<div class="kpi"><div class="kpi-label"><span>Collected today</span><em>GHS</em></div><div class="kpi-value">' + U.num(T.money.today()) + '</div><div class="kpi-sub">Since midnight</div></div>' +
          '<div class="kpi"><div class="kpi-label"><span>Collected this month</span><em>GHS</em></div><div class="kpi-value">' + U.num(T.money.monthToDate()) + '</div><div class="kpi-sub">Successful payments only</div></div>' +
          '<div class="kpi"><div class="kpi-label"><span>Awaiting confirmation</span><em>GHS</em></div><div class="kpi-value">' + U.num(pend.amount) + '</div><div class="kpi-sub">' + pend.count + ' payment' + (pend.count === 1 ? '' : 's') + ' pending</div></div></div>';
      }
      totals();

      function queue() {
        const q = db.payments.filter(p => p.method === 'receipt' && p.status === 'pending'), host = view.querySelector('#rqueue');
        if (!q.length) { host.innerHTML = '<div class="card-head"><div><h2 class="card-title">Receipts to verify</h2><p class="card-sub">Nothing waiting. Uploaded receipts from members appear here.</p></div></div><div style="height:16px"></div>'; return; }
        host.innerHTML = '<div class="card-head"><div><h2 class="card-title">Receipts to verify <span class="badge b-bad" style="margin-left:6px"><i></i>' + q.length + '</span></h2><p class="card-sub">Members who paid by bank, cash or transfer and uploaded proof. Approve to mark their dues as paid.</p></div></div><div class="rq-list">' +
          q.map(p => '<article class="rq"><button class="thumb" type="button" data-act="receipt" data-id="' + p.id + '" aria-label="View receipt">' + (p.receipt ? '<img src="' + esc(p.receipt) + '" alt="">' : '') + '</button>' +
            '<div class="rb"><b>' + esc(p.name) + '</b><small class="mono">' + esc(p.studentId) + '</small><small>' + U.money(p.amount) + ' · ' + esc(p.channel) + ' · ' + U.rel(p.ts) + '</small>' +
            '<div class="acts"><button class="btn btn-green btn-sm" type="button" data-act="approve" data-id="' + p.id + '">Approve</button><button class="btn btn-white btn-sm" type="button" data-act="reject" data-id="' + p.id + '">Reject</button></div></div></article>').join('') + '</div>';
      }
      queue();

      const rows = () => {
        const q = st.q.trim().toLowerCase();
        return db.payments.filter(p => {
          if (st.method && p.method !== st.method) return false;
          if (st.status && p.status !== st.status) return false;
          if (st.period === 'today' && p.ts < midnight) return false;
          if (st.period === 'week' && p.ts < Date.now() - 7 * 864e5) return false;
          return !q || (p.name + ' ' + p.studentId + ' ' + p.ref).toLowerCase().includes(q);
        });
      };
      const table = T.table(view.querySelector('#ptable'), {
        pageSize: 12, getRows: rows, sort: { key: 'ts', dir: -1 },
        empty: U.empty('wallet', 'No payments found', 'Try a different search or clear the filters.'),
        columns: [
          { key: 'name', label: 'Member', sortable: true, render: p => '<div class="cell-person">' + U.avatar(p.name, 34) + '<div><b>' + esc(p.name) + '</b><small class="mono">' + esc(p.studentId) + '</small></div></div>' },
          { key: 'amount', label: 'Amount', sortable: true, align: 'right', nowrap: true, render: p => '<b class="num" style="font-weight:600">' + U.money(p.amount) + '</b>' },
          { key: 'ts', label: 'Date', sortable: true, nowrap: true, render: p => U.date(p.ts, true) },
          { key: 'ref', label: 'Reference', render: p => '<span class="mono">' + esc(p.ref) + '</span>' },
          { key: 'method', label: 'Method', sortable: true, render: p => U.badge(p.method === 'paystack' ? 'ok' : 'neutral', { manual: 'Manual', receipt: 'Receipt', paystack: 'Paystack' }[p.method], false) },
          { key: 'status', label: 'Status', sortable: true, render: p => U.status.payment(p.status) },
          { key: 'a', label: '', align: 'right', render: p => '<div class="row-actions"><button class="btn btn-white btn-sm" type="button" data-act="receipt" data-id="' + p.id + '">Receipt</button></div>' }
        ]
      });

      view.querySelector('#pq').addEventListener('input', U.debounce(e => { st.q = e.target.value; table.resetPage(); }, 160));
      [['pmethod', 'method'], ['pstatus', 'status'], ['pperiod', 'period']].forEach(p =>
        view.querySelector('#' + p[0]).addEventListener('change', e => { st[p[1]] = e.target.value; table.resetPage(); }));

      function openReceipt(p) {
        T.modal.open({
          title: 'Receipt', subtitle: 'Reference ' + p.ref, body: receipt(p),
          footer: '<button class="btn btn-ghost" type="button" data-close>Close</button><button class="btn btn-outline" type="button" data-copy>' + I('copy', 16) + 'Copy reference</button>',
          onMount(el) { el.querySelector('[data-copy]').addEventListener('click', () => U.copy(p.ref, ok => T.toast(ok ? 'Reference copied' : 'Could not copy. Select it and press Ctrl+C.', ok ? 'ok' : 'bad'))); }
        });
      }

      function openRecord() {
        const today = U.localDateInput();
        T.modal.open({
          title: 'Record manual payment', subtitle: 'For students who paid in cash or at the bank',
          body: '<form id="pform" class="form-grid" novalidate>' +
            '<div class="field span-2"><label class="label" for="pf-sid">Student ID</label><input class="input mono" id="pf-sid" inputmode="numeric" maxlength="8" placeholder="e.g. 20241234" autocomplete="off"><div class="hint" id="pf-who">Type the 8-digit student ID to find the member.</div></div>' +
            '<div class="field"><label class="label" for="pf-amt">Amount</label><div class="input-prefix"><span>GHS</span><input class="input" id="pf-amt" type="number" min="1" step="0.01" value="' + db.settings.dues + '"></div><div class="field-error" id="pf-amt-err" hidden></div></div>' +
            '<div class="field"><label class="label" for="pf-date">Date paid</label><input class="input" id="pf-date" type="date" value="' + today + '" max="' + today + '"></div>' +
            '<div class="field"><label class="label" for="pf-ch">How did they pay?</label>' + U.select('pf-ch', ['Cash', 'Bank deposit', 'Mobile money transfer'], 'Cash') + '</div>' +
            '<div class="field"><label class="label" for="pf-note">Receipt or note</label><input class="input" id="pf-note" placeholder="Optional, e.g. paper receipt 0412"></div></form>',
          footer: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-green" type="button" id="pf-save">Save payment</button>',
          onMount(el, ctrl) {
            const sid = el.querySelector('#pf-sid'), who = el.querySelector('#pf-who');
            let member = null;
            sid.addEventListener('input', () => {
              sid.value = sid.value.replace(/\D/g, '');
              sid.classList.remove('is-invalid'); member = null;
              if (sid.value.length < 8) { who.className = 'hint'; who.textContent = 'Type the 8-digit student ID to find the member.'; return; }
              member = db.memberByStudentId(sid.value);
              if (!member) { who.className = 'hint bad'; who.textContent = 'No member has this student ID.'; }
              else { who.className = 'hint ok'; who.textContent = member.name + ' · ' + member.level + ' level' + (member.dues === 'paid' ? ' · already marked as paid, this adds a second payment' : ''); }
            });
            const save = () => {
              let ok = true;
              if (!member) { sid.classList.add('is-invalid'); if (sid.value.length === 8) who.textContent = 'No member has this student ID.'; else { who.className = 'hint bad'; who.textContent = 'Enter a valid 8-digit student ID.'; } ok = false; }
              const amt = parseFloat(el.querySelector('#pf-amt').value), err = el.querySelector('#pf-amt-err');
              if (!(amt > 0)) { err.hidden = false; err.textContent = 'Enter an amount greater than zero.'; el.querySelector('#pf-amt').classList.add('is-invalid'); ok = false; } else { err.hidden = true; el.querySelector('#pf-amt').classList.remove('is-invalid'); }
              if (!ok) return;
              const d = new Date(el.querySelector('#pf-date').value + 'T12:00:00');
              const ts = isNaN(d) ? Date.now() : Math.min(d.getTime(), Date.now());
              T.actions.recordPayment({ studentId: member.studentId, amount: amt, ts, channel: el.querySelector('#pf-ch').value, note: el.querySelector('#pf-note').value.trim() });
              ctrl.close(); totals(); table.resetPage();
            };
            el.querySelector('#pf-save').addEventListener('click', save);
            el.querySelector('#pform').addEventListener('submit', e => { e.preventDefault(); save(); });
          }
        });
      }

      view.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'record') openRecord();
        else if (b.dataset.act === 'receipt') openReceipt(db.payments.find(p => p.id === b.dataset.id));
        else if (b.dataset.act === 'approve') { T.actions.verifyReceipt(b.dataset.id); queue(); totals(); table.resetPage(); }
        else if (b.dataset.act === 'reject') {
          const p = db.payments.find(x => x.id === b.dataset.id);
          T.modal.open({
            title: 'Reject this receipt?', size: 'sm', subtitle: p.name + ' · ' + p.ref,
            body: '<div class="field"><label class="label" for="rj-why">Reason <small>shown to the member</small></label>' + U.select('rj-why', ['The receipt is unreadable', 'Amount does not match the dues', 'Payment not found at the bank', 'Duplicate of another payment'], 'The receipt is unreadable') + '</div>',
            footer: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-red" type="button" id="rj-ok">Reject receipt</button>',
            onMount(el, ctrl) { el.querySelector('#rj-ok').addEventListener('click', () => { T.actions.rejectReceipt(p.id, el.querySelector('#rj-why').value); ctrl.close(); queue(); totals(); table.resetPage(); }); }
          });
        }
      });
    }
  };
})(window.TEIN = window.TEIN || {});
