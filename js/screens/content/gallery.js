/* Content / Gallery: upload many photos into an album, browse albums */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.contentTabs = T.contentTabs || {};

  T.contentTabs.gallery = {
    label: 'Gallery',
    render(host, refreshTabs) {
      const db = T.db;
      let staged = [];     // { src, name }
      let albumId = db.albums.length ? db.albums[0].id : '__new';
      let newName = '';

      function cover(a) {
        const tiles = [0, 1, 2].map(i => a.photos[i]
          ? '<img src="' + esc(a.photos[i].src) + '" alt="">'
          : '<div class="t t' + (i + 1) + '">' + I('image', i ? 16 : 24) + '</div>');
        return '<div class="cover">' + tiles.join('') + '</div>';
      }

      function draw() {
        const opts = db.albums.map(a => [a.id, a.name]).concat([['__new', 'New album…']]);
        host.innerHTML = '<div class="split">' +
          '<section class="card"><div class="card-head"><div><h2 class="card-title">Add photos</h2><p class="card-sub">Choose several at once. They are added to the album you pick.</p></div></div>' +
          '<form class="card-body form-stack" id="gform" novalidate>' +
          '<div class="field"><label class="label" for="g-album">Album</label>' + U.select('g-album', opts, albumId) + '</div>' +
          '<div class="field" id="g-new-wrap"' + (albumId === '__new' ? '' : ' hidden') + '><label class="label" for="g-new">New album name</label><input class="input" id="g-new" value="' + esc(newName) + '" placeholder="e.g. Freshers\' Evening 2026"><div class="field-error" id="g-new-e" hidden>Name the album.</div></div>' +
          '<label class="drop" id="g-drop" for="g-files">' + I('upload', 22) + '<span><b>Choose photos</b></span><span>Drag and drop, or click to browse</span><input id="g-files" type="file" accept="image/*" multiple></label>' +
          (staged.length ? '<div class="thumbs">' + staged.map((s, i) => '<div class="thumb"><img src="' + esc(s.src) + '" alt="' + esc(s.name) + '"><button type="button" data-act="unstage" data-i="' + i + '" aria-label="Remove ' + esc(s.name) + '">' + I('x', 13) + '</button></div>').join('') + '</div>' : '') +
          '<div class="form-actions"><button class="btn btn-green" type="submit"' + (staged.length ? '' : ' disabled') + '>' + I('upload', 16) + 'Upload ' + (staged.length ? staged.length + ' photo' + (staged.length === 1 ? '' : 's') : 'photos') + '</button></div></form></section>' +

          '<section class="card"><div class="card-head"><div><h2 class="card-title">Albums</h2><p class="card-sub">' + db.albums.length + ' albums, ' + U.num(db.albums.reduce((s, a) => s + a.count, 0)) + ' photos</p></div></div><div class="card-body">' +
          (db.albums.length ? '<div class="albums">' + db.albums.map(a => '<button class="album" type="button" data-act="open" data-id="' + a.id + '">' + cover(a) + '<b>' + esc(a.name) + '</b><small>' + a.count + ' photos · ' + U.date(a.date) + '</small></button>').join('') + '</div>'
            : U.empty('image', 'No albums yet', 'Create one by uploading your first photos.')) + '</div></section></div>';
        bind();
      }

      function bind() {
        const input = host.querySelector('#g-files'), drop = host.querySelector('#g-drop');
        const take = files => {
          const imgs = Array.from(files).filter(f => f.type.indexOf('image/') === 0);
          if (!imgs.length) return;
          Promise.all(imgs.map(U.readImage)).then(r => { snapshot(); staged = staged.concat(r); draw(); });
        };
        input.addEventListener('change', () => take(input.files));
        ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
        drop.addEventListener('drop', e => take(e.dataTransfer.files));
        host.querySelector('#g-album').addEventListener('change', e => {
          albumId = e.target.value; host.querySelector('#g-new-wrap').hidden = albumId !== '__new';
        });
        host.querySelector('#g-new').addEventListener('input', e => { newName = e.target.value; });
      }
      function snapshot() {
        const a = host.querySelector('#g-album'), n = host.querySelector('#g-new');
        if (a) albumId = a.value; if (n) newName = n.value;
      }

      host.addEventListener('submit', e => {
        if (e.target.id !== 'gform') return;
        e.preventDefault();
        if (!staged.length) return;
        let album;
        if (albumId === '__new') {
          const name = host.querySelector('#g-new').value.trim();
          if (!name) { host.querySelector('#g-new').classList.add('is-invalid'); host.querySelector('#g-new-e').hidden = false; return; }
          album = { id: 'g' + Date.now(), name, date: Date.now(), count: 0, photos: [] };
          db.albums.unshift(album);
        } else album = db.albums.find(a => a.id === albumId);
        album.photos = staged.concat(album.photos); album.count += staged.length;
        T.actions.published('Gallery', staged.length + ' photo' + (staged.length === 1 ? '' : 's') + ' added to ' + album.name);
        T.toast(staged.length + ' photo' + (staged.length === 1 ? '' : 's') + ' added to ' + album.name, 'ok');
        albumId = album.id; staged = []; newName = ''; draw(); refreshTabs();
      });

      function openAlbum(a) {
        const placeholders = Math.max(0, Math.min(a.count - a.photos.length, 18));
        const tiles = a.photos.map(p => '<div class="thumb"><img src="' + esc(p.src) + '" alt="' + esc(p.name) + '"></div>').join('') +
          Array.from({ length: placeholders }, (_, i) => '<div class="thumb ph">' + I('image', 22) + '<small>IMG_' + String(4100 + i * 7).padStart(4, '0') + '</small></div>').join('');
        T.modal.open({
          title: a.name, size: 'lg', subtitle: a.count + ' photos · ' + U.date(a.date),
          body: '<div class="photo-grid">' + tiles + '</div>' + (a.count > a.photos.length + placeholders ? '<p class="muted" style="margin-top:12px">Showing a preview. The full album loads from your storage.</p>' : ''),
          footer: '<button class="btn btn-outline-red push" type="button" data-del>' + I('trash', 16) + 'Delete album</button><button class="btn btn-ghost" type="button" data-close>Close</button>',
          onMount(el, ctrl) {
            el.querySelector('[data-del]').addEventListener('click', () => {
              ctrl.close();
              T.modal.confirm({
                title: 'Delete "' + a.name + '"?', tone: 'danger', confirmLabel: 'Delete album', message: 'All ' + a.count + ' photos in this album will be removed from the public site.',
                onConfirm() { db.albums.splice(db.albums.indexOf(a), 1); T.actions.removed('Album', a.name); if (albumId === a.id) albumId = db.albums.length ? db.albums[0].id : '__new'; draw(); refreshTabs(); }
              });
            });
          }
        });
      }

      host.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'unstage') { snapshot(); staged.splice(+b.dataset.i, 1); draw(); }
        else if (b.dataset.act === 'open') openAlbum(db.albums.find(a => a.id === b.dataset.id));
      });
      draw();
    }
  };
})(window.TEIN = window.TEIN || {});
