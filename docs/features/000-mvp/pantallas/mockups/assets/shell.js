/* Shell de los mockups: iconos, navegación, overlays y pequeñas interacciones.
   Solo existe para que el prototipo sea navegable; NO es código de producción. */
(function () {
  var P = new URLSearchParams(location.search);
  var root = document.documentElement;

  /* tema: ?theme=dark|light (si no, el del sistema) */
  var theme = P.get('theme');
  if (theme) root.setAttribute('data-theme', theme);
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');

  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    cards: '<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>',
    deck: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    'chev-l': '<path d="m15 18-6-6 6-6"/>',
    'chev-r': '<path d="m9 18 6-6-6-6"/>',
    'chev-d': '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    flip: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    play: '<path d="m6 4 14 8-14 8Z"/>',
    'arrow-l': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-r': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'arrow-up': '<path d="m18 15-6-6-6 6"/>',
    'arrow-down': '<path d="m6 9 6 6 6-6"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    'list-check': '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    wifioff: '<path d="M2 2l20 20"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M13.8 10.2A10 10 0 0 1 19 12.9"/><path d="M2 8.8a15 15 0 0 1 4.2-2.5"/><path d="M10.7 5.1A15 15 0 0 1 22 8.8"/><path d="M12 20h.01"/>'
  };
  var GOOGLE = '<svg class="ic lg" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.3v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"/></svg>';

  function icons(scope) {
    (scope || document).querySelectorAll('i[data-i]').forEach(function (el) {
      var n = el.getAttribute('data-i');
      var cls = 'ic ' + (el.getAttribute('data-s') || '');
      if (n === 'google') { el.outerHTML = GOOGLE; return; }
      var svg = '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[n] || '') + '</svg>';
      el.outerHTML = svg;
    });
  }

  /* ---- navegación (sidebar desktop + bottom nav mobile) ---- */
  function qs(href) { return href + (theme ? (href.indexOf('?') > -1 ? '&' : '?') + 'theme=' + theme : ''); }
  function buildNav() {
    var b = document.body, shell = b.getAttribute('data-shell');
    if (shell !== 'app') return;
    var a = b.getAttribute('data-active');
    var cur = function (k) { return a === k ? ' aria-current="page"' : ''; };
    var side = '<aside class="sidebar" aria-label="Navegación principal">' +
      '<div class="brand"><span class="brand-mark han" aria-hidden="true">汉</span>Hanzi Master</div>' +
      '<nav class="side-nav"><a href="f01-flashcards.html"' + cur('flashcards') + '><i data-i="cards"></i>Flashcards</a>' +
      '<a href="m01-mazos.html"' + cur('mazos') + '><i data-i="deck"></i>Mazos</a></nav>' +
      '<div class="side-sep"></div><div class="side-label">Configuración</div>' +
      '<nav class="side-nav"><a class="secondary" href="i01-idiomas.html"' + cur('idiomas') + '><i data-i="languages"></i>Idiomas</a></nav>' +
      '<div class="side-user"><span class="avatar" aria-hidden="true">MM</span><div class="grow"><div class="small" style="font-weight:600">Mariano M.</div><div class="xs muted" style="overflow:hidden;text-overflow:ellipsis">mmondani89@gmail.com</div></div>' +
      '<a class="icon-btn" href="a01-login.html" aria-label="Cerrar sesión"><i data-i="logout"></i></a></div></aside>';
    var bottom = '<nav class="bottom-nav" aria-label="Navegación principal">' +
      '<a href="f01-flashcards.html"' + cur('flashcards') + '><span class="pill"><i data-i="cards"></i></span>Flashcards</a>' +
      '<a href="m01-mazos.html"' + cur('mazos') + '><span class="pill"><i data-i="deck"></i></span>Mazos</a>' +
      '<a href="g01-mas.html"' + ((a === 'mas' || a === 'idiomas') ? ' aria-current="page"' : '') + '><span class="pill"><i data-i="more"></i></span>Más</a></nav>';
    b.insertAdjacentHTML('afterbegin', side);
    if (b.getAttribute('data-nav') === 'push') b.classList.add('push'); /* pantallas hijas: sin bottom nav en mobile */
    else b.insertAdjacentHTML('beforeend', bottom);
    var main = b.querySelector('main'); if (main) main.classList.add('app-main');
  }

  /* ---- selector de idioma ---- */
  function buildLang() {
    document.querySelectorAll('[data-lang-selector]').forEach(function (el) {
      el.innerHTML = '<div class="anchor"><button class="lang-chip" aria-haspopup="listbox" aria-expanded="false" data-pop="#lang-pop">' +
        '<span class="flag han" aria-hidden="true">中</span><span>Chino mandarín</span><i data-i="chev-d" data-s="sm"></i></button>' +
        '<div class="popover" id="lang-pop" role="listbox" aria-label="Idioma de estudio" hidden>' +
        '<button class="opt-row" role="option" aria-checked="true"><span class="flag han lang-chip-flag" style="width:28px;height:28px;border-radius:50%;background:var(--primary-soft);display:grid;place-items:center">中</span>Chino mandarín<i data-i="check" style="margin-left:auto"></i></button>' +
        '<button class="opt-row" role="option" aria-checked="false"><span style="width:28px;height:28px;border-radius:50%;background:var(--surface-2);display:grid;place-items:center;font-family:var(--font-cjk)">日</span>Japonés</button>' +
        '<div class="sep" style="margin:6px 0"></div>' +
        '<a class="opt-row muted" href="i01-idiomas.html"><i data-i="sliders"></i>Administrar idiomas</a></div></div>';
    });
  }

  /* ---- overlays / popovers / tabs ---- */
  function openOverlay(id) {
    var o = document.getElementById(id); if (!o) return;
    o.classList.add('open');
    var f = o.querySelector('input,select,textarea,button:not([data-close])'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeOverlays() { document.querySelectorAll('.overlay.open').forEach(function (o) { o.classList.remove('open'); }); }
  function wire() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open]');
      if (t) { e.preventDefault(); openOverlay(t.getAttribute('data-open').replace('#', '')); return; }
      if (e.target.closest('[data-close]')) { e.preventDefault(); closeOverlays(); return; }
      if (e.target.classList && e.target.classList.contains('overlay')) { closeOverlays(); return; }
      var p = e.target.closest('[data-pop]');
      document.querySelectorAll('.popover').forEach(function (pop) {
        var mine = p && document.querySelector(p.getAttribute('data-pop')) === pop;
        if (mine) { pop.hidden = !pop.hidden; p.setAttribute('aria-expanded', String(!pop.hidden)); }
        else if (!pop.contains(e.target)) pop.hidden = true;
      });
      var tab = e.target.closest('[role=tab]');
      if (tab) {
        var list = tab.parentElement;
        list.querySelectorAll('[role=tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === tab)); });
        document.querySelectorAll('[data-panel]').forEach(function (pn) { pn.hidden = pn.getAttribute('data-panel') !== tab.getAttribute('data-tab'); });
      }
      var seg = e.target.closest('.seg [aria-pressed]');
      if (seg) { seg.parentElement.querySelectorAll('[aria-pressed]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === seg)); }); }
      var chip = e.target.closest('.chip.button[aria-pressed]');
      if (chip) chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeOverlays(); document.querySelectorAll('.popover').forEach(function (p) { p.hidden = true; }); }
    });
    /* selección múltiple de la lista de flashcards */
    document.addEventListener('click', function (e) {
      var it = e.target.closest('[data-selectable] .item');
      var list = e.target.closest('[data-selectable]');
      if (!it || !list || !list.classList.contains('select-mode')) return;
      e.preventDefault();
      it.classList.toggle('selected');
      it.setAttribute('aria-selected', String(it.classList.contains('selected')));
      var n = list.querySelectorAll('.item.selected').length;
      document.querySelectorAll('[data-selected-count]').forEach(function (c) { c.textContent = n; });
    });
  }

  /* ---- aviso global sin conexión: ?offline=1 (demo del aviso dentro de la app) ---- */
  if (P.get('offline')) {
    var ob = document.createElement('div');
    ob.className = 'alert warn';
    ob.setAttribute('role', 'status');
    ob.style.cssText = 'border-radius:0;justify-content:center;position:sticky;top:0;z-index:50';
    ob.innerHTML = '<i data-i="wifioff"></i><div><strong>Sin conexión.</strong> Puedes seguir estudiando; los cambios se guardarán al volver la red.</div>';
    document.body.insertBefore(ob, document.body.firstChild);
    if (window.HM && HM.icons) HM.icons(ob);
  }

  /* ---- estados por URL: ?view=empty|error|loading, ?open=id ---- */
  function applyState() {
    var view = P.get('view') || 'default';
    document.querySelectorAll('[data-show]').forEach(function (el) {
      el.hidden = el.getAttribute('data-show').split(' ').indexOf(view) === -1;
    });
    var open = P.get('open'); if (open) openOverlay(open);
  }

  /* ---- propagar ?theme en los links internos ---- */
  function propagate() {
    if (!theme) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|#|mailto:)/.test(h)) return;
      a.setAttribute('href', qs(h));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildNav(); buildLang(); icons(); wire(); applyState(); propagate();
    document.dispatchEvent(new Event('shell-ready'));
  });
  window.HM = { icons: icons, openOverlay: openOverlay, closeOverlays: closeOverlays, params: P };
})();
