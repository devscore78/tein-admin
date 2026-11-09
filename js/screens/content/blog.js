/* Content / Blog: rich text editor on the left, posts on the right */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;
  T.contentTabs = T.contentTabs || {};

  /* strip scripts and inline handlers before saving */
  function clean(html) {
    const t = document.createElement('template'); t.innerHTML = html;
    t.content.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(n => n.remove());
    t.content.querySelectorAll('*').forEach(n => Array.from(n.attributes).forEach(a => {
      if (/^on/i.test(a.name) || (a.name === 'href' && !/^(https?:|mailto:|#)/i.test(a.value))) n.removeAttribute(a.name);
    }));
    return t.innerHTML;
  }

  T.contentTabs.blog = {
    label: 'Blog',
    render(host, refreshTabs) {
      const db = T.db;
      let editing = null, range = null;
      const CATS = ['News', 'Announcement', 'Dues', 'Events'];

      function draw() {
        const p = editing ? db.posts.find(x => x.id === editing) : null;
        host.innerHTML = '<div class="split wide">' +
          '<section class="card"><div class="card-head"><div><h2 class="card-title">' + (p ? 'Edit post' : 'Write a post') + '</h2><p class="card-sub">Drafts stay private until you publish</p></div></div>' +
          '<form class="card-body form-stack" id="bform" novalidate>' +
          '<div class="form-grid"><div class="field"><label class="label" for="b-title">Title</label><input class="input" id="b-title" value="' + esc(p ? p.title : '') + '" placeholder="A clear headline"><div class="field-error" id="b-title-e" hidden>Add a title.</div></div>' +
          '<div class="field"><label class="label" for="b-cat">Category</label>' + U.select('b-cat', CATS, p ? p.category : 'News') + '</div></div>' +
          '<div class="field"><span class="label" id="b-body-l">Story</span><div>' +
          '<div class="rte-bar" id="rbar" role="toolbar" aria-label="Formatting">' +
          '<button class="btn-icon" type="button" data-cmd="bold" aria-label="Bold" title="Bold">' + I('bold', 17) + '</button>' +
          '<button class="btn-icon" type="button" data-cmd="italic" aria-label="Italic" title="Italic">' + I('italic', 17) + '</button><span class="sep"></span>' +
          '<button class="btn-icon" type="button" data-cmd="h2" aria-label="Heading" title="Heading">' + I('heading', 17) + '</button>' +
          '<button class="btn-icon" type="button" data-cmd="ul" aria-label="Bulleted list" title="Bulleted list">' + I('list', 17) + '</button>' +
          '<button class="btn-icon" type="button" data-cmd="quote" aria-label="Quote" title="Quote">' + I('quote', 17) + '</button>' +
          '<button class="btn-icon" type="button" data-cmd="link" aria-label="Add link" title="Add link">' + I('link', 17) + '</button></div>' +
          '<div class="rte-link" id="rlink" hidden><input class="input" id="rurl" type="url" placeholder="https://" aria-label="Link address"><button class="btn btn-green btn-sm" type="button" data-cmd="link-apply">Add</button><button class="btn btn-ghost btn-sm" type="button" data-cmd="link-cancel">Cancel</button></div>' +
          '<div class="rte" id="b-body" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="b-body-l" data-placeholder="Start writing…">' + (p ? p.body : '') + '</div></div>' +
          '<div class="field-error" id="b-body-e" hidden>Write something before saving.</div></div>' +
          '<div class="form-actions"><button class="btn btn-green" type="submit" data-status="published">' + (p && p.status === 'published' ? 'Update post' : 'Publish') + '</button>' +
          '<button class="btn btn-outline" type="submit" data-status="draft">Save draft</button>' + (p ? '<button class="btn btn-ghost" type="button" data-act="cancel">Cancel</button>' : '') + '</div></form></section>' +

          '<section class="card"><div class="card-head"><div><h2 class="card-title">Posts</h2><p class="card-sub">' + db.posts.filter(x => x.status === 'published').length + ' published, ' + db.posts.filter(x => x.status === 'draft').length + ' drafts</p></div></div><ul class="row-list" style="margin-top:12px">' +
          (db.posts.length ? db.posts.slice().sort((a, b) => b.date - a.date).map(x =>
            '<li><div class="tx"><b>' + esc(x.title) + '</b><small>' + esc(x.category) + ' · ' + esc(x.author) + ' · ' + U.date(x.date) + '</small></div>' +
            (x.status === 'published' ? U.badge('ok', 'Published') : U.badge('neutral', 'Draft')) +
            '<button class="btn-icon" type="button" data-act="edit" data-id="' + x.id + '" aria-label="Edit ' + esc(x.title) + '">' + I('edit', 18) + '</button>' +
            '<button class="btn-icon is-danger" type="button" data-act="delete" data-id="' + x.id + '" aria-label="Delete ' + esc(x.title) + '">' + I('trash', 18) + '</button></li>').join('') :
            '<li>' + U.empty('doc', 'No posts yet', 'Write your first post on the left.') + '</li>') + '</ul></section></div>';
      }

      const body = () => host.querySelector('#b-body');
      const bar = e => e.target.closest('[data-cmd]');
      host.addEventListener('mousedown', e => { if (bar(e) && e.target.closest('#rbar')) e.preventDefault(); });
      host.addEventListener('click', e => {
        const c = bar(e);
        if (c) {
          const cmd = c.dataset.cmd, ed = body();
          if (cmd === 'link') {
            const s = window.getSelection();
            if (s.rangeCount && ed.contains(s.anchorNode)) range = s.getRangeAt(0).cloneRange();
            host.querySelector('#rlink').hidden = false; host.querySelector('#rurl').focus(); return;
          }
          if (cmd === 'link-cancel') { host.querySelector('#rlink').hidden = true; return; }
          if (cmd === 'link-apply') {
            const url = host.querySelector('#rurl').value.trim();
            if (/^https?:\/\//i.test(url)) {
              ed.focus();
              if (range) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(range); }
              if (range && range.collapsed) document.execCommand('insertHTML', false, '<a href="' + esc(url) + '">' + esc(url) + '</a>');
              else document.execCommand('createLink', false, url);
              host.querySelector('#rlink').hidden = true; host.querySelector('#rurl').value = '';
            } else T.toast('Enter a full address starting with https://', 'bad');
            return;
          }
          ed.focus();
          if (cmd === 'bold') document.execCommand('bold');
          else if (cmd === 'italic') document.execCommand('italic');
          else if (cmd === 'h2') document.execCommand('formatBlock', false, 'h2');
          else if (cmd === 'ul') document.execCommand('insertUnorderedList');
          else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote');
          return;
        }
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'edit') { editing = b.dataset.id; draw(); host.scrollIntoView({ block: 'start' }); }
        else if (b.dataset.act === 'cancel') { editing = null; draw(); }
        else if (b.dataset.act === 'delete') {
          const p = db.posts.find(x => x.id === b.dataset.id);
          T.modal.confirm({
            title: 'Delete this post?', tone: 'danger', confirmLabel: 'Delete post', message: '"' + p.title + '" will be removed. This cannot be undone.',
            onConfirm() { db.posts.splice(db.posts.indexOf(p), 1); T.actions.removed('Post', p.title); if (editing === p.id) editing = null; draw(); refreshTabs(); }
          });
        }
      });
      host.addEventListener('submit', e => {
        if (e.target.id !== 'bform') return;
        e.preventDefault();
        const status = (e.submitter && e.submitter.dataset.status) || 'published';
        const title = host.querySelector('#b-title').value.trim(), ed = body();
        const empty = !ed.textContent.trim();
        host.querySelector('#b-title').classList.toggle('is-invalid', !title); host.querySelector('#b-title-e').hidden = !!title;
        host.querySelector('#b-body-e').hidden = !empty;
        if (!title || empty) return;
        const data = { title, category: host.querySelector('#b-cat').value, status, body: clean(ed.innerHTML), date: Date.now() };
        if (editing) Object.assign(db.posts.find(x => x.id === editing), data);
        else db.posts.push(Object.assign({ id: 'b' + Date.now(), author: T.me().name }, data));
        if (status === 'published') T.actions.published('Blog', title);
        T.toast(status === 'published' ? 'Post published' : 'Draft saved', status === 'published' ? 'ok' : undefined);
        editing = null; draw(); refreshTabs();
      });
      draw();
    }
  };
})(window.TEIN = window.TEIN || {});
