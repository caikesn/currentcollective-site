/* Contact: live Brisbane clock + postmark date */
(function () {
  var c = document.querySelector('[data-clock]'), d = document.querySelector('[data-pmday]');
  var fmt = function (o) { return new Intl.DateTimeFormat('en-AU', Object.assign({ timeZone: 'Australia/Brisbane' }, o)); };
  var tick = function () {
    try { if (c) c.textContent = fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()).replace(' ', '').toLowerCase(); } catch (e) {}
  };
  tick(); setInterval(tick, 15000);
  try { if (d) d.textContent = fmt({ day: 'numeric', month: 'short' }).format(new Date()).toUpperCase(); } catch (e) {}
})();
