/* Services: swinging price tags, cursor preview, process progress */
(function () {
  // Tags: a damped spring, nudged by how fast the mouse moves past
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.tag .swing').forEach(function (el) {
      var a = 0, v = 0, raf = 0, lastX = null, lastT = 0;
      var step = function () {
        v += (-0.06 * a - 0.07 * v); a += v;
        el.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
        if (Math.abs(a) > 0.02 || Math.abs(v) > 0.02) raf = requestAnimationFrame(step);
        else { raf = 0; a = v = 0; el.style.transform = ''; }
      };
      el.addEventListener('pointermove', function (e) {
        var now = performance.now();
        if (lastX !== null && now - lastT < 100) {
          var speed = (e.clientX - lastX) / Math.max(8, now - lastT);
          v += Math.max(-1.2, Math.min(1.2, speed * 0.6));
          if (!raf) raf = requestAnimationFrame(step);
        }
        lastX = e.clientX; lastT = now;
      });
      el.addEventListener('pointerleave', function () { lastX = null; });
    });
  }

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
