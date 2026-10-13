/* Fabulous Beauty – návrh redizajnu: len správanie UI, nič sa nikam neodosiela. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* mobilné menu */
  var menu = $('#menu');
  var opener = $('[data-menu-open]');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('open', open);
    if (opener) opener.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var c = $('[data-menu-close]', menu); if (c) c.focus(); } else if (opener) opener.focus();
  }
  if (opener) opener.addEventListener('click', function () { setMenu(true); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && menu.classList.contains('open')) setMenu(false); });

  /* košík – len ukážka spätnej väzby */
  var count = 0;
  var toast = $('[data-toast]');
  var toastTimer;
  var qty = 1;
  function addToCart(name, n) {
    count += n;
    $$('[data-cart-count]').forEach(function (el) { el.textContent = count; });
    $$('[data-cart-link]').forEach(function (el) { el.setAttribute('aria-label', 'Košík, ' + count + ' ' + (count === 1 ? 'produkt' : count < 5 ? 'produkty' : 'produktov')); });
    if (!toast) return;
    toast.innerHTML = '';
    var t = document.createElement('span');
    t.textContent = name + (n > 1 ? ' (' + n + ' ks)' : '') + ' je v košíku.';
    var a = document.createElement('a');
    a.href = '#'; a.textContent = 'Zobraziť košík';
    toast.appendChild(t); toast.appendChild(a);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 6000);
  }
  $$('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      var isMain = b.closest('[data-buy-cta]') || b.closest('[data-sticky]');
      addToCart(b.getAttribute('data-add'), isMain ? qty : 1);
      var label = b.textContent;
      b.textContent = '✓ Pridané';
      setTimeout(function () { b.textContent = label; }, 1600);
    });
  });

  /* množstvo */
  var qOut = $('[data-qty-out]');
  $$('[data-qty]').forEach(function (b) {
    b.addEventListener('click', function () {
      qty = Math.min(9, Math.max(1, qty + Number(b.getAttribute('data-qty'))));
      if (qOut) qOut.textContent = qty;
    });
  });

  /* rituál ráno / večer na homepage */
  var ritualText = $('[data-ritual-text]');
  var texts = {
    all: 'Štyri produkty, ktoré do seba zapadajú. Vyberte si, kedy sa o pleť staráte.',
    day: 'Ráno pleť hydratujte a chráňte pred vonkajšími vplyvmi.',
    night: 'Večer je čas na regeneráciu – pleť sa obnovuje, kým spíte.'
  };
  $$('[data-ritual]').forEach(function (b) {
    b.addEventListener('click', function () {
      var mode = b.getAttribute('data-ritual');
      $$('[data-ritual]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('.shelf .pcard[data-when]').forEach(function (card) {
        var w = card.getAttribute('data-when');
        card.classList.toggle('is-dim', mode !== 'all' && w !== mode && w !== 'both');
      });
      if (ritualText) ritualText.textContent = texts[mode];
    });
  });

  /* galéria */
  var main = $('[data-main]');
  var counter = $('[data-count]');
  var thumbs = $$('.gallery__thumbs button');
  function show(i) {
    var b = thumbs[i];
    if (!b || !main) return;
    thumbs.forEach(function (t) { t.setAttribute('aria-current', String(t === b)); });
    main.src = b.getAttribute('data-src');
    main.alt = b.getAttribute('data-alt');
    main.style.objectPosition = b.getAttribute('data-pos') || '50% 50%';
    if (counter) counter.textContent = (i + 1) + ' / ' + thumbs.length;
  }
  thumbs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
  if (main) {
    var sx = null;
    main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) < 40) return;
      var cur = thumbs.findIndex(function (t) { return t.getAttribute('aria-current') === 'true'; });
      show((cur + (dx < 0 ? 1 : -1) + thumbs.length) % thumbs.length);
    });
  }

  /* lepivá lišta na mobile – keď hlavné tlačidlo zmizne z obrazovky */
  var sticky = $('[data-sticky]');
  var cta = $('[data-buy-cta]');
  if (sticky && cta && 'IntersectionObserver' in window) {
    var stickyBtn = $('button', sticky);
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      var past = !e.isIntersecting && e.boundingClientRect.top < 0;
      sticky.classList.toggle('show', past);
      sticky.setAttribute('aria-hidden', String(!past));
      if (stickyBtn) stickyBtn.tabIndex = past ? 0 : -1;
    }).observe(cta);
  }

  /* recenzie – filtre */
  var reviews = $$('.review');
  var empty = $('[data-empty]');
  var state = { filter: 'all', stars: null };
  function applyReviews() {
    var visible = 0;
    reviews.forEach(function (r) {
      var tags = (r.getAttribute('data-tags') || '').split(' ');
      var ok = (state.filter === 'all' || tags.indexOf(state.filter) >= 0) && (!state.stars || r.getAttribute('data-stars') === state.stars);
      r.hidden = !ok;
      if (ok) visible++;
    });
    if (empty) empty.hidden = visible > 0;
  }
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.filter = b.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      applyReviews();
    });
  });
  $$('[data-stars]').forEach(function (b) {
    if (b.tagName !== 'BUTTON') return;
    b.addEventListener('click', function () {
      var s = b.getAttribute('data-stars');
      state.stars = state.stars === s ? null : s;
      $$('button[data-stars]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-stars') === state.stars)); });
      applyReviews();
    });
  });

  /* poznámky k návrhu */
  $$('[data-notes-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = document.body.classList.toggle('notes');
      $$('[data-notes-toggle]').forEach(function (x) {
        if (x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed', String(on));
        if (x.closest('.demo-bar')) x.textContent = on ? 'Skryť poznámky k návrhu' : 'Zobraziť poznámky k návrhu';
      });
    });
  });
})();
