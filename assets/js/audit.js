/* Audit page: scan readout + scanline height */
(function () {
  var ph = document.querySelector('.ph-screen');
  if (ph) { var set = function () { ph.style.setProperty('--ph-h', ph.clientHeight + 'px'); }; set(); addEventListener('resize', set); }
  var el = document.querySelector('[data-scan]');
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var lines = ['speed 49 / 100', 'first paint 5.6s', 'book button: none', 'tap to call: no', 'google description: none'], i = 0;
  setInterval(function () { i = (i + 1) % lines.length; el.textContent = lines[i]; }, 1300);
  el.textContent = lines[0];
})();
