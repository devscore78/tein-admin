# TEIN Admin: frontend (static)

Open `index.html` in a browser. Plain HTML, CSS and JavaScript, no build step. Sample data lives in `js/data.js` and `js/data-extra.js`; every action is in `js/actions.js` so you can swap bodies for API calls.

## Screens
Overview · Members · Payments (incl. **Receipts to verify**) · Complaints · Content (Events, Blog, Gallery, Leadership, **Hero slides, Strategy wheel, Programs, Partners, About & numbers**) · **Subscribers** · Site settings (registration, closed message, **contact, social links**, dues) · Sub-admins · Audit log. Light and dark mode.

## Files
css/ base, layout, components, screens · js/ui.js, data.js, data-extra.js, actions.js, app.js · js/components/* (table, modal, charts, sidebar, topbar…) · js/screens/* (one per area; content tabs in js/screens/content/*)

## Data each public-site section needs (admin fields)
- Hero slide: eyebrow, title, text, tone (red/black/green), image, order
- Strategy step: n, title, text (order = wheel order)
- Program: title, text, tone · Partner: name, logo
- About: intro, mission, vision, 3 values (title, text) · Impact rings: label, value %, note
- Leader: name, position, bio, photo, region, since, focus, top (featured), testimony, order
- Receipt payment: member, amount, channel, reference, date, receipt image, status (pending/success/failed), reject reason
- Subscriber: email, date, source
- Settings: registration_open, closed_message, dues, academic year, address, email, phone, facebook, instagram, x, youtube, whatsapp

Note: this build is the artifact page wrapped as a normal document, so it works from the file system or any static host.
