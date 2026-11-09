/* Sub-admins: who can sign in, what they can touch. Main admin only. */
(function (T) {
  'use strict';
  const U = T.ui, I = T.icon, { esc } = U;

  function accessChips(a) {
    const names = T.db.AREAS.filter(x => a.perms[x.id]).map(x => x.label);
    return names.length ? '<div class="chips">' + names.map(n => '<span class="chip">' + n + '</span>').join('') + '</div>' : '<span class="muted">No access yet</span>';
  }

  T.screens['sub-admins'] = {
    mainOnly: true,
    render(view) {
      const db = T.db;
      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Access', title: 'Sub-admins',
        desc: 'Give officers access to only the areas they need. Every action they take is written to the audit log.',
        actions: '<button class="btn btn-green" type="button" data-act="invite">' + I('userPlus', 16) + 'Invite sub-admin</button>'
      }) + '<section class="card"><div id="atable"></div></section>';

      const table = T.table(view.querySelector('#atable'), {
        pageSize: 20, getRows: () => db.admins,
        columns: [
          { key: 'name', label: 'Admin', render: a => '<div class="cell-person">' + U.avatar(a.name, 34) + '<div><b>' + esc(a.name) + '</b><small>' + esc(a.email) + '</small></div></div>' },
          { key: 'role', label: 'Role', render: a => esc(a.role) },
          { key: 'perms', label: 'Access', render: accessChips },
          { key: 'status', label: 'Status', render: a => U.status.admin(a.status) },
          { key: 'last', label: 'Last active', nowrap: true, render: a => '<span class="muted">' + (a.last ? U.rel(a.last) : 'Not yet') + '</span>' },
          {
            key: 'a', label: '', align: 'right', render: a => '<div class="row-actions"><button class="btn btn-white btn-sm" type="button" data-act="edit" data-id="' + a.id + '">Edit access</button>' +
              (a.status === 'active' ? '<button class="btn btn-outline-red btn-sm" type="button" data-act="suspend" data-id="' + a.id + '">Suspend</button>' : '') +
              (a.status === 'suspended' ? '<button class="btn btn-outline btn-sm" type="button" data-act="reinstate" data-id="' + a.id + '">Reinstate</button>' : '') +
              (a.status === 'invited' ? '<button class="btn btn-outline btn-sm" type="button" data-act="resend" data-id="' + a.id + '">Resend invite</button>' : '') +
              '<button class="btn-icon is-danger" type="button" data-act="remove" data-id="' + a.id + '" aria-label="Remove ' + esc(a.name) + '">' + I('trash', 17) + '</button></div>'
          }
        ]
      });

      function form(a) {
        const roles = Object.keys(db.ROLES);
        T.modal.open({
          title: a ? 'Edit access' : 'Invite sub-admin', subtitle: a ? a.name : 'They get an email with a link to set a password',
          body: '<form id="aform" class="form-stack" novalidate>' +
            (a ? '' : '<div class="form-grid"><div class="field"><label class="label" for="a-name">Full name</label><input class="input" id="a-name"><div class="field-error" id="a-name-e" hidden>Enter a name.</div></div>' +
              '<div class="field"><label class="label" for="a-email">Email</label><input class="input" id="a-email" type="email" placeholder="name@example.org"><div class="field-error" id="a-email-e" hidden>Enter a valid email address.</div></div></div>') +
            '<div class="field"><label class="label" for="a-role">Role</label>' + U.select('a-role', roles, a ? a.role : roles[0]) + '<div class="hint">Picking a role ticks the usual access. You can adjust it below.</div></div>' +
            '<div class="field"><span class="label">Access</span><div class="perm-list">' + db.AREAS.map(x =>
              '<label class="perm"><span class="check"><input type="checkbox" data-perm="' + x.id + '"></span><span><b>' + x.label + '</b><small>' + x.desc + '</small></span></label>').join('') + '</div></div></form>',
          footer: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-green" type="button" id="a-save">' + (a ? 'Save access' : 'Send invite') + '</button>',
          onMount(el, ctrl) {
            const role = el.querySelector('#a-role');
            const setPerms = p => el.querySelectorAll('[data-perm]').forEach(c => { c.checked = !!p[c.dataset.perm]; });
            setPerms(a ? a.perms : db.ROLES[role.value]);
            role.addEventListener('change', () => { if (role.value !== 'Custom') setPerms(db.ROLES[role.value]); });
            el.querySelectorAll('[data-perm]').forEach(c => c.addEventListener('change', () => { role.value = 'Custom'; }));
            const read = () => { const p = {}; el.querySelectorAll('[data-perm]').forEach(c => { if (c.checked) p[c.dataset.perm] = 1; }); return p; };
            const save = () => {
              if (a) {
                a.role = role.value; a.perms = read();
                db.log('admin.update', a.name + ' · ' + a.role); T.toast('Access updated for ' + a.name, 'ok');
              } else {
                const name = el.querySelector('#a-name').value.trim(), email = el.querySelector('#a-email').value.trim();
                const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
                el.querySelector('#a-name').classList.toggle('is-invalid', !name); el.querySelector('#a-name-e').hidden = !!name;
                el.querySelector('#a-email').classList.toggle('is-invalid', !okEmail); el.querySelector('#a-email-e').hidden = okEmail;
                if (!name || !okEmail) return;
                db.admins.push({ id: 'a' + Date.now(), name, email, role: role.value, perms: read(), status: 'invited', last: null });
                db.log('admin.invite', name); T.toast('Invite sent to ' + email, 'ok');
              }
              ctrl.close(); table.render();
            };
            el.querySelector('#a-save').addEventListener('click', save);
            el.querySelector('#aform').addEventListener('submit', e => { e.preventDefault(); save(); });
          }
        });
      }

      view.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const act = b.dataset.act, a = db.admins.find(x => x.id === b.dataset.id);
        if (act === 'invite') form(null);
        else if (act === 'edit') form(a);
        else if (act === 'suspend') T.modal.confirm({
          title: 'Suspend ' + a.name + '?', tone: 'danger', confirmLabel: 'Suspend', message: 'They will be signed out and cannot sign in until you reinstate them.',
          onConfirm() { a.status = 'suspended'; db.log('admin.suspend', a.name); T.toast(a.name + ' suspended'); table.render(); }
        });
        else if (act === 'reinstate') { a.status = 'active'; db.log('admin.update', a.name + ' reinstated'); T.toast(a.name + ' reinstated', 'ok'); table.render(); }
        else if (act === 'resend') T.toast('Invite sent again to ' + a.email, 'ok');
        else if (act === 'remove') T.modal.confirm({
          title: 'Remove ' + a.name + '?', tone: 'danger', confirmLabel: 'Remove sub-admin', message: 'They lose all access. Their past actions stay in the audit log.',
          onConfirm() { db.admins.splice(db.admins.indexOf(a), 1); db.log('admin.remove', a.name); T.toast(a.name + ' removed'); table.render(); }
        });
      });
    }
  };
})(window.TEIN = window.TEIN || {});
