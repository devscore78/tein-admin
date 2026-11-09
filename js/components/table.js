/* DataTable: sortable columns, row selection, pagination.
   T.table(host, { columns, getRows, pageSize, selectable, rowKey, empty, note, onSelect }) */
(function (T) {
  'use strict';
  const I = T.icon, { esc } = T.ui;

  T.table = function (host, o) {
    const st = { page: 1, sort: o.sort || null, sel: new Set() };
    const size = o.pageSize || 12;
    const key = o.rowKey || 'id';
    const cols = o.columns;

    function rows() {
      const r = o.getRows().slice();
      if (st.sort) {
        const c = cols.find(c => c.key === st.sort.key);
        if (c) {
          const f = c.sortVal || (x => x[c.key]), d = st.sort.dir;
          r.sort((a, b) => { const A = f(a), B = f(b); return (A > B ? 1 : A < B ? -1 : 0) * d; });
        }
      }
      return r;
    }
    function pageNumbers(cur, total) {
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const out = [1];
      if (cur > 3) out.push('…');
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) out.push(i);
      if (cur < total - 2) out.push('…');
      out.push(total);
      return out;
    }

    function render() {
      const all = rows(), total = all.length, pages = Math.max(1, Math.ceil(total / size));
      if (st.page > pages) st.page = pages;
      const start = (st.page - 1) * size, slice = all.slice(start, start + size);
      if (!total) {
        host.innerHTML = o.empty || T.ui.empty('search', 'Nothing here', 'No records match these filters.');
        return;
      }
      const head = (o.selectable ? '<th class="sel"><label class="check"><input type="checkbox" data-sel="all" aria-label="Select all on this page"></label></th>' : '') +
        cols.map(c => {
          const cls = c.align === 'right' ? ' class="right"' : '';
          if (!c.sortable) return '<th' + cls + '>' + esc(c.label) + '</th>';
          const on = st.sort && st.sort.key === c.key;
          return '<th' + cls + ' aria-sort="' + (on ? (st.sort.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button class="th-sort' + (on ? ' is-on' : '') + '" type="button" data-sort="' + c.key + '">' +
            esc(c.label) + I(on && st.sort.dir < 0 ? 'sortDown' : 'sortUp', 14) + '</button></th>';
        }).join('');
      const body = slice.map(r => {
        const id = r[key];
        return '<tr data-id="' + esc(id) + '"' + (st.sel.has(id) ? ' class="is-selected"' : '') + '>' +
          (o.selectable ? '<td class="sel"><label class="check"><input type="checkbox" data-sel="' + esc(id) + '"' + (st.sel.has(id) ? ' checked' : '') + ' aria-label="Select row"></label></td>' : '') +
          cols.map(c => '<td' + (c.align === 'right' ? ' class="right"' : '') + (c.nowrap ? ' style="white-space:nowrap"' : '') + '>' + c.render(r) + '</td>').join('') + '</tr>';
      }).join('');
      const nums = pageNumbers(st.page, pages).map(n => n === '…' ? '<span class="gap">…</span>' :
        '<button type="button" data-page="' + n + '"' + (n === st.page ? ' class="is-current" aria-current="page"' : '') + '>' + n + '</button>').join('');
      host.innerHTML =
        '<div class="table-wrap"><table class="t"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
        '<div class="table-foot"><span class="num">Showing ' + T.ui.num(start + 1) + '–' + T.ui.num(start + slice.length) + ' of ' + T.ui.num(total) + '</span>' +
        '<div class="pager"><button type="button" data-page="prev" aria-label="Previous page"' + (st.page === 1 ? ' disabled' : '') + '>' + I('chevL', 16) + '</button>' + nums +
        '<button type="button" data-page="next" aria-label="Next page"' + (st.page === pages ? ' disabled' : '') + '>' + I('chevR', 16) + '</button></div></div>' +
        (o.note ? '<p class="foot-note">' + esc(o.note) + '</p>' : '');
      syncHeader();
    }

    function pageIds() { return Array.from(host.querySelectorAll('tbody tr[data-id]')).map(tr => tr.dataset.id); }
    function syncHeader() {
      const all = host.querySelector('[data-sel="all"]'); if (!all) return;
      const ids = pageIds(), n = ids.filter(id => st.sel.has(id)).length;
      all.checked = n > 0 && n === ids.length;
      all.indeterminate = n > 0 && n < ids.length;
    }
    function notify() { if (o.onSelect) o.onSelect(Array.from(st.sel)); }

    host.addEventListener('click', e => {
      const s = e.target.closest('[data-sort]');
      if (s) {
        const k = s.dataset.sort;
        st.sort = st.sort && st.sort.key === k ? { key: k, dir: -st.sort.dir } : { key: k, dir: 1 };
        render(); return;
      }
      const p = e.target.closest('[data-page]');
      if (p) {
        const v = p.dataset.page;
        st.page = v === 'prev' ? st.page - 1 : v === 'next' ? st.page + 1 : +v;
        render();
      }
    });
    host.addEventListener('change', e => {
      const c = e.target.closest('[data-sel]'); if (!c) return;
      const id = c.dataset.sel;
      if (id === 'all') pageIds().forEach(x => c.checked ? st.sel.add(x) : st.sel.delete(x));
      else if (c.checked) st.sel.add(id); else st.sel.delete(id);
      host.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        const on = st.sel.has(tr.dataset.id);
        tr.classList.toggle('is-selected', on);
        const box = tr.querySelector('[data-sel]'); if (box) box.checked = on;
      });
      syncHeader(); notify();
    });

    render();
    return {
      render,
      resetPage() { st.page = 1; render(); },
      selected: () => Array.from(st.sel),
      clear() { st.sel.clear(); render(); notify(); }
    };
  };
})(window.TEIN = window.TEIN || {});
