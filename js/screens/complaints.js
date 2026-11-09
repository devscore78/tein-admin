/* Complaints: inbox on the left, conversation and reply on the right */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;

  T.screens.complaints = {
    render(view) {
      const db = T.db;
      const st = { sel: null, filter: 'all', q: '' };
      const FILTERS = [['all', 'All'], ['open', 'Open'], ['progress', 'In progress'], ['resolved', 'Resolved']];
      const list = () => {
        const q = st.q.trim().toLowerCase();
        return db.complaints.filter(c => (st.filter === 'all' || c.status === st.filter) &&
          (!q || (c.subject + ' ' + db.member(c.memberId).name + ' ' + c.category).toLowerCase().includes(q)));
      };
      const first = list()[0]; st.sel = first ? first.id : null;

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Complaints', title: 'Complaints',
        desc: 'Read what members have written, reply to them, and track each case until it is resolved.'
      }) + '<section class="card inbox" id="inbox"><div class="in-list"><div class="toolbar"><label class="search" style="max-width:none"><span class="sr-only">Search complaints</span>' + I('search', 16) +
        '<input class="input" id="cq" type="search" placeholder="Search complaints" aria-label="Search complaints"></label></div>' +
        '<div class="in-filters" id="cfilters"></div><div class="in-scroll" id="clist"></div></div><div class="in-detail" id="cdetail"></div></section>';

      const inbox = view.querySelector('#inbox');
      function drawFilters() {
        view.querySelector('#cfilters').innerHTML = '<div class="tabs" role="tablist">' + FILTERS.map(f => {
          const n = f[0] === 'all' ? db.complaints.length : db.complaints.filter(c => c.status === f[0]).length;
          return '<button class="tab" type="button" role="tab" aria-selected="' + (st.filter === f[0]) + '" data-filter="' + f[0] + '">' + f[1] + ' <small>' + n + '</small></button>';
        }).join('') + '</div>';
      }
      function drawList() {
        const l = list();
        view.querySelector('#clist').innerHTML = l.length ? l.map(c => {
          const m = db.member(c.memberId), last = c.messages[c.messages.length - 1];
          return '<button class="in-item' + (c.id === st.sel ? ' is-active' : '') + (c.unread ? ' is-unread' : '') + '" type="button" data-id="' + c.id + '">' +
            '<div class="top"><span class="subj">' + esc(c.subject) + '</span><span class="when">' + U.rel(last.ts) + '</span></div>' +
            '<div class="snip">' + esc(last.text) + '</div><div class="meta">' + U.status.complaint(c.status) + '<span>' + esc(m.name) + ' · ' + esc(c.category) + '</span></div></button>';
        }).join('') : U.empty('inbox', 'Nothing here', 'No complaints match this filter.');
      }
      function drawDetail() {
        const host = view.querySelector('#cdetail');
        const c = db.complaints.find(x => x.id === st.sel);
        if (!c) { host.innerHTML = '<div class="in-empty">' + U.empty('chat', 'Select a complaint', 'Pick one from the inbox to read it.') + '</div>'; return; }
        const m = db.member(c.memberId);
        host.innerHTML =
          '<div class="in-detail-head"><button class="btn btn-ghost btn-sm in-back" type="button" data-act="back">' + I('chevL', 15) + 'Inbox</button>' +
          '<div class="ttl"><h2>' + esc(c.subject) + '</h2><div class="sub">' + U.badge('neutral', c.category, false) + '<span>Received ' + U.date(c.created, true) + '</span></div></div>' +
          '<div class="field"><label class="sr-only" for="cstatus">Status</label>' + U.select('cstatus', [['open', 'Open'], ['progress', 'In progress'], ['resolved', 'Resolved']], c.status) + '</div></div>' +
          '<div class="member-strip">' + U.avatar(m.name, 36) + '<div class="who"><b>' + esc(m.name) + '</b><small>' + esc(m.studentId) + ' · ' + m.level + ' level · ' + esc(m.phone) + '</small></div>' +
          '<button class="btn btn-white btn-sm" type="button" data-act="profile">' + I('user', 15) + 'View profile</button></div>' +
          '<div class="thread" id="cthread">' + c.messages.map(x => '<div class="msg ' + x.from + '"><div class="bubble">' + esc(x.text) + '</div><div class="by">' +
            (x.from === 'admin' ? esc(x.by || 'Admin') : esc(m.name)) + ' · ' + U.date(x.ts, true) + '</div></div>').join('') + '</div>' +
          '<form class="reply" id="creply"><label class="sr-only" for="ctext">Your reply</label><textarea class="textarea" id="ctext" placeholder="Write a reply to ' + esc(m.name.split(' ')[0]) + '"></textarea>' +
          '<div class="reply-actions"><button class="btn btn-soft btn-sm" type="button" data-act="resolve"' + (c.status === 'resolved' ? ' disabled' : '') + '>' + I('check', 15) + 'Mark resolved</button>' +
          '<button class="btn btn-green" type="submit">' + I('send', 16) + 'Send reply</button></div></form>';
        const th = host.querySelector('#cthread'); th.scrollTop = th.scrollHeight;
      }
      function drawAll() { drawFilters(); drawList(); drawDetail(); }
      drawAll();

      view.querySelector('#cq').addEventListener('input', U.debounce(e => { st.q = e.target.value; drawList(); }, 150));
      view.addEventListener('click', e => {
        const f = e.target.closest('[data-filter]');
        if (f) { st.filter = f.dataset.filter; const l = list(); if (!l.find(c => c.id === st.sel)) st.sel = l[0] ? l[0].id : null; drawAll(); return; }
        const it = e.target.closest('.in-item');
        if (it) { st.sel = it.dataset.id; const c = db.complaints.find(x => x.id === st.sel); c.unread = false; inbox.classList.add('show-detail'); drawList(); drawDetail(); return; }
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'back') inbox.classList.remove('show-detail');
        else if (b.dataset.act === 'profile') T.memberProfile.open(db.complaints.find(x => x.id === st.sel).memberId);
        else if (b.dataset.act === 'resolve') { T.actions.setComplaintStatus(st.sel, 'resolved'); drawAll(); }
      });
      view.addEventListener('change', e => {
        if (e.target.id === 'cstatus') { T.actions.setComplaintStatus(st.sel, e.target.value); drawAll(); }
      });
      view.addEventListener('submit', e => {
        if (e.target.id !== 'creply') return;
        e.preventDefault();
        const ta = view.querySelector('#ctext'), text = ta.value.trim();
        if (!text) { ta.classList.add('is-invalid'); ta.focus(); return; }
        T.actions.replyToComplaint(st.sel, text);
        drawAll();
      });
    }
  };
})(window.TEIN = window.TEIN || {});
