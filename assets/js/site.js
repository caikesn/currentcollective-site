/* Current Collective — shared behaviour */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;

  // Smooth scrolling (desktop, motion allowed)
  var lenis = null;
  if (!reduce && fine && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -90 }); }
      });
    });
  }

  // Nav: frosted background once scrolled, mobile menu
  var nav = document.querySelector('nav.top');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    var mb = nav.querySelector('.menu-btn');
    if (mb) mb.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mb.setAttribute('aria-expanded', open);
    });
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
    // Backup: reveal anything already on screen, in case the observer is slow on a busy page
    var sweep = function () { var vh = innerHeight; els.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in'); }); };
    var st = 0; addEventListener('scroll', function () { if (!st) st = setTimeout(function () { st = 0; sweep(); }, 120); }, { passive: true });
    setTimeout(sweep, 1500);
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Layered hero: layers move at different speeds on scroll, drift with the mouse
  var scene = document.querySelector('[data-scene]');
  if (scene && !reduce) {
    var layers = [].slice.call(scene.querySelectorAll('[data-depth]'));
    var mx = 0, my = 0, cx = 0, cy = 0, sy = 0, ticking = false;
    if (fine) scene.addEventListener('pointermove', function (e) {
      var r = scene.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    });
    var draw = function () {
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      sy = Math.min(window.scrollY, scene.offsetHeight);
      layers.forEach(function (l) {
        var d = parseFloat(l.dataset.depth);
        l.style.transform = 'translate3d(' + (-cx * d * 40).toFixed(2) + 'px,' + (sy * d * 0.5 - cy * d * 16).toFixed(2) + 'px,0)';
      });
      if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001 || ticking) requestAnimationFrame(draw);
      ticking = false;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    scene.addEventListener('pointermove', function () { requestAnimationFrame(draw); });
    draw();
  }

  // Steps that fill in as you scroll
  var track = document.querySelector('[data-track]');
  if (track) {
    var steps = [].slice.call(track.querySelectorAll('[data-step]'));
    var fill = track.querySelector('.track-fill');
    var upd = function () {
      var r = track.getBoundingClientRect(), vh = innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
      if (fill) fill.style.transform = 'scaleY(' + p + ')';
      steps.forEach(function (s) { s.classList.toggle('on', s.getBoundingClientRect().top < vh * 0.6); });
    };
    upd(); addEventListener('scroll', upd, { passive: true });
  }

  // Mobile CTA bar: after the hero, hidden near the final CTA
  var bar = document.querySelector('.mbar'), hero = document.querySelector('.hero'), end = document.querySelector('[data-end]');
  if (bar && hero && 'IntersectionObserver' in window) {
    var heroGone = false, endOn = false;
    var setBar = function () { bar.classList.toggle('show', heroGone && !endOn); };
    new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; setBar(); }).observe(hero);
    if (end) new IntersectionObserver(function (es) { endOn = es[0].isIntersecting; setBar(); }).observe(end);
  }


  // Opening the files straight from a computer: folder links need index.html
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var m = h.match(/^([^?#]*)(.*)$/), path = m[1], rest = m[2];
      if (path === '' || !/\/$/.test(path)) return;
      a.setAttribute('href', path + 'index.html' + rest);
    });
  }

  // Remember where a visitor came from, so form enquiries show their source
  try {
    var q = new URLSearchParams(location.search), store = sessionStorage;
    ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'].forEach(function (k) { if (q.get(k)) store.setItem('cc_' + k, q.get(k)); });
    if (!store.getItem('cc_first_referrer')) store.setItem('cc_first_referrer', document.referrer || '');
    if (!store.getItem('cc_landing_page')) store.setItem('cc_landing_page', location.pathname + location.search);
  } catch (e) {}

  // Netlify forms: fill hidden fields, validate, submit, show the thank-you state
  document.querySelectorAll('form[data-netlify]').forEach(function (f) {
    ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid', 'first_referrer', 'landing_page'].forEach(function (k) {
      var el = f.querySelector('input[name="' + k + '"]');
      if (el) { try { el.value = sessionStorage.getItem('cc_' + k) || ''; } catch (e) {} }
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var b = f.querySelector('button[type=submit]'), label = b.innerHTML;
      if (f.hasAttribute('data-demo')) { f.classList.add('sent'); return; }
      if (location.protocol === 'file:') { b.innerHTML = 'Forms only send once the site is live'; return; }
      b.classList.add('is-loading');
      var data = new FormData(f), body;
      var hasFile = [].some.call(f.querySelectorAll('input[type=file]'), function (i) { return i.files && i.files.length; });
      var opts = { method: 'POST' };
      if (hasFile) { opts.body = data; } else { opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }; opts.body = new URLSearchParams(data).toString(); }
      fetch(f.getAttribute('action') || '/', opts)
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.classList.add('sent'); var ok = f.querySelector('.ok'); if (ok) ok.focus && ok.focus(); })
        .catch(function () { b.classList.remove('is-loading'); b.innerHTML = 'That didn\'t send. Try again, or email con.aikens@gmail.com'; setTimeout(function () { b.innerHTML = label; }, 6000); });
    });
  });

  // Prefill a choice from the URL, e.g. audit/?need=new
  try {
    var need = new URLSearchParams(location.search).get('need');
    if (need) { var r = document.querySelector('input[name="need"][data-key="' + need + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }
  } catch (e) {}

  // Footer year
  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
