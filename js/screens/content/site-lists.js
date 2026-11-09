/* Content tabs for the public site: Hero slides, Strategy steps, Programs, Partners, About & numbers.
   One generic list editor (T.listEditor) powers four of them. */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.contentTabs = T.contentTabs || {};
  const TONES = [['green', 'Green'], ['red', 'Red'], ['black', 'Black']];

  /* cfg: { label, list, kind, intro, addLabel, fields:[{k,label,type,options,max,hint,span2,req}], title(i), sub(i), thumb(i), renumber } */
  T.listEditor = function (cfg) {
    return {
      label: cfg.label,
      render(host, refreshTabs) {
        const list = () => T.db[cfg.list];
        function draw() {
          const items = list();
          host.innerHTML = '<div class="tab-bar" style="margin-top:-4px"><p class="muted">' + esc(cfg.intro) + '</p>' +
            '<button class="btn btn-green" type="button" data-act="add">' + I('plus', 16) + esc(cfg.addLabel) + '</button></div>' +
            (items.length ? '<section class="card"><ul class="lrows">' + items.map((it, i) =>
              '<li class="lrow"><div class="lorder"><button class="btn-icon" type="button" data-act="up" data-id="' + it.id + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + I('arrowUp', 16) + '</button>' +
              '<button class="btn-icon" type="button" data-act="down" data-id="' + it.id + '" aria-label="Move down"' + (i === items.length - 1 ? ' disabled' : '') + '>' + I('arrowDown', 16) + '</button></div>' +
              (cfg.thumb ? '<div class="lthumb">' + cfg.thumb(it) + '</div>' : '') +
              '<div class="linfo"><b>' + esc(cfg.title(it)) + '</b><small>' + esc(cfg.sub(it)) + '</small></div>' +
              '<div class="lacts"><button class="btn btn-white btn-sm" type="button" data-act="edit" data-id="' + it.id + '">' + I('edit', 14) + 'Edit</button>' +
              '<button class="btn btn-ghost btn-sm" type="button" data-act="remove" data-id="' + it.id + '">Remove</button></div></li>').join('') + '</ul></section>'
              : '<section class="card">' + U.empty('doc', 'Nothing here yet', 'Add the first one to show it on the public site.') + '</section>');
        }
        function field(f, v) {
          const id = 'f-' + f.k, val = v == null ? '' : v;
          let ctl;
          if (f.type === 'textarea') ctl = '<textarea class="textarea" id="' + id + '" maxlength="' + (f.max || 300) + '">' + esc(val) + '</textarea>';
          else if (f.type === 'select') ctl = U.select(id, f.options, val || f.options[0][0]);
          else if (f.type === 'number') ctl = '<input class="input" id="' + id + '" type="number" min="' + (f.min == null ? 0 : f.min) + '" max="' + (f.maxv == null ? 100 : f.maxv) + '" value="' + esc(val) + '">';
          else if (f.type === 'image') ctl = '<div class="round-upload"><span id="' + id + '-prev">' + (val ? '<img src="' + esc(val) + '" alt="" style="width:72px;height:72px;border-radius:12px;object-fit:cover">' : '<span class="avatar av-0" style="--sz:72px;border-radius:12px">' + I('image', 24) + '</span>') + '</span>' +
            '<div><label class="btn btn-white btn-sm" for="' + id + '" style="cursor:pointer">' + I('upload', 15) + 'Upload image</label><input id="' + id + '" type="file" accept="image/*" class="sr-only"><div class="hint" style="margin-top:6px">' + esc(f.hint || 'JPG or PNG') + '</div></div></div>';
          else ctl = '<input class="input" id="' + id + '" value="' + esc(val) + '" maxlength="' + (f.max || 120) + '">';
          return '<div class="field' + (f.span2 ? ' span-2' : '') + '"><label class="label" for="' + id + '">' + esc(f.label) + '</label>' + ctl +
            (f.hint && f.type !== 'image' ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '<div class="field-error" id="' + id + '-e" hidden>Required.</div></div>';
        }
        function openForm(it) {
          const imgs = {};
          T.modal.open({
            title: (it ? 'Edit ' : 'Add ') + cfg.kind, subtitle: cfg.formSub || 'Shown on the public site',
            body: '<form id="lf" class="form-grid" novalidate>' + cfg.fields.map(f => field(f, it ? it[f.k] : (f.def != null ? f.def : ''))).join('') + '</form>',
            footer: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-green" type="button" id="lf-save">' + (it ? 'Save changes' : 'Add') + '</button>',
            onMount(el, ctrl) {
              cfg.fields.filter(f => f.type === 'image').forEach(f => {
                imgs[f.k] = it ? it[f.k] : null;
                el.querySelector('#f-' + f.k).addEventListener('change', e => {
                  const file = e.target.files[0]; if (!file) return;
                  U.readImage(file).then(r => { imgs[f.k] = r.src; el.querySelector('#f-' + f.k + '-prev').innerHTML = '<img src="' + esc(r.src) + '" alt="" style="width:72px;height:72px;border-radius:12px;object-fit:cover">'; });
                });
              });
              const save = () => {
                const data = {}; let ok = true;
                cfg.fields.forEach(f => {
                  if (f.type === 'image') { data[f.k] = imgs[f.k]; return; }
                  let v = el.querySelector('#f-' + f.k).value.trim();
                  if (f.type === 'number') v = Math.max(f.min || 0, Math.min(f.maxv == null ? 100 : f.maxv, parseFloat(v) || 0));
                  const bad = f.req && !String(v).length;
                  el.querySelector('#f-' + f.k).classList.toggle('is-invalid', !!bad); el.querySelector('#f-' + f.k + '-e').hidden = !bad;
                  if (bad) ok = false; data[f.k] = v;
                });
                if (!ok) return;
                if (it) Object.assign(it, data); else list().push(Object.assign({ id: cfg.list + Date.now() }, data));
                if (cfg.renumber) list().forEach((x, i) => { x.n = i + 1; });
                T.actions.published(cfg.kind, cfg.title(data));
                T.toast(it ? 'Changes saved' : cfg.kind + ' added', 'ok');
                ctrl.close(); draw(); refreshTabs();
              };
              el.querySelector('#lf-save').addEventListener('click', save);
              el.querySelector('#lf').addEventListener('submit', e => { e.preventDefault(); save(); });
            }
          });
        }
        host.addEventListener('click', e => {
          const b = e.target.closest('[data-act]'); if (!b) return;
          const a = b.dataset.act, items = list(), it = items.find(x => x.id === b.dataset.id);
          if (a === 'add') openForm(null);
          else if (a === 'edit') openForm(it);
          else if (a === 'up' || a === 'down') {
            const i = items.indexOf(it), j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= items.length) return;
            items.splice(i, 1); items.splice(j, 0, it);
            if (cfg.renumber) items.forEach((x, k) => { x.n = k + 1; });
            T.db.log('content.publish', cfg.kind + ' order: ' + cfg.title(it)); draw();
          } else if (a === 'remove') {
            T.modal.confirm({
              title: 'Remove "' + cfg.title(it) + '"?', tone: 'danger', confirmLabel: 'Remove', message: 'It will no longer appear on the public site.',
              onConfirm() { items.splice(items.indexOf(it), 1); if (cfg.renumber) items.forEach((x, k) => { x.n = k + 1; }); T.actions.removed(cfg.kind, cfg.title(it)); draw(); refreshTabs(); }
            });
          }
        });
        draw();
      }
    };
  };

  const tone = t => '<span class="avatar av-' + ({ green: 0, red: 1, black: 2 }[t] || 0) + '" style="--sz:44px;border-radius:12px">' + I('image', 20) + '</span>';

  T.contentTabs.hero = T.listEditor({
    label: 'Hero slides', list: 'heroSlides', kind: 'Hero slide', addLabel: 'Add slide',
    intro: 'The big slides at the top of the home page. They fade every 3 seconds in this order. Keep to three or four.',
    title: i => i.title, sub: i => i.eyebrow + ' · ' + i.tone + ' tint',
    thumb: i => i.image ? '<img src="' + esc(i.image) + '" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover">' : tone(i.tone),
    fields: [
      { k: 'eyebrow', label: 'Small label', req: true, max: 40 }, { k: 'tone', label: 'Colour tint', type: 'select', options: TONES, hint: 'A light wash of colour over the photo' },
      { k: 'title', label: 'Headline', req: true, max: 60, span2: true }, { k: 'text', label: 'Short text', type: 'textarea', max: 160, span2: true },
      { k: 'image', label: 'Background photo', type: 'image', span2: true, hint: 'Wide photos work best. Without one, a colour panel shows.' }
    ]
  });
  T.contentTabs.strategy = T.listEditor({
    label: 'Strategy wheel', list: 'strategy', kind: 'Strategy step', addLabel: 'Add step', renumber: true,
    intro: 'The steps on the rotating wheel. The order here is the order around the wheel. Four to eight steps look best.',
    title: i => i.title, sub: i => 'Step ' + (i.n || '?') + ' · ' + (i.text || '').slice(0, 70),
    fields: [{ k: 'title', label: 'Step name', req: true, max: 14, hint: 'Short, it is written on the wheel' }, { k: 'text', label: 'Description', type: 'textarea', req: true, max: 200, span2: true }]
  });
  T.contentTabs.programs = T.listEditor({
    label: 'Programs', list: 'programs', kind: 'Program', addLabel: 'Add program',
    intro: 'What TEIN offers. Shown as cards on the home and programs pages.',
    title: i => i.title, sub: i => (i.text || '').slice(0, 80), thumb: i => tone(i.tone),
    fields: [{ k: 'title', label: 'Name', req: true, max: 40 }, { k: 'tone', label: 'Card colour', type: 'select', options: TONES },
      { k: 'text', label: 'Short description', type: 'textarea', req: true, max: 160, span2: true }]
  });
  T.contentTabs.partners = T.listEditor({
    label: 'Partners', list: 'partners', kind: 'Partner', addLabel: 'Add partner',
    intro: 'Logos in the partners carousel on the home and about pages. It moves one logo every 3 seconds.',
    title: i => i.name, sub: i => i.logo ? 'Logo uploaded' : 'No logo, name shown as text',
    thumb: i => i.logo ? '<img src="' + esc(i.logo) + '" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:contain;background:var(--sunken)">' : tone('green'),
    fields: [{ k: 'name', label: 'Partner name', req: true, max: 40 }, { k: 'logo', label: 'Logo', type: 'image', hint: 'Transparent PNG works best' }]
  });

  /* About text, core values and impact rings: one form, saved together */
  T.contentTabs.about = {
    label: 'About & numbers',
    render(host) {
      const a = T.db.about, rings = T.db.rings;
      host.innerHTML = '<section class="card settings">' +
        '<div class="setting"><div><h3>About text</h3><p class="desc">The intro, mission and vision on the About page.</p></div><div class="ctl">' +
        '<div class="field"><label class="label" for="ab-intro">Who we are</label><textarea class="textarea" id="ab-intro" maxlength="400">' + esc(a.intro) + '</textarea></div>' +
        '<div class="form-grid"><div class="field"><label class="label" for="ab-mis">Mission</label><textarea class="textarea" id="ab-mis" maxlength="200">' + esc(a.mission) + '</textarea></div>' +
        '<div class="field"><label class="label" for="ab-vis">Vision</label><textarea class="textarea" id="ab-vis" maxlength="200">' + esc(a.vision) + '</textarea></div></div></div></div>' +
        '<div class="setting"><div><h3>Three core values</h3><p class="desc">Shown in the interactive circles. Each needs a one-line statement.</p></div><div class="ctl">' +
        a.values.map((v, i) => '<div class="form-grid"><div class="field"><label class="label" for="cv-t' + i + '">Value ' + (i + 1) + '</label><input class="input" id="cv-t' + i + '" maxlength="16" value="' + esc(v.title) + '"></div>' +
          '<div class="field"><label class="label" for="cv-x' + i + '">Statement</label><input class="input" id="cv-x' + i + '" maxlength="110" value="' + esc(v.text) + '"></div></div>').join('') + '</div></div>' +
        '<div class="setting"><div><h3>Impact rings</h3><p class="desc">Percentages in the rings. They redraw each time a visitor scrolls to them.</p></div><div class="ctl">' +
        rings.map((r, i) => '<div class="form-grid" style="grid-template-columns:minmax(0,1.4fr) 110px minmax(0,1fr)"><div class="field"><label class="label" for="rg-l' + i + '">Label</label><input class="input" id="rg-l' + i + '" maxlength="30" value="' + esc(r.label) + '"></div>' +
          '<div class="field"><label class="label" for="rg-v' + i + '">%</label><input class="input" id="rg-v' + i + '" type="number" min="0" max="100" value="' + r.value + '"></div>' +
          '<div class="field"><label class="label" for="rg-n' + i + '">Small note</label><input class="input" id="rg-n' + i + '" maxlength="30" value="' + esc(r.note) + '"></div></div>').join('') +
        '<div class="save-row"><button class="btn btn-green" type="button" id="ab-save">Save changes</button></div></div></div></section>';
      const v = id => host.querySelector('#' + id).value.trim();
      host.querySelector('#ab-save').addEventListener('click', () => {
        a.intro = v('ab-intro'); a.mission = v('ab-mis'); a.vision = v('ab-vis');
        a.values.forEach((x, i) => { x.title = v('cv-t' + i) || x.title; x.text = v('cv-x' + i); });
        rings.forEach((r, i) => { r.label = v('rg-l' + i) || r.label; r.value = Math.max(0, Math.min(100, parseInt(v('rg-v' + i), 10) || 0)); r.note = v('rg-n' + i); });
        T.actions.published('About page', 'text, values and numbers'); T.toast('Saved', 'ok');
      });
    }
  };
})(window.TEIN = window.TEIN || {});
