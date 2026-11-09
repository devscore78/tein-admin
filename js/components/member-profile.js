/* Member profile modal: details, photo, payment history. Used by Members and Complaints. */
(function (T) {
  'use strict';
  const U = T.ui, { esc } = U;

  function body(m) {
    const pays = T.db.payments.filter(p => p.studentId === m.studentId);
    const history = pays.length
      ? '<ul class="row-list" style="margin:0 -20px">' + pays.map(p =>
        '<li><span class="avatar av-2" style="--sz:34px">' + T.icon(p.method === 'manual' ? 'cash' : 'card', 16) + '</span>' +
        '<div class="tx"><b>' + U.money(p.amount) + '</b><small>' + esc(p.channel) + ' · <span class="mono">' + esc(p.ref) + '</span> · ' + U.date(p.ts, true) + '</small></div>' +
        U.status.payment(p.status) + '</li>').join('') + '</ul>'
      : '<p class="muted">No payments recorded for this member yet.</p>';
    return '<div class="profile-top">' + U.avatar(m.name, 72, m.photo) +
      '<div><h3>' + esc(m.name) + '</h3><div class="mono muted" style="margin-top:6px">' + esc(m.studentId) + '</div>' +
      '<div class="badges">' + U.status.member(m.status) + U.status.dues(m.dues) + '</div></div></div>' +
      '<dl class="kv">' +
      '<div><dt>Phone</dt><dd class="num">' + esc(m.phone) + '</dd></div>' +
      '<div><dt>Email</dt><dd>' + esc(m.email) + '</dd></div>' +
      '<div><dt>Level</dt><dd>' + m.level + ' level</dd></div>' +
      '<div><dt>Hall</dt><dd>' + esc(m.hall) + '</dd></div>' +
      '<div><dt>Programme</dt><dd>' + esc(m.programme) + '</dd></div>' +
      '<div><dt>Registered</dt><dd>' + U.date(m.joined, true) + '</dd></div></dl>' +
      '<h4 class="sec-title">Payment history</h4>' + history;
  }
  function footer(m) {
    return '<button class="btn btn-ghost push" type="button" data-close>Close</button>' +
      (m.status === 'pending' ? '<button class="btn btn-green" type="button" data-do="approve">Approve member</button>' : '') +
      (m.status === 'approved' ? '<button class="btn btn-outline-red" type="button" data-do="suspend">Suspend</button>' : '') +
      (m.status === 'suspended' ? '<button class="btn btn-outline" type="button" data-do="reinstate">Reinstate</button>' : '');
  }

  T.memberProfile = {
    open(id, onChange) {
      const m = T.db.member(id); if (!m) return;
      T.modal.open({
        title: 'Member profile', size: 'lg', subtitle: 'Registration details as submitted',
        body: body(m), footer: footer(m),
        onMount(el, ctrl) {
          el.addEventListener('click', e => {
            const b = e.target.closest('[data-do]'); if (!b) return;
            const act = b.dataset.do;
            if (act === 'suspend') {
              ctrl.close();
              T.modal.confirm({
                title: 'Suspend ' + m.name + '?', tone: 'danger', confirmLabel: 'Suspend member',
                message: 'They will lose access to member features until you reinstate them.',
                onConfirm() { T.actions.suspend(m.id); if (onChange) onChange(); }
              });
              return;
            }
            T.actions[act](m.id);
            ctrl.close();
            if (onChange) onChange();
          });
        }
      });
    }
  };
})(window.TEIN = window.TEIN || {});
