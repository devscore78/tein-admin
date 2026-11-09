/* Overview: KPI strip, registration control, charts, recent activity */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc, num } = U;

  T.screens.overview = {
    render(view) {
      const db = T.db, A = T.analytics;
      const pending = db.members.filter(m => m.status === 'pending').length;
      const open = db.complaints.filter(c => c.status === 'open').length;
      const dues = A.dues();
      const duesTotal = dues.values.reduce((s, v) => s + v, 0);
      const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      const kpi = (label, value, sub, o) => {
        o = o || {};
        const tag = o.href ? 'a' : 'div';
        return '<' + tag + ' class="kpi' + (o.hot ? ' hot' : '') + '"' + (o.href ? ' href="' + o.href + '"' : '') + '><div class="kpi-label"><span>' + label + '</span>' + (o.unit ? '<em>' + o.unit + '</em>' : '') + '</div>' +
          '<div class="kpi-value">' + value + '</div><div class="kpi-sub">' + sub + '</div></' + tag + '>';
      };

      const recentMembers = db.members.slice().sort((a, b) => b.joined - a.joined).slice(0, 5);
      const recentPays = db.payments.slice(0, 5);
      const recentComplaints = db.complaints.slice(0, 5);

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Overview', title: 'Control tower',
        desc: today + ' · Academic year ' + db.settings.academicYear + '. Everything that needs your attention is at the top.',
        actions: '<a class="btn btn-outline" href="#members">' + I('users', 16) + 'Review members</a><a class="btn btn-green" href="#payments">' + I('plus', 16) + 'Record payment</a>'
      }) +
        '<div class="grid">' +
        '<section class="card col-12" aria-label="Key numbers"><div class="kpis">' +
        kpi('Total members', num(A.totalMembers), 'Across all four levels', { href: '#members' }) +
        kpi('New this month', num(A.newThisMonth), 'Month to date', { href: '#members' }) +
        kpi('Dues collected', num(duesTotal), 'Last 12 months', { href: '#payments', unit: 'GHS' }) +
        kpi('Pending approvals', pending, pending ? 'Waiting for review' : 'All caught up', { href: '#members', hot: pending > 0 }) +
        kpi('Open complaints', open, open ? 'Need a reply' : 'Inbox is clear', { href: '#complaints', hot: open > 0 }) +
        '</div></section>' +

        '<section class="card col-8"><div class="card-head"><div><h2 class="card-title">Member growth</h2><p class="card-sub">Total members at the end of each month</p></div></div>' +
        '<div class="card-body"><div class="chart" id="ch-growth"></div></div></section>' +

        '<section class="card col-4 regcard"><div class="card-head"><div><h2 class="card-title">Registration</h2><p class="card-sub">Applies to the public sign-up page straight away</p></div></div>' +
        '<div class="card-body"><div class="state">' + U.toggle('ov-reg', db.settings.registrationOpen, '', true) +
        '<div><h3 id="ov-reg-state" class="' + (db.settings.registrationOpen ? 'green' : 'red') + '">' + (db.settings.registrationOpen ? 'Open' : 'Closed') + '</h3>' +
        '<p id="ov-reg-sub">' + (db.settings.registrationOpen ? 'New students can sign up.' : 'Visitors see your closing message.') + '</p></div></div>' +
        '<div class="msg-preview"><span class="eyebrow">Message shown when closed</span>' + esc(db.settings.closedMessage) + '</div>' +
        '<p style="margin-top:14px"><a class="card-link" href="#site-settings">Edit message and dues →</a></p></div></section>' +

        '<section class="card col-7"><div class="card-head"><div><h2 class="card-title">Dues collected per month</h2><p class="card-sub">GHS, successful payments only</p></div></div>' +
        '<div class="card-body"><div class="chart" id="ch-dues"></div><div class="chart-key"><span><i style="background:var(--c-green)"></i>Full month</span><span><i style="background:var(--c-red)"></i>This month so far</span></div></div></section>' +

        '<section class="card col-5"><div class="card-head"><div><h2 class="card-title">Members by level</h2><p class="card-sub">Share of all ' + num(A.totalMembers) + ' members</p></div></div>' +
        '<div class="card-body"><div id="ch-levels"></div></div></section>' +

        '<section class="card col-12"><div class="activity">' +
        '<div class="act-col"><header><h3>New registrations</h3><a class="card-link" href="#members">View all</a></header>' +
        recentMembers.map(m => '<div class="act-row">' + U.avatar(m.name, 34) + '<div class="tx"><b class="truncate">' + esc(m.name) + '</b><small>' + m.level + ' level · ' + esc(m.hall) + '</small></div><div class="side">' + U.rel(m.joined) + '</div></div>').join('') + '</div>' +
        '<div class="act-col"><header><h3>Latest payments</h3><a class="card-link" href="#payments">View all</a></header>' +
        recentPays.map(p => '<div class="act-row"><span class="avatar av-2" style="--sz:34px">' + I(p.method === 'manual' ? 'cash' : 'card', 16) + '</span><div class="tx"><b class="truncate">' + esc(p.name) + '</b><small>' + (p.method === 'manual' ? 'Manual' : 'Paystack') + ' · ' + U.rel(p.ts) + '</small></div><div class="side"><b class="num">' + U.money(p.amount) + '</b>' + esc({ success: 'Success', pending: 'Pending', failed: 'Failed' }[p.status]) + '</div></div>').join('') + '</div>' +
        '<div class="act-col"><header><h3>Recent complaints</h3><a class="card-link" href="#complaints">Open inbox</a></header>' +
        recentComplaints.map(c => { const m = db.member(c.memberId); return '<div class="act-row">' + U.avatar(m.name, 34) + '<div class="tx"><b class="truncate">' + esc(c.subject) + '</b><small>' + esc(m.name) + '</small></div><div class="side">' + U.status.complaint(c.status) + '</div></div>'; }).join('') + '</div>' +
        '</div></section></div>';

      T.charts.line(view.querySelector('#ch-growth'), { labels: A.growth.labels, full: A.growth.full, values: A.growth.values, unit: 'members', aria: 'Member growth over the last 12 months' });
      T.charts.bars(view.querySelector('#ch-dues'), { labels: dues.labels, full: dues.full, values: dues.values, aria: 'Dues collected per month in GHS' });
      T.charts.donut(view.querySelector('#ch-levels'), { items: A.levels, center: 'members', aria: 'Members by level' });

      view.querySelector('#ov-reg').addEventListener('change', e => {
        const on = e.target.checked;
        T.actions.setRegistration(on);
        const st = view.querySelector('#ov-reg-state');
        st.textContent = on ? 'Open' : 'Closed'; st.className = on ? 'green' : 'red';
        view.querySelector('#ov-reg-sub').textContent = on ? 'New students can sign up.' : 'Visitors see your closing message.';
      });
    }
  };
})(window.TEIN = window.TEIN || {});
