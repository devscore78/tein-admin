/* Toast: short confirmation at the bottom of the screen */
(function (T) {
  'use strict';
  let region;
  T.toast = function (message, kind) {
    if (!region || !document.body.contains(region)) {
      region = document.createElement('div');
      region.className = 'toasts';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' is-' + kind : '');
    el.innerHTML = (kind === 'bad' ? T.icon('alert', 18) : T.icon('check', 18)) + '<span>' + T.ui.esc(message) + '</span>';
    region.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 260); }, 3400);
  };
})(window.TEIN = window.TEIN || {});
