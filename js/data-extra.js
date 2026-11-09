/* Extra sample data for the public-site content screens, receipts and subscribers.
   Loaded after data.js. Shapes match what the public site templates expect. */
(function (T) {
  'use strict';
  const db = T.db, NOW = T.nowMs, DAY = 864e5;
  const ph = (c1, c2, t) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="480" height="640" fill="url(#g)"/><text x="50%" y="52%" fill="#fff" fill-opacity=".85" font-family="Arial" font-size="26" text-anchor="middle">' + t + '</text></svg>');

  Object.assign(db.settings, {
    address: 'Accra, Ghana', email: 'info@tein.org', phone: '+233 24 000 0000',
    facebook: 'https://facebook.com/tein', instagram: 'https://instagram.com/tein', x: '', youtube: '', whatsapp: ''
  });

  Object.assign(db.ACTIONS, {
    'payment.verify': { label: 'Approved receipt', kind: 'ok' }, 'payment.reject': { label: 'Rejected receipt', kind: 'bad' },
    'setting.contact': { label: 'Changed contact details', kind: 'neutral' }, 'setting.social': { label: 'Changed social links', kind: 'neutral' },
    'subscriber.remove': { label: 'Removed subscriber', kind: 'bad' }
  });

  db.heroSlides = [
    { id: 'h1', eyebrow: 'Welcome to TEIN', title: 'Together we grow stronger', text: 'A community of members building skills, networks and opportunity, one step at a time.', tone: 'red', image: null },
    { id: 'h2', eyebrow: 'Programs', title: 'Learn. Lead. Serve.', text: 'Training, mentorship and outreach designed around what our members actually need.', tone: 'black', image: null },
    { id: 'h3', eyebrow: 'Join us', title: 'Your place is waiting', text: 'Register in a few minutes, pay your dues online and take part in everything we do.', tone: 'green', image: null }
  ];
  db.strategy = [
    { id: 's1', n: 1, title: 'Listen', text: 'We start with members. Surveys, town halls and one-to-one conversations shape every plan.' },
    { id: 's2', n: 2, title: 'Plan', text: 'Clear goals, owners and timelines, shared openly so everyone can follow progress.' },
    { id: 's3', n: 3, title: 'Build', text: 'We run programs, training and projects that turn plans into real outcomes.' },
    { id: 's4', n: 4, title: 'Connect', text: 'Chapters, partners and mentors are linked so help reaches people faster.' },
    { id: 's5', n: 5, title: 'Deliver', text: 'Events, services and support that members can see and use.' },
    { id: 's6', n: 6, title: 'Review', text: 'We measure, report back and improve, then the wheel turns again.' }
  ];
  db.rings = [
    { id: 'r1', value: 85, label: 'Members active', note: 'Last 12 months', tone: 'green' },
    { id: 'r2', value: 72, label: 'Dues paid on time', note: 'This year', tone: 'red' },
    { id: 'r3', value: 94, label: 'Complaints resolved', note: 'Within 7 days', tone: 'black' },
    { id: 'r4', value: 68, label: 'Youth members', note: 'Under 35', tone: 'green' }
  ];
  db.programs = [
    { id: 'pg1', title: 'Leadership Training', text: 'Workshops and mentoring for members stepping into leadership.', tone: 'green' },
    { id: 'pg2', title: 'Community Outreach', text: 'Health screenings, clean-ups and support drives in local areas.', tone: 'red' },
    { id: 'pg3', title: 'Skills & Careers', text: 'Short courses, job links and small-business coaching.', tone: 'black' },
    { id: 'pg4', title: 'Welfare Support', text: 'Members helping members through hard times.', tone: 'green' }
  ];
  db.partners = ['Ministry', 'Unity Bank', 'Green Trust', 'Youth Fund', 'Media House', 'City Council', 'Tech Hub'].map((n, i) => ({ id: 'pt' + i, name: n, logo: null }));
  db.about = {
    intro: 'TEIN is a member-led organisation. We began as a small group with a simple idea: people do better when they are connected, informed and supported.',
    mission: 'To connect, inform and empower members through programs, services and a strong community.',
    vision: 'A community where every member can learn, lead and thrive.',
    values: [
      { title: 'Unity', text: 'We succeed together. Every member has a voice and a role.' },
      { title: 'Integrity', text: 'We are honest with money, with data and with each other.' },
      { title: 'Service', text: 'We measure ourselves by the good we do for the community.' }
    ]
  };

  /* leader extras */
  const extra = {
    l1: { region: 'Greater Accra', since: '2022', focus: 'Strategy & partnerships', top: true, testimony: 'TEIN is proof that when people organise with honesty and purpose, ordinary members can change what is possible for everyone.' },
    l2: { region: 'Ashanti', since: '2022', focus: 'Programs & welfare', top: true, testimony: 'Every programme we run starts with a member’s real need. That is what keeps this community strong.' }
  };
  db.leaders.forEach(l => Object.assign(l, { region: '', since: '', focus: '', top: false, testimony: '' }, extra[l.id] || {}));

  /* uploaded receipts waiting for verification (public "Pay dues" > upload a receipt) */
  const pool = db.members.filter(m => m.dues === 'unpaid' && m.status === 'approved').slice(0, 4);
  const notes = [['Bank deposit', 'GTB-88213', 'Deposit slip from GTBank'], ['Mobile money transfer', 'MM-7741920', 'MoMo screenshot'], ['Cash', 'REC-0412', 'Paper receipt from secretariat'], ['Bank deposit', 'ECO-55102', 'Deposit slip']];
  pool.forEach((m, i) => {
    db.payments.unshift({
      id: 'rc' + (i + 1), memberId: m.id, name: m.name, studentId: m.studentId, amount: db.settings.dues,
      ts: NOW - (i * 7 + 2) * 60 * 60 * 1000, status: 'pending', method: 'receipt', channel: notes[i][0], ref: notes[i][1], note: notes[i][2],
      receipt: ph(['#03451B', '#B30000', '#0E0E0E', '#1F6E36'][i], '#222', 'Receipt photo')
    });
  });
  db.payments.sort((a, b) => b.ts - a.ts);

  db.subscribers = ['ama.k@example.com', 'kofi.m@example.com', 'efua.o@example.com', 'yaw.d@example.com', 'abena.s@example.com', 'nana.a@example.com', 'selina.q@example.com', 'kwame.b@example.com', 'esi.t@example.com', 'fiifi.a@example.com', 'akosua.d@example.com', 'selorm.a@example.com']
    .map((email, i) => ({ id: 'sb' + i, email, ts: NOW - (i * 3 + 1) * DAY, source: ['Home page', 'Footer', 'Contact page'][i % 3] }));
})(window.TEIN = window.TEIN || {});
