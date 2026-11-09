/* Content / Leadership: executive cards with add, edit and remove */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.contentTabs = T.contentTabs || {};

  T.contentTabs.leadership = {
    label: 'Leadership',
    render(host, refreshTabs) {
      const db = T.db;

      function draw() {
        host.innerHTML = '<div class="tab-bar" style="margin-top:-4px"><p class="muted">Shown in this order on the public leadership page.</p>' +
          '<button class="btn btn-green" type="button" data-act="add">' + I('plus', 16) + 'Add executive</button></div>' +
          (db.leaders.length ? '<div class="leaders">' + db.leaders.map((l, i) =>
            '<article class="card leader"><div class="portrait av-' + (i % 3) + '">' + (l.photo ? '<img src="' + esc(l.photo) + '" alt="' + esc(l.name) + '">' : esc(U.initials(l.name))) + '</div>' +
            '<div class="info"><div class="role">' + esc(l.position) + (l.top ? ' · Featured' : '') + '</div><h3>' + esc(l.name) + '</h3><p>' + esc(l.bio) + '</p></div>' +
            '<div class="acts"><button class="btn btn-white btn-sm" type="button" data-act="edit" data-id="' + l.id + '">' + I('edit', 14) + 'Edit</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-act="remove" data-id="' + l.id + '">Remove</button></div></article>').join('') + '</div>'
            : '<section class="card">' + U.empty('users', 'No executives yet', 'Add your first leader to show them on the public site.') + '</section>');
      }

      function openForm(l) {
        let photo = l ? l.photo : null;
        T.modal.open({
          title: l ? 'Edit executive' : 'Add executive', subtitle: 'Photo, details, bio and optional testimony',
          body: '<form id="lform" class="form-stack" novalidate>' +
            '<div class="round-upload"><span id="l-av">' + U.avatar(l ? l.name : 'New Leader', 72, photo) + '</span><div><label class="btn btn-white btn-sm" for="l-photo" style="cursor:pointer">' + I('upload', 15) + 'Upload photo</label>' +
            '<input id="l-photo" type="file" accept="image/*" class="sr-only"><div class="hint" style="margin-top:6px">Square photos work best.</div></div></div>' +
            '<div class="form-grid"><div class="field"><label class="label" for="l-name">Full name</label><input class="input" id="l-name" value="' + esc(l ? l.name : '') + '"><div class="field-error" id="l-name-e" hidden>Enter a name.</div></div>' +
            '<div class="field"><label class="label" for="l-pos">Position</label><input class="input" id="l-pos" value="' + esc(l ? l.position : '') + '" placeholder="e.g. President"><div class="field-error" id="l-pos-e" hidden>Enter a position.</div></div></div>' +
            '<div class="form-grid"><div class="field"><label class="label" for="l-reg">Region</label><input class="input" id="l-reg" value="' + esc(l ? l.region : '') + '"></div>' +
            '<div class="field"><label class="label" for="l-since">In office since</label><input class="input" id="l-since" value="' + esc(l ? l.since : '') + '" placeholder="e.g. 2024"></div>' +
            '<div class="field span-2"><label class="label" for="l-focus">Focus area</label><input class="input" id="l-focus" value="' + esc(l ? l.focus : '') + '" placeholder="e.g. Programs & welfare"></div></div>' +
            '<div class="field"><label class="label" for="l-bio">Short bio</label><textarea class="textarea" id="l-bio" maxlength="200">' + esc(l ? l.bio : '') + '</textarea><div class="counter" id="l-count"></div></div>' +
            '<div class="field"><label class="label" for="l-top">Featured leader</label><label class="switch"><input type="checkbox" role="switch" id="l-top"' + (l && l.top ? ' checked' : '') + '><span class="track"><span class="thumb"></span></span><span class="sw-label">Show large on the leadership page (President and Vice President)</span></label></div>' +
            '<div class="field"><label class="label" for="l-test">Testimony <small>only shown for featured leaders</small></label><textarea class="textarea" id="l-test" maxlength="240">' + esc(l ? l.testimony : '') + '</textarea></div></form>',
          footer: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-green" type="button" id="l-save">' + (l ? 'Save changes' : 'Add executive') + '</button>',
          onMount(el, ctrl) {
            const bio = el.querySelector('#l-bio'), count = el.querySelector('#l-count');
            const upd = () => { count.textContent = bio.value.length + ' / 200'; }; upd(); bio.addEventListener('input', upd);
            el.querySelector('#l-photo').addEventListener('change', e => {
              const f = e.target.files[0]; if (!f) return;
              U.readImage(f).then(r => { photo = r.src; el.querySelector('#l-av').innerHTML = U.avatar(el.querySelector('#l-name').value || 'New Leader', 72, photo); });
            });
            const save = () => {
              const name = el.querySelector('#l-name').value.trim(), pos = el.querySelector('#l-pos').value.trim();
              el.querySelector('#l-name').classList.toggle('is-invalid', !name); el.querySelector('#l-name-e').hidden = !!name;
              el.querySelector('#l-pos').classList.toggle('is-invalid', !pos); el.querySelector('#l-pos-e').hidden = !!pos;
              if (!name || !pos) return;
              const data = { name, position: pos, bio: bio.value.trim(), photo, region: el.querySelector('#l-reg').value.trim(), since: el.querySelector('#l-since').value.trim(), focus: el.querySelector('#l-focus').value.trim(), top: el.querySelector('#l-top').checked, testimony: el.querySelector('#l-test').value.trim() };
              if (l) Object.assign(l, data); else db.leaders.push(Object.assign({ id: 'l' + Date.now() }, data));
              T.actions.published('Leadership', name);
              T.toast(l ? 'Changes saved' : name + ' added', 'ok');
              ctrl.close(); draw(); refreshTabs();
            };
            el.querySelector('#l-save').addEventListener('click', save);
            el.querySelector('#lform').addEventListener('submit', e => { e.preventDefault(); save(); });
          }
        });
      }

      host.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const a = b.dataset.act;
        if (a === 'add') openForm(null);
        else if (a === 'edit') openForm(db.leaders.find(x => x.id === b.dataset.id));
        else if (a === 'remove') {
          const l = db.leaders.find(x => x.id === b.dataset.id);
          T.modal.confirm({
            title: 'Remove ' + l.name + '?', tone: 'danger', confirmLabel: 'Remove', message: 'They will no longer appear on the public leadership page.',
            onConfirm() { db.leaders.splice(db.leaders.indexOf(l), 1); T.actions.removed('Executive', l.name); draw(); refreshTabs(); }
          });
        }
      });
      draw();
    }
  };
})(window.TEIN = window.TEIN || {});
