/* Content: tab shell. Each tab lives in js/screens/content/*.js and registers itself in T.contentTabs. */
(function (T) {
  'use strict';
  const U = T.ui;
  const ORDER = ['events', 'blog', 'gallery', 'leadership', 'hero', 'strategy', 'programs', 'partners', 'about'];

  T.screens.content = {
    render(view) {
      const counts = () => ({ events: T.db.events.length, blog: T.db.posts.length, gallery: T.db.albums.length, leadership: T.db.leaders.length, hero: T.db.heroSlides.length, strategy: T.db.strategy.length, programs: T.db.programs.length, partners: T.db.partners.length, about: '' });
      view.innerHTML = U.pageHeader({
        eyebrow: 'Admin / Content', title: 'Public site content',
        desc: 'Everything visitors see on the public site: events, news, photos, leadership, the home page and the about page.'
      }) + '<div class="tab-bar"><div class="tabs" role="tablist" id="ctabs"></div></div><div id="cbody"></div>';
      let body = view.querySelector('#cbody');

      function tabs() {
        const c = counts();
        view.querySelector('#ctabs').innerHTML = ORDER.map(k =>
          '<button class="tab" type="button" role="tab" aria-selected="' + (T.state.contentTab === k) + '" data-tab="' + k + '">' + T.contentTabs[k].label + (c[k] !== '' ? ' <small>' + c[k] + '</small>' : '') + '</button>').join('');
      }
      function show() { tabs(); const fresh = body.cloneNode(false); body.replaceWith(fresh); body = fresh; /* new node each time so tab listeners never stack */ T.contentTabs[T.state.contentTab].render(body, tabs); }
      view.querySelector('#ctabs').addEventListener('click', e => {
        const b = e.target.closest('[data-tab]'); if (!b) return;
        T.state.contentTab = b.dataset.tab; show();
      });
      if (!T.contentTabs[T.state.contentTab]) T.state.contentTab = 'events';
      show();
    }
  };
})(window.TEIN = window.TEIN || {});
