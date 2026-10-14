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

  /* úvodný slider – taby s produktmi, automatické prepínanie s pauzou (WCAG 2.2.2) */
  var hs = $('[data-hs]');
  if (hs) {
    var hsSlides = $$('[data-hs-slide]', hs);
    var hsTabs = $$('[data-hs-tab]', hs);
    var hsToggle = $('[data-hs-toggle]', hs);
    var hsLive = $('[data-hs-slides]', hs);
    var hsCur = 0;
    var hsGo = function (i, focusTab) {
      hsCur = (i + hsSlides.length) % hsSlides.length;
      hsSlides.forEach(function (s, k) { s.classList.toggle('is-active', k === hsCur); });
      hsTabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', String(k === hsCur));
        t.tabIndex = k === hsCur ? 0 : -1;
      });
      if (focusTab) hsTabs[hsCur].focus();
    };
    var hsPlay = function (on) {
      hs.classList.remove('is-playing');
      if (on) { void hs.offsetWidth; hs.classList.add('is-playing'); }
      hs.classList.toggle('is-stopped', !on);
      hsLive.setAttribute('aria-live', on ? 'off' : 'polite');
      hsToggle.setAttribute('aria-label', on ? 'Pozastaviť prepínanie' : 'Spustiť prepínanie');
    };
    hsTabs.forEach(function (t, k) {
      t.addEventListener('click', function () { hsPlay(false); hsGo(k); });
      t.addEventListener('keydown', function (e) {
        var to = { ArrowRight: hsCur + 1, ArrowLeft: hsCur - 1, Home: 0, End: hsSlides.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault(); hsPlay(false); hsGo(to, true);
      });
      $('.p', t).addEventListener('animationend', function () {
        if (k === hsCur && hs.classList.contains('is-playing')) hsGo(hsCur + 1);
      });
    });
    hsToggle.addEventListener('click', function () { hsPlay(!hs.classList.contains('is-playing')); });
    hs.addEventListener('mouseenter', function () { hs.classList.add('is-hold'); });
    hs.addEventListener('mouseleave', function () { hs.classList.remove('is-hold'); });
    hs.addEventListener('focusin', function (e) { if (e.target !== hsToggle) hsPlay(false); });
    var hx = null, hy = null;
    hsLive.addEventListener('touchstart', function (e) { hx = e.touches[0].clientX; hy = e.touches[0].clientY; }, { passive: true });
    hsLive.addEventListener('touchend', function (e) {
      if (hx === null) return;
      var dx = e.changedTouches[0].clientX - hx, dy = e.changedTouches[0].clientY - hy; hx = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      hsPlay(false); hsGo(hsCur + (dx < 0 ? 1 : -1));
    });
    hsPlay(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

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

  /* lepivá lišta na mobile – vždy, keď hlavné tlačidlo nie je na obrazovke (aj pred ním), aby bol košík pod palcom */
  var sticky = $('[data-sticky]');
  var cta = $('[data-buy-cta]');
  if (sticky && cta && 'IntersectionObserver' in window) {
    var stickyBtn = $('button', sticky);
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      var past = !e.isIntersecting;
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
})();
