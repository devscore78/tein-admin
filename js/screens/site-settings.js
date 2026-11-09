/* Site settings: registration switch, closed message, dues */
(function (T) {
  'use strict';
  const U = T.ui, { esc } = U;
  const YEARS = ['2025/26', '2026/27', '2027/28'];

  T.screens['site-settings'] = {
    render(view) {
      const s = T.db.settings;
      let savedMsg = s.closedMessage;

      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Site settings', title: 'Site settings',
        desc: 'Control sign-ups and dues for the public site. Registration changes apply immediately.'
      }) + '<section class="card settings">' +

        '<div class="setting"><div><h3>Registration</h3><p class="desc">Turn sign-ups on or off. When off, visitors see the message below instead of the form.</p></div>' +
        '<div class="ctl"><div class="big-toggle">' + U.toggle('st-reg', s.registrationOpen, '', true) +
        '<div><h4 id="st-reg-h" class="' + (s.registrationOpen ? 'on' : 'off') + '">' + (s.registrationOpen ? 'Open' : 'Closed') + '</h4><p id="st-reg-p">' + (s.registrationOpen ? 'New students can register now.' : 'The sign-up form is hidden.') + '</p></div></div></div></div>' +

        '<div class="setting"><div><h3>Closed message</h3><p class="desc">Shown on the public site while registration is closed. Keep it short and say when to come back.</p></div>' +
        '<div class="ctl"><div class="field"><label class="label" for="st-msg">Message</label><textarea class="textarea" id="st-msg" maxlength="240">' + esc(s.closedMessage) + '</textarea><div class="counter" id="st-count"></div></div>' +
        '<div><span class="label">How visitors see it</span><div class="site-preview" style="margin-top:6px"><div class="bar"><i></i><i></i><i></i></div><div class="page"><h4>Membership registration</h4><p id="st-prev"></p><button class="btn btn-soft btn-sm" type="button" disabled>Registration closed</button></div></div></div>' +
        '<div class="save-row"><button class="btn btn-green" type="button" id="st-save-msg" disabled>Save message</button><span class="dirty" id="st-dirty" hidden>Unsaved changes</span></div></div></div>' +

        '<div class="setting"><div><h3>Contact details</h3><p class="desc">Shown in the footer and on the Contact page.</p></div><div class="ctl"><div class="form-grid">' +
        '<div class="field span-2"><label class="label" for="ct-addr">Address</label><input class="input" id="ct-addr" value="' + esc(s.address) + '"></div>' +
        '<div class="field"><label class="label" for="ct-mail">Email</label><input class="input" id="ct-mail" type="email" value="' + esc(s.email) + '"></div>' +
        '<div class="field"><label class="label" for="ct-tel">Phone</label><input class="input" id="ct-tel" value="' + esc(s.phone) + '"></div></div>' +
        '<div class="save-row"><button class="btn btn-green" type="button" id="st-save-contact">Save contact details</button></div></div></div>' +

        '<div class="setting"><div><h3>Social links</h3><p class="desc">Icons appear in the footer for every link you fill in. Leave blank to hide one.</p></div><div class="ctl"><div class="form-grid">' +
        [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['x', 'X (Twitter)'], ['youtube', 'YouTube'], ['whatsapp', 'WhatsApp link']].map(a => '<div class="field"><label class="label" for="sc-' + a[0] + '">' + a[1] + '</label><input class="input" id="sc-' + a[0] + '" type="url" placeholder="https://" value="' + esc(s[a[0]]) + '"></div>').join('') + '</div>' +
        '<div class="save-row"><button class="btn btn-green" type="button" id="st-save-social">Save social links</button></div></div></div>' +

        '<div class="setting"><div><h3>Dues</h3><p class="desc">The amount members pay each academic year. Payments already recorded keep their original amount.</p></div>' +
        '<div class="ctl"><div class="form-grid"><div class="field"><label class="label" for="st-dues">Dues amount</label><div class="input-prefix"><span>GHS</span><input class="input" id="st-dues" type="number" min="1" step="0.01" value="' + s.dues + '"></div><div class="field-error" id="st-dues-e" hidden>Enter an amount greater than zero.</div></div>' +
        '<div class="field"><label class="label" for="st-year">Academic year</label>' + U.select('st-year', YEARS, s.academicYear) + '</div></div>' +
        '<div class="save-row"><button class="btn btn-green" type="button" id="st-save-dues">Update dues</button></div></div></div></section>';

      /* registration */
      view.querySelector('#st-reg').addEventListener('change', e => {
        const on = e.target.checked; T.actions.setRegistration(on);
        const h = view.querySelector('#st-reg-h'); h.textContent = on ? 'Open' : 'Closed'; h.className = on ? 'on' : 'off';
        view.querySelector('#st-reg-p').textContent = on ? 'New students can register now.' : 'The sign-up form is hidden.';
      });

      /* message */
      const ta = view.querySelector('#st-msg'), prev = view.querySelector('#st-prev'), count = view.querySelector('#st-count');
      const btn = view.querySelector('#st-save-msg'), dirty = view.querySelector('#st-dirty');
      const sync = () => {
        prev.textContent = ta.value.trim() || 'Registration is currently closed.';
        count.textContent = ta.value.length + ' / 240';
        const d = ta.value.trim() !== savedMsg && ta.value.trim().length > 0;
        btn.disabled = !d; dirty.hidden = !d;
      };
      ta.addEventListener('input', sync); sync();
      btn.addEventListener('click', () => { savedMsg = ta.value.trim(); T.actions.saveMessage(savedMsg); sync(); });

      /* contact + social */
      view.querySelector('#st-save-contact').addEventListener('click', () => {
        s.address = view.querySelector('#ct-addr').value.trim(); s.email = view.querySelector('#ct-mail').value.trim(); s.phone = view.querySelector('#ct-tel').value.trim();
        T.db.log('setting.contact', 'Updated contact details'); T.toast('Contact details saved', 'ok');
      });
      view.querySelector('#st-save-social').addEventListener('click', () => {
        ['facebook', 'instagram', 'x', 'youtube', 'whatsapp'].forEach(k => { s[k] = view.querySelector('#sc-' + k).value.trim(); });
        T.db.log('setting.social', 'Updated social links'); T.toast('Social links saved', 'ok');
      });

      /* dues */
      view.querySelector('#st-save-dues').addEventListener('click', () => {
        const input = view.querySelector('#st-dues'), err = view.querySelector('#st-dues-e');
        const amt = parseFloat(input.value), year = view.querySelector('#st-year').value;
        if (!(amt > 0)) { input.classList.add('is-invalid'); err.hidden = false; return; }
        input.classList.remove('is-invalid'); err.hidden = true;
        if (amt === s.dues && year === s.academicYear) { T.toast('Nothing to update'); return; }
        T.modal.confirm({
          title: 'Update dues?', confirmLabel: 'Update dues',
          message: 'New payments for ' + year + ' will be ' + U.money(amt) + (amt !== s.dues ? ' instead of ' + U.money(s.dues) : '') + '. Payments already recorded stay as they are.',
          onConfirm() { T.actions.setDues(amt, year); }
        });
      });
    }
  };
})(window.TEIN = window.TEIN || {});
