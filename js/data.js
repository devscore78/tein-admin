/* Sample data and in-memory store. Swap these arrays for your API calls later. */
(function (T) {
  'use strict';
  const NOW = Date.now(), DAY = 864e5, MIN = 6e4;

  function seeded(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rnd = seeded(7112026);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const chance = p => rnd() < p;
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const midnight = (() => { const d = new Date(NOW); d.setHours(0, 0, 0, 0); return d.getTime(); })();

  const settings = {
    registrationOpen: true,
    closedMessage: 'We are not receiving new admissions right now. Registration reopens at the start of the next academic year. For urgent questions, contact the secretariat.',
    dues: 60,
    academicYear: '2026/27'
  };

  /* ---------- Members ---------- */
  const FIRST = ['Kwame', 'Kofi', 'Kojo', 'Kwesi', 'Yaw', 'Kwabena', 'Fiifi', 'Nana', 'Kweku', 'Edem', 'Mawuli', 'Selorm', 'Senyo', 'Elikem', 'Nii', 'Papa', 'Ibrahim', 'Abdul', 'Samuel', 'Daniel', 'Ama', 'Abena', 'Akosua', 'Efua', 'Esi', 'Adwoa', 'Yaa', 'Afia', 'Maame', 'Akua', 'Dzifa', 'Mawuena', 'Naa', 'Serwaa', 'Gifty', 'Linda', 'Priscilla', 'Jemima', 'Comfort', 'Mariam'];
  const LAST = ['Mensah', 'Boateng', 'Owusu', 'Asante', 'Appiah', 'Frimpong', 'Quaye', 'Darko', 'Ansah', 'Tetteh', 'Acquah', 'Badu', 'Osei', 'Sarpong', 'Agbeko', 'Dzidzienyo', 'Kpodo', 'Amoah', 'Addo', 'Ofori', 'Gyamfi', 'Antwi', 'Adjei', 'Lamptey', 'Sackey', 'Abdulai', 'Yakubu', 'Amankwah', 'Danquah', 'Opoku', 'Bonsu', 'Kumi', 'Agyei', 'Akoto', 'Ampofo', 'Fosu', 'Larbi', 'Nyarko'];
  const PROGRAMMES = ['BSc Computer Science', 'BSc Nursing', 'BA Economics', 'BSc Civil Engineering', 'LLB Law', 'BSc Biochemistry', 'BA Political Science', 'BSc Accounting', 'BSc Mechanical Engineering', 'BA Psychology', 'BSc Architecture', 'BSc Agriculture'];
  const HALLS = ['Unity Hall', 'Pioneer Hall', 'Africa Hall', 'Heritage Hall', 'Valley View Hall', 'Off campus'];
  const PREFIX = ['024', '054', '055', '059', '020', '050', '027', '057', '026'];

  const used = new Set();
  const members = [];
  for (let i = 0; i < 240; i++) {
    const first = pick(FIRST), last = pick(LAST);
    let sid;
    do { sid = String(int(2022, 2026)) + String(int(0, 9999)).padStart(4, '0'); } while (used.has(sid));
    used.add(sid);
    const r = rnd(), s = rnd();
    const status = s < .80 ? 'approved' : s < .94 ? 'pending' : 'suspended';
    const joined = status === 'pending' ? NOW - int(30, 10 * 24 * 60) * MIN
      : status === 'suspended' ? NOW - int(60, 300) * DAY
        : NOW - int(8 * 24 * 60, 400 * 24 * 60) * MIN;
    const dues = status === 'approved' ? (chance(.62) ? 'paid' : 'unpaid') : status === 'pending' ? (chance(.35) ? 'paid' : 'unpaid') : 'unpaid';
    members.push({
      id: 'm' + i, name: first + ' ' + last, studentId: sid,
      phone: pick(PREFIX) + ' ' + int(100, 999) + ' ' + int(1000, 9999),
      email: (first + '.' + last + int(1, 99)).toLowerCase() + '@students.example.edu.gh',
      level: r < .32 ? 100 : r < .59 ? 200 : r < .82 ? 300 : 400,
      hall: pick(HALLS), programme: pick(PROGRAMMES), status, dues, joined, photo: null
    });
  }
  members.sort((a, b) => b.joined - a.joined);

  /* ---------- Payments (recent window) ---------- */
  const recs = members.filter(m => m.dues === 'paid').map(m => ({ m, status: 'success' }));
  const unpaidPool = shuffle(members.filter(m => m.dues === 'unpaid' && m.status !== 'suspended'));
  unpaidPool.slice(0, 6).forEach(m => recs.push({ m, status: 'pending' }));
  unpaidPool.slice(6, 10).forEach(m => recs.push({ m, status: 'failed' }));
  const shuffled = shuffle(recs);
  const payments = shuffled.map((r, i) => {
    const n = shuffled.length, cut = Math.round(n * .07);
    const off = i < cut ? 0 : 1 + Math.floor((i - cut) / (n - cut) * 7);
    const ts = off === 0 ? NOW - int(5, 240) * MIN : midnight - off * DAY + int(360, 1320) * MIN;
    const manual = r.status === 'success' && chance(.18);
    const channel = manual ? pick(['Cash', 'Bank deposit', 'Mobile money transfer']) : pick(['Mobile money', 'Card', 'Mobile money']);
    return {
      id: 'p' + i, memberId: r.m.id, name: r.m.name, studentId: r.m.studentId,
      amount: settings.dues, ts, status: r.status, method: manual ? 'manual' : 'paystack', channel,
      ref: manual ? 'MAN-' + int(1000, 9999) : 'T' + String(int(100000, 999999)) + String(int(100000, 999999)), note: ''
    };
  }).sort((a, b) => b.ts - a.ts);
  payments.forEach((p, i) => { p.id = 'p' + (payments.length - i); });

  /* ---------- Complaints ---------- */
  const CS = [
    ['Paid dues but still showing unpaid', 'Payment', 'open', 'Good afternoon. I paid my dues through Paystack on Monday and got an SMS confirmation, but my profile still says unpaid. I can send the receipt if needed.', null, 5],
    ['Cannot finish registration step 2', 'Registration', 'open', 'The page freezes after I upload my passport photo. I tried two different phones and the same thing happens.', null, 19],
    ['Membership card shows the wrong level', 'Membership', 'progress', 'My card says 200 level but I am now in 300 level. Please update it before the next event.', 'Thanks for flagging this. We have asked the membership officer to update your level. You will get an SMS once the new card is ready.', 30],
    ['Event link does not open', 'Events', 'open', 'The registration link for the career mixer gives me a blank page on mobile data.', null, 44],
    ['Request to change phone number', 'Account', 'progress', 'I lost my SIM and need my number changed so I can receive OTP codes.', 'Please reply with your student ID and the new number. We will verify and update it.', 70],
    ['Charged twice on Paystack', 'Payment', 'open', 'I was debited two times for one payment. Both deductions show on my mobile money statement.', null, 26],
    ['Report about conduct at the hall meeting', 'Conduct', 'progress', 'I would like to report an incident from the last hall meeting. I prefer to talk to an executive privately.', 'Thank you for trusting us with this. The General Secretary will contact you privately within two days.', 52],
    ['Please remove my photo from the gallery', 'Content', 'resolved', 'I appear in the orientation album and would like the photo removed.', 'The photo has been removed from the Orientation Week album. Thank you for letting us know.', 120],
    ['Receipt never arrived by email', 'Payment', 'resolved', 'I paid last week but no receipt came to my inbox.', 'We have resent your receipt. Check your spam folder if it does not show up in a few minutes.', 160],
    ['Suspended without notice', 'Membership', 'progress', 'My account shows suspended and I do not know why. I have not missed any dues.', 'We are reviewing the suspension with the membership officer and will update you here.', 98],
    ['Suggestion: add a Twi language option', 'Suggestion', 'resolved', 'Many of our members would find the site easier to use in Twi. Is that possible?', 'Good idea. We have added it to the plan for next semester.', 240],
    ['Cannot sign in after password reset', 'Account', 'open', 'I reset my password but the new one is rejected.', null, 8],
    ['Spelling of my name is wrong', 'Registration', 'resolved', 'My surname has a missing letter on my profile.', 'Corrected. Please check your profile and tell us if anything else looks off.', 300],
    ['Dues exemption request', 'Payment', 'open', 'I am facing financial difficulty this semester and would like to ask whether part payment is possible.', null, 13]
  ];
  const complaints = CS.map((c, i) => {
    const m = members[(i * 7 + 3) % members.length];
    const created = NOW - c[5] * 60 * MIN;
    const messages = [{ from: 'member', text: c[3], ts: created }];
    if (c[4]) messages.push({ from: 'admin', text: c[4], ts: created + int(40, 300) * MIN, by: 'Mawuli Kpodo' });
    return {
      id: 'c' + (i + 1), memberId: m.id, subject: c[0], category: c[1], status: c[2],
      messages, created, unread: !c[4] && c[2] === 'open' && c[5] < 48
    };
  });
  const lastTs = c => c.messages[c.messages.length - 1].ts;
  complaints.sort((a, b) => lastTs(b) - lastTs(a));

  /* ---------- Content ---------- */
  const at = (days, h, m) => { const d = new Date(midnight + days * DAY); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
  const events = [
    { id: 'e1', title: "Freshers' Welcome Evening", date: at(12, 17), location: 'Main Auditorium', description: 'An evening to meet the executives, learn what the chapter does, and register for committees.', poster: null },
    { id: 'e2', title: 'Career Mixer with Alumni', date: at(21, 14), location: 'Business School Atrium', description: 'Short talks from alumni followed by open networking. Bring your CV.', poster: null },
    { id: 'e3', title: 'Annual General Meeting', date: at(35, 10), location: 'Great Hall', description: 'Executive reports, audited accounts and a vote on the proposed constitution changes.', poster: null },
    { id: 'e4', title: 'Community Clean-up Day', date: at(-9, 7, 30), location: 'Campus Main Gate', description: 'Gloves and bags provided. Lunch for all volunteers.', poster: null },
    { id: 'e5', title: 'Orientation Week', date: at(-52, 9), location: 'Various venues', description: 'Five days of talks, tours and welcome events for new members.', poster: null }
  ];
  const posts = [
    { id: 'b1', title: 'Welcome back: what the new semester holds', category: 'Announcement', status: 'published', author: 'Abena Frimpong', date: NOW - 6 * DAY, body: '<p>Welcome back to campus. This semester we are running three flagship events, opening a mentorship scheme, and moving all dues payments online.</p><p>Watch this page for dates and sign-up links.</p>' },
    { id: 'b2', title: 'Dues for 2026/27 are now open', category: 'Dues', status: 'published', author: 'Yaw Asante', date: NOW - 18 * DAY, body: '<p>You can now pay your dues for the new academic year with mobile money or card. Cash payments are still accepted at the secretariat.</p>' },
    { id: 'b3', title: 'Meet your new executives', category: 'News', status: 'published', author: 'Fiifi Acquah', date: NOW - 40 * DAY, body: '<p>Six students were sworn in last month to lead the chapter. Read their short profiles on the leadership page.</p>' },
    { id: 'b4', title: 'Scholarship briefing notes', category: 'News', status: 'draft', author: 'Abena Frimpong', date: NOW - 2 * DAY, body: '<p>Notes from the scholarship briefing. Still to add: deadlines and contact person.</p>' },
    { id: 'b5', title: 'Annual General Meeting agenda', category: 'Announcement', status: 'draft', author: 'Selorm Agbeko', date: NOW - 1 * DAY, body: '<p>Agenda items to be confirmed with the executive committee.</p>' }
  ];
  const albums = [
    { id: 'g1', name: 'Orientation Week', date: NOW - 52 * DAY, count: 38, photos: [] },
    { id: 'g2', name: 'Community Clean-up', date: NOW - 9 * DAY, count: 17, photos: [] },
    { id: 'g3', name: 'Annual Dinner 2025', date: NOW - 340 * DAY, count: 52, photos: [] }
  ];
  const leaders = [
    { id: 'l1', name: 'Kwabena Osei', position: 'President', bio: 'Final-year Economics student. Leads the executive and represents the chapter to the school administration.', photo: null },
    { id: 'l2', name: 'Abena Frimpong', position: 'Vice President', bio: 'Third-year Law student. Oversees committees and the mentorship scheme.', photo: null },
    { id: 'l3', name: 'Selorm Agbeko', position: 'General Secretary', bio: 'Keeps the records, runs meetings and handles member complaints.', photo: null },
    { id: 'l4', name: 'Yaw Asante', position: 'Financial Secretary', bio: 'Accounting student responsible for dues, receipts and the annual audit.', photo: null },
    { id: 'l5', name: 'Akosua Darko', position: "Women's Commissioner", bio: 'Champions welfare programmes and safe spaces for women members.', photo: null },
    { id: 'l6', name: 'Fiifi Acquah', position: 'Public Relations Officer', bio: 'Runs the website, social media and the weekly newsletter.', photo: null }
  ];

  /* ---------- Admins ---------- */
  const AREAS = [
    { id: 'members', label: 'Members', desc: 'View, approve and suspend members' },
    { id: 'payments', label: 'Payments', desc: 'View payments and record manual ones' },
    { id: 'complaints', label: 'Complaints', desc: 'Read and reply to member complaints' },
    { id: 'content', label: 'Content', desc: 'Edit events, blog, gallery and leadership' }
  ];
  const ROLES = {
    'Membership officer': { members: 1 },
    'Finance officer': { payments: 1, members: 1 },
    'Content editor': { content: 1 },
    'Complaints desk': { complaints: 1, members: 1 },
    'Custom': {}
  };
  const admins = [
    { id: 'a1', name: 'Esi Tetteh', email: 'esi.tetteh@tein.example', role: 'Membership officer', perms: { members: 1 }, status: 'active', last: NOW - 2 * 60 * MIN },
    { id: 'a2', name: 'Kojo Ansah', email: 'kojo.ansah@tein.example', role: 'Finance officer', perms: { payments: 1, members: 1 }, status: 'active', last: NOW - 26 * 60 * MIN },
    { id: 'a3', name: 'Maame Ama Sarpong', email: 'maame.sarpong@tein.example', role: 'Content editor', perms: { content: 1 }, status: 'active', last: NOW - 30 * 60 * MIN },
    { id: 'a4', name: 'Mawuli Kpodo', email: 'mawuli.kpodo@tein.example', role: 'Complaints desk', perms: { complaints: 1, members: 1 }, status: 'active', last: NOW - 5 * 60 * MIN },
    { id: 'a5', name: 'Efua Quaye', email: 'efua.quaye@tein.example', role: 'Finance officer', perms: { payments: 1, members: 1 }, status: 'suspended', last: NOW - 40 * DAY },
    { id: 'a6', name: 'Papa Kwesi Ofori', email: 'papa.ofori@tein.example', role: 'Content editor', perms: { content: 1 }, status: 'invited', last: null }
  ];

  /* ---------- Audit log ---------- */
  const ACTIONS = {
    'member.approve': { label: 'Approved member', kind: 'ok' },
    'member.suspend': { label: 'Suspended member', kind: 'bad' },
    'member.reinstate': { label: 'Reinstated member', kind: 'ok' },
    'payment.record': { label: 'Recorded payment', kind: 'neutral' },
    'complaint.reply': { label: 'Replied to complaint', kind: 'neutral' },
    'complaint.status': { label: 'Changed complaint status', kind: 'neutral' },
    'content.publish': { label: 'Published content', kind: 'ok' },
    'content.delete': { label: 'Deleted content', kind: 'bad' },
    'setting.registration': { label: 'Changed registration', kind: 'neutral' },
    'setting.dues': { label: 'Changed dues', kind: 'neutral' },
    'admin.invite': { label: 'Invited sub-admin', kind: 'neutral' },
    'admin.update': { label: 'Updated sub-admin', kind: 'neutral' },
    'admin.suspend': { label: 'Suspended sub-admin', kind: 'bad' },
    'admin.remove': { label: 'Removed sub-admin', kind: 'bad' },
    'auth.login': { label: 'Signed in', kind: 'neutral' }
  };
  const MAIN = { name: 'Nana Kwesi Boateng', role: 'Main admin' };
  const ip = () => pick(['41.66', '154.160', '197.255', '41.218']) + '.' + int(1, 254) + '.' + int(1, 254);
  const memberLabel = () => { const m = pick(members); return m.name + ' (' + m.studentId + ')'; };
  const GENS = [
    ['member.approve', 5, 'a1', memberLabel],
    ['member.suspend', 1, 'a1', memberLabel],
    ['member.reinstate', 1, 'a1', memberLabel],
    ['payment.record', 4, 'a2', () => 'GHS 60 for ' + memberLabel()],
    ['complaint.reply', 4, 'a4', () => pick(complaints).subject],
    ['complaint.status', 3, 'a4', () => pick(complaints).subject + ' to ' + pick(['In progress', 'Resolved'])],
    ['content.publish', 2, 'a3', () => 'Blog: ' + pick(posts).title],
    ['content.delete', 1, 'a3', () => 'Event: Old meetup poster'],
    ['setting.registration', 1, 'a0', () => pick(['Registration opened', 'Registration closed'])],
    ['setting.dues', 1, 'a0', () => 'Dues set to GHS 60 for 2026/27'],
    ['admin.invite', 1, 'a0', () => pick(['Papa Kwesi Ofori', 'Efua Quaye'])],
    ['auth.login', 4, 'any', () => 'From Accra, Ghana']
  ];
  const pool = [];
  GENS.forEach(g => { for (let i = 0; i < g[1]; i++) pool.push(g); });
  const times = Array.from({ length: 96 }, () => NOW - int(20, 21 * 24 * 60) * MIN).sort((a, b) => b - a);
  const audit = times.map((ts, i) => {
    const g = pick(pool);
    let actor = MAIN;
    if (g[2] !== 'a0') {
      const a = g[2] === 'any' ? pick(admins.filter(x => x.status === 'active').concat([{ name: MAIN.name, role: MAIN.role }])) : admins.find(x => x.id === g[2]);
      actor = a.id ? { name: a.name, role: a.role } : a;
    }
    return { id: 'x' + (96 - i), ts, actor: actor.name, role: actor.role, action: g[0], target: g[3](), ip: ip() };
  });

  const notifications = [
    { id: 'n1', icon: 'chat', text: 'New complaint: Cannot sign in after password reset', ts: NOW - 8 * 60 * MIN, href: '#complaints', unread: true },
    { id: 'n2', icon: 'userPlus', text: members.filter(m => m.status === 'pending').length + ' registrations are waiting for approval', ts: NOW - 2 * 60 * MIN, href: '#members', unread: true },
    { id: 'n3', icon: 'wallet', text: 'A mobile money payment is still pending confirmation', ts: NOW - 4 * 60 * MIN, href: '#payments', unread: true },
    { id: 'n4', icon: 'calendar', text: "Freshers' Welcome Evening is in 12 days", ts: NOW - 20 * 60 * MIN, href: '#content', unread: false }
  ];

  /* ---------- Analytics ---------- */
  const monthLabels = [];
  const monthFull = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(NOW); d.setDate(1); d.setMonth(d.getMonth() - i);
    monthLabels.push(T.ui.MONTHS[d.getMonth()]);
    monthFull.push(d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
  }
  const analytics = {
    totalMembers: 20000,
    newThisMonth: 412,
    growth: { labels: monthLabels, full: monthFull, values: [11980, 12640, 13310, 14020, 14630, 15100, 15420, 15760, 16350, 17980, 19588, 20000] },
    levels: [
      { label: '100 level', value: 6420, color: 'var(--c-green)' },
      { label: '200 level', value: 5380, color: 'var(--c-red)' },
      { label: '300 level', value: 4610, color: 'var(--c-ink)' },
      { label: '400 level', value: 3590, color: 'var(--c-mid)' }
    ],
    duesHistory: [18200, 21400, 33800, 29600, 24100, 19800, 15300, 12100, 26500, 58400, 61200],
    dues() {
      const mtd = T.money.monthToDate();
      return { labels: monthLabels, full: monthFull, values: this.duesHistory.concat([mtd]) };
    }
  };

  /* ---------- Money helpers ---------- */
  const startOfMonth = (() => { const d = new Date(NOW); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const sumSuccess = from => payments.filter(p => p.status === 'success' && p.ts >= from).reduce((s, p) => s + p.amount, 0);
  T.money = {
    today: () => sumSuccess(midnight),
    monthToDate: () => sumSuccess(startOfMonth),
    pending: () => { const l = payments.filter(p => p.status === 'pending'); return { count: l.length, amount: l.reduce((s, p) => s + p.amount, 0) }; }
  };

  T.me = () => T.state.role === 'main'
    ? { name: MAIN.name, role: MAIN.role, title: 'Main admin', email: 'main.admin@tein.example' }
    : { name: 'Esi Tetteh', role: 'Membership officer', title: 'Sub-admin', email: 'esi.tetteh@tein.example' };

  T.db = {
    settings, members, payments, complaints, events, posts, albums, leaders, admins, audit, notifications,
    AREAS, ROLES, ACTIONS, lastTs,
    log(action, target) {
      const me = T.me();
      audit.unshift({ id: 'x' + Date.now(), ts: Date.now(), actor: me.name, role: me.role, action, target, ip: '41.66.12.8' });
    },
    member: id => members.find(m => m.id === id),
    memberByStudentId: sid => members.find(m => m.studentId === sid)
  };
  T.analytics = analytics;
  T.nowMs = NOW;
})(window.TEIN = window.TEIN || {});
