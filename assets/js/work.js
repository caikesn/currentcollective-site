/* Work page: typing keyboard and counters */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Press W-O-R-K in a loop
  var keys = ['W', 'O', 'R', 'K'].map(function (k) { return document.querySelector('.kb [data-key="' + k + '"]'); }).filter(Boolean);
  if (keys.length && !reduce) {
    var i = 0;
    var tick = function () {
      var k = keys[i % keys.length];
      k.classList.add('press');
      setTimeout(function () { k.classList.remove('press'); }, 180);
      i++;
      setTimeout(tick, i % keys.length === 0 ? 2200 : 260);
    };
    setTimeout(tick, 1400);
  }
  // Counters
  var els = document.querySelectorAll('[data-count], [data-count-down]');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, down = el.hasAttribute('data-count-down');
      var from = down ? parseFloat(el.getAttribute('data-count-down')) : 0;
      var to = down ? parseFloat(el.getAttribute('data-to')) : parseFloat(el.getAttribute('data-count'));
      var dec = down ? 1 : 0, t0 = null, dur = 1600;
      var shrink = el.closest('.shrink'); if (shrink) shrink.classList.add('go');
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = (from + (to - from) * ease).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();
