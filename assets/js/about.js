/* About: today's date in the masthead (Brisbane time) */
(function () {
  var el = document.querySelector('[data-today]');
  if (!el) return;
  try { el.textContent = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Brisbane' }).format(new Date()); } catch (e) {}
})();
