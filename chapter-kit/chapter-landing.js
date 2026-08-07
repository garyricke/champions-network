/* ============================================================
   Chapter landing page — RSVP submit
   Posts the Netlify form over fetch so the visitor stays on the
   page. The form still works without JS: it has a real action,
   method, and form-name, so a plain submit hits Netlify directly.
   ============================================================ */
(function () {
  'use strict';

  var form = document.getElementById('rsvp-form');
  if (!form) return;

  var status = document.getElementById('rsvp-status');
  var done = document.getElementById('rsvp-done');

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status is-' + kind;
  }

  form.addEventListener('submit', function (e) {
    // No fetch support → let the browser do a normal POST.
    if (!window.fetch) return;
    e.preventDefault();

    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
    }
    setStatus('', 'ok');
    if (status) status.className = 'form-status';

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (done) {
          form.style.display = 'none';
          done.style.display = 'block';
          done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setStatus('Thank you — we have your RSVP.', 'ok');
          form.reset();
        }
      })
      .catch(function () {
        setStatus(
          'Something went wrong sending that. Please email Carly@champions-network.com and we will add you.',
          'err'
        );
        if (btn) {
          btn.disabled = false;
          btn.textContent = original;
        }
      });
  });
})();
