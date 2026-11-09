/* Modal: dialog with scrim, Esc to close, focus return */
(function (T) {
  'use strict';
  const { esc } = T.ui;
  const stack = [];

  function open(o) {
    const prevFocus = document.activeElement;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML =
      '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">' +
      '<header class="modal-head"><div><h2 id="modal-title">' + esc(o.title) + '</h2>' + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>' +
      '<button class="btn-icon" type="button" data-close aria-label="Close">' + T.icon('x', 20) + '</button></header>' +
      '<div class="modal-body">' + o.body + '</div>' +
      (o.footer ? '<footer class="modal-foot">' + o.footer + '</footer>' : '') + '</div>';
    document.body.appendChild(scrim);
    document.documentElement.classList.add('is-locked');
    const el = scrim.querySelector('.modal');

    const ctrl = {
      el,
      close() {
        const i = stack.indexOf(ctrl); if (i < 0) return;
        stack.splice(i, 1);
        scrim.remove();
        document.removeEventListener('keydown', onKey);
        if (!stack.length) document.documentElement.classList.remove('is-locked');
        if (prevFocus && prevFocus.focus && document.body.contains(prevFocus)) prevFocus.focus();
        if (o.onClose) o.onClose();
      }
    };
    function onKey(e) { if (e.key === 'Escape' && stack[stack.length - 1] === ctrl) ctrl.close(); }
    scrim.addEventListener('mousedown', e => { if (e.target === scrim) ctrl.close(); });
    scrim.addEventListener('click', e => { if (e.target.closest('[data-close]')) ctrl.close(); });
    document.addEventListener('keydown', onKey);
    stack.push(ctrl);
    if (o.onMount) o.onMount(el, ctrl);
    const first = el.querySelector('input:not([type=hidden]):not([type=file]), textarea, select');
    (first || el).focus();
    return ctrl;
  }

  function confirm(o) {
    return open({
      title: o.title, size: 'sm',
      body: '<p style="color:var(--ink-2)">' + esc(o.message) + '</p>',
      footer: '<button class="btn btn-ghost" type="button" data-close>' + esc(o.cancelLabel || 'Cancel') + '</button>' +
        '<button class="btn ' + (o.tone === 'danger' ? 'btn-red' : 'btn-green') + '" type="button" data-ok>' + esc(o.confirmLabel || 'Confirm') + '</button>',
      onMount(el, ctrl) {
        el.querySelector('[data-ok]').addEventListener('click', () => { ctrl.close(); o.onConfirm(); });
        el.querySelector('[data-ok]').focus();
      }
    });
  }

  T.modal = { open, confirm };
})(window.TEIN = window.TEIN || {});
