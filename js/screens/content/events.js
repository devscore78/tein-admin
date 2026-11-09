/* Content / Events: form on the left, list on the right */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.contentTabs = T.contentTabs || {};

  T.contentTabs.events = {
    label: 'Events',
    render(host, refreshTabs) {
      const db = T.db;
      let editing = null, poster = null;

      function sorted() {
        const now = Date.now();
        const up = db.events.filter(e => e.date >= now).sort((a, b) => a.date - b.date);
        const past = db.events.filter(e => e.date < now).sort((a, b) => b.date - a.date);
        return up.concat(past);
      }
      function toInputs(ts) {
        const d = new Date(ts);
        return { date: U.localDateInput(ts), time: U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) };
      }

      function draw() {
        const ev = editing ? db.events.find(e => e.id === editing) : null;
        const dt = ev ? toInputs(ev.date) : { date: '', time: '10:00' };
        const now = Date.now();
        host.innerHTML = '<div class="split">' +
          '<section class="card"><div class="card-head"><div><h2 class="card-title">' + (ev ? 'Edit event' : 'New event') + '</h2><p class="card-sub">Shown on the public events page once published</p></div></div>' +
          '<form class="card-body form-stack" id="evform" novalidate>' +
          '<div class="field"><label class="label" for="ev-title">Event title</label><input class="input" id="ev-title" value="' + esc(ev ? ev.title : '') + '" placeholder="e.g. Career Mixer with Alumni"><div class="field-error" id="ev-title-e" hidden>Give the event a title.</div></div>' +
          '<div class="form-grid"><div class="field"><label class="label" for="ev-date">Date</label><input class="input" id="ev-date" type="date" value="' + dt.date + '"><div class="field-error" id="ev-date-e" hidden>Pick a date.</div></div>' +
          '<div class="field"><label class="label" for="ev-time">Start time</label><input class="input" id="ev-time" type="time" value="' + dt.time + '"></div></div>' +
          '<div class="field"><label class="label" for="ev-loc">Location</label><input class="input" id="ev-loc" value="' + esc(ev ? ev.location : '') + '" placeholder="e.g. Main Auditorium"><div class="field-error" id="ev-loc-e" hidden>Add a location.</div></div>' +
          '<div class="field"><label class="label" for="ev-desc">Description</label><textarea class="textarea" id="ev-desc" placeholder="What should members expect?">' + esc(ev ? ev.description : '') + '</textarea></div>' +
          '<div class="field"><span class="label">Poster</span>' + (poster ? '<img class="preview-img" src="' + esc(poster) + '" alt="Poster preview"><div class="form-actions"><button class="btn btn-ghost btn-sm" type="button" data-act="clear-poster">Remove poster</button></div>' :
            '<label class="drop" id="ev-drop" for="ev-poster">' + I('upload', 22) + '<span><b>Upload a poster</b></span><span>PNG or JPG, drag and drop or click</span><input id="ev-poster" type="file" accept="image/*"></label>') + '</div>' +
          '<div class="form-actions"><button class="btn btn-green" type="submit">' + (ev ? 'Save changes' : 'Publish event') + '</button>' + (ev ? '<button class="btn btn-ghost" type="button" data-act="cancel">Cancel</button>' : '') + '</div></form></section>' +

          '<section class="card"><div class="card-head"><div><h2 class="card-title">All events</h2><p class="card-sub">Upcoming first, then past events</p></div></div><div style="margin-top:12px">' +
          (db.events.length ? sorted().map(e => {
            const d = new Date(e.date);
            return '<div class="event' + (e.date < now ? ' is-past' : '') + '"><div class="date-block"><small>' + U.MONTHS[d.getMonth()] + '</small><b>' + d.getDate() + '</b></div>' +
              (e.poster ? '<img class="poster" src="' + esc(e.poster) + '" alt="">' : '') +
              '<div class="tx"><b>' + esc(e.title) + '</b><small><span>' + I('clock', 14) + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + '</span><span>' + I('pin', 14) + esc(e.location) + '</span></small></div>' +
              (e.date < now ? U.badge('neutral', 'Past', false) : U.badge('ok', 'Upcoming')) +
              '<div class="acts"><button class="btn-icon" type="button" data-act="edit" data-id="' + e.id + '" aria-label="Edit ' + esc(e.title) + '">' + I('edit', 18) + '</button>' +
              '<button class="btn-icon is-danger" type="button" data-act="delete" data-id="' + e.id + '" aria-label="Delete ' + esc(e.title) + '">' + I('trash', 18) + '</button></div></div>';
          }).join('') : U.empty('calendar', 'No events yet', 'Add your first event using the form.')) + '</div></section></div>';
        bindDrop();
      }

      function bindDrop() {
        const input = host.querySelector('#ev-poster'), drop = host.querySelector('#ev-drop');
        if (!input) return;
        const take = f => { if (f && f.type.indexOf('image/') === 0) U.readImage(f).then(r => { keepFields(); poster = r.src; draw(); restoreFields(); }); };
        input.addEventListener('change', () => take(input.files[0]));
        ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
        drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
      }
      let saved = null;
      function keepFields() { saved = ['ev-title', 'ev-date', 'ev-time', 'ev-loc', 'ev-desc'].map(id => [id, host.querySelector('#' + id).value]); }
      function restoreFields() { if (!saved) return; saved.forEach(p => { host.querySelector('#' + p[0]).value = p[1]; }); saved = null; }

      host.addEventListener('submit', e => {
        if (e.target.id !== 'evform') return;
        e.preventDefault();
        const f = id => host.querySelector('#' + id);
        let ok = true;
        [['ev-title', f('ev-title').value.trim()], ['ev-date', f('ev-date').value], ['ev-loc', f('ev-loc').value.trim()]].forEach(p => {
          const bad = !p[1]; f(p[0]).classList.toggle('is-invalid', bad); f(p[0] + '-e').hidden = !bad; if (bad) ok = false;
        });
        if (!ok) return;
        const when = new Date(f('ev-date').value + 'T' + (f('ev-time').value || '10:00')).getTime();
        const data = { title: f('ev-title').value.trim(), date: when, location: f('ev-loc').value.trim(), description: f('ev-desc').value.trim(), poster };
        if (editing) { Object.assign(db.events.find(x => x.id === editing), data); T.toast('Event updated', 'ok'); }
        else { db.events.push(Object.assign({ id: 'e' + Date.now() }, data)); T.toast('Event published', 'ok'); }
        T.actions.published('Event', data.title);
        editing = null; poster = null; draw(); refreshTabs();
      });
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'edit') { editing = b.dataset.id; poster = db.events.find(x => x.id === editing).poster; draw(); host.scrollIntoView({ block: 'start' }); }
        else if (a === 'cancel') { editing = null; poster = null; draw(); }
        else if (a === 'clear-poster') { keepFields(); poster = null; draw(); restoreFields(); }
        else if (a === 'delete') {
          const ev = db.events.find(x => x.id === b.dataset.id);
          T.modal.confirm({
            title: 'Delete this event?', tone: 'danger', confirmLabel: 'Delete event', message: '"' + ev.title + '" will be removed from the public site.',
            onConfirm() { db.events.splice(db.events.indexOf(ev), 1); T.actions.removed('Event', ev.title); if (editing === ev.id) { editing = null; poster = null; } draw(); refreshTabs(); }
          });
        }
      });
      draw();
    }
  };
})(window.TEIN = window.TEIN || {});
