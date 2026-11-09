/* Business actions shared by several screens. Each one updates the store,
   writes an audit entry, shows a toast and refreshes the sidebar counts.
   Replace the bodies with API calls when you connect a backend. */
(function (T) {
  'use strict';
  const db = T.db, U = T.ui;
  const done = () => { if (T.chrome) T.chrome.refresh(); };

  T.actions = {
    approve(ids) {
      const list = [].concat(ids); let n = 0, last = null;
      list.forEach(id => {
        const m = db.member(id);
        if (m && m.status === 'pending') { m.status = 'approved'; n++; last = m; db.log('member.approve', m.name + ' (' + m.studentId + ')'); }
      });
      if (n) { T.toast(n === 1 ? last.name + ' approved' : n + ' members approved', 'ok'); done(); }
      return n;
    },
    suspend(id) {
      const m = db.member(id); if (!m) return;
      m.status = 'suspended'; db.log('member.suspend', m.name + ' (' + m.studentId + ')');
      T.toast(m.name + ' suspended'); done();
    },
    reinstate(id) {
      const m = db.member(id); if (!m) return;
      m.status = 'approved'; db.log('member.reinstate', m.name + ' (' + m.studentId + ')');
      T.toast(m.name + ' reinstated', 'ok'); done();
    },

    setRegistration(open) {
      db.settings.registrationOpen = open;
      db.log('setting.registration', open ? 'Registration opened' : 'Registration closed');
      T.toast(open ? 'Registration is open' : 'Registration is closed. Visitors now see your message.', open ? 'ok' : undefined); done();
    },
    saveMessage(text) {
      db.settings.closedMessage = text;
      db.log('setting.registration', 'Updated the closed-registration message');
      T.toast('Message saved', 'ok');
    },
    setDues(amount, year) {
      db.settings.dues = amount; db.settings.academicYear = year;
      db.log('setting.dues', 'Dues set to ' + U.money(amount) + ' for ' + year);
      T.toast('Dues updated to ' + U.money(amount), 'ok');
    },

    recordPayment(o) {
      const m = db.memberByStudentId(o.studentId); if (!m) return null;
      const p = {
        id: 'p' + (db.payments.length + 1), memberId: m.id, name: m.name, studentId: m.studentId,
        amount: o.amount, ts: o.ts, status: 'success', method: 'manual', channel: o.channel,
        ref: 'MAN-' + String(Math.floor(1000 + Math.random() * 9000)), note: o.note || ''
      };
      db.payments.unshift(p); db.payments.sort((a, b) => b.ts - a.ts);
      m.dues = 'paid';
      db.log('payment.record', U.money(o.amount) + ' for ' + m.name + ' (' + m.studentId + ')');
      T.toast(U.money(o.amount) + ' recorded for ' + m.name, 'ok'); done();
      return p;
    },

    verifyReceipt(id) {
      const p = db.payments.find(x => x.id === id); if (!p || p.status !== 'pending') return;
      p.status = 'success'; const m = db.member(p.memberId); if (m) m.dues = 'paid';
      db.log('payment.verify', U.money(p.amount) + ' receipt for ' + p.name + ' (' + p.studentId + ')');
      T.toast('Receipt approved. ' + p.name + ' is marked as paid', 'ok'); done();
    },
    rejectReceipt(id, reason) {
      const p = db.payments.find(x => x.id === id); if (!p || p.status !== 'pending') return;
      p.status = 'failed'; p.note = (p.note ? p.note + ' · ' : '') + 'Rejected: ' + (reason || 'receipt could not be verified');
      db.log('payment.reject', 'Receipt for ' + p.name + ' (' + p.studentId + ')');
      T.toast('Receipt rejected. The member will be told to resubmit'); done();
    },

    setComplaintStatus(id, status) {
      const c = db.complaints.find(x => x.id === id); if (!c || c.status === status) return;
      c.status = status; c.unread = false;
      db.log('complaint.status', c.subject + ' to ' + ({ open: 'Open', progress: 'In progress', resolved: 'Resolved' }[status]));
      T.toast('Marked ' + ({ open: 'open', progress: 'in progress', resolved: 'resolved' }[status]), status === 'resolved' ? 'ok' : undefined); done();
    },
    replyToComplaint(id, text) {
      const c = db.complaints.find(x => x.id === id); if (!c) return;
      c.messages.push({ from: 'admin', text, ts: Date.now(), by: T.me().name });
      c.unread = false;
      if (c.status === 'open') c.status = 'progress';
      db.complaints.sort((a, b) => db.lastTs(b) - db.lastTs(a));
      db.log('complaint.reply', c.subject);
      T.toast('Reply sent to ' + (db.member(c.memberId) || {}).name, 'ok'); done();
    },

    published(kind, title) { db.log('content.publish', kind + ': ' + title); },
    removed(kind, title) { db.log('content.delete', kind + ': ' + title); T.toast(kind + ' deleted'); }
  };
})(window.TEIN = window.TEIN || {});
