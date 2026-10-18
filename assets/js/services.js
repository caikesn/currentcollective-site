/* Services: cursor preview + process progress */
(function () {
  var prev = document.querySelector('.prev');
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (prev && fine) {
    document.querySelectorAll('.receipt details[data-prev] summary').forEach(function (s) {
      var k = s.parentNode.getAttribute('data-prev');
      s.addEventListener('mouseenter', function () { prev.setAttribute('data-k', k); prev.classList.add('on'); });
      s.addEventListener('mouseleave', function () { prev.classList.remove('on'); });
      s.addEventListener('mousemove', function (e) { var x = e.clientX + 24, y = e.clientY - prev.offsetHeight - 22; if (x + 290 > innerWidth) x = e.clientX - 304; prev.style.setProperty('--x', x + 'px'); prev.style.setProperty('--y', Math.max(10, y) + 'px'); });
    });
  }
  var proc = document.querySelector('[data-proc]');
  if (!proc) return;
  var items = proc.querySelectorAll('li');
  var upd = function () {
    var r = proc.getBoundingClientRect(), vh = innerHeight;
    var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.5)));
    proc.style.setProperty('--p', p.toFixed(3));
    items.forEach(function (li, i) { li.classList.toggle('lit', p >= i / (items.length - 1) - 0.001 && p > 0); });
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
})();
