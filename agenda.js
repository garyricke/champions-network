/* ============================================================
   Champions Network — Living Agenda
   Progress roll-up, status filtering, accordions, modals.

   The agenda's state lives in the HTML: every .item carries
   data-status="open" | "waiting" | "done". To update the page,
   change that one attribute (and optionally add a .res line);
   every count, bar and filter re-derives itself from it.
   ============================================================ */
(function () {
  'use strict';

  var items  = Array.prototype.slice.call(document.querySelectorAll('.item'));
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));
  var chips  = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var empty  = document.querySelector('.empty');

  function countOf(status, scope) {
    var pool = scope ? scope.querySelectorAll('.item') : items;
    return Array.prototype.filter.call(pool, function (el) {
      return el.dataset.status === status;
    }).length;
  }

  /* ── progress roll-up ─────────────────────────────────── */
  function paintProgress() {
    var total   = items.length;
    var done    = countOf('done');
    var waiting = countOf('waiting');
    if (!total) return;

    var label = document.getElementById('prog-label');
    if (label) {
      label.textContent = done + ' of ' + total + ' complete';
    }

    var dBar = document.querySelector('.bar i.d');
    var wBar = document.querySelector('.bar i.w');
    if (dBar) dBar.style.width = (done / total * 100) + '%';
    if (wBar) wBar.style.width = (waiting / total * 100) + '%';

    // per-block counts in the dark header
    blocks.forEach(function (block) {
      var out = block.querySelector('.count');
      if (!out) return;
      var n = block.querySelectorAll('.item').length;
      if (!n) { out.textContent = ''; return; }
      out.textContent = countOf('done', block) + ' / ' + n + ' done';
    });

    // chip counts
    chips.forEach(function (chip) {
      var n   = chip.querySelector('.n');
      var key = chip.dataset.filter;
      if (!n) return;
      n.textContent = key === 'all' ? items.length : countOf(key);
    });
  }

  /* ── filtering ────────────────────────────────────────── */
  function applyFilter(key) {
    var anyVisible = false;

    items.forEach(function (el) {
      var show = key === 'all' || el.dataset.status === key;
      el.classList.toggle('filtered', !show);
      if (show) anyVisible = true;
    });

    // hide a whole block once every item inside it is filtered out;
    // blocks with no items at all (pure narrative) stay put on "all"
    blocks.forEach(function (block) {
      var inBlock = block.querySelectorAll('.item');
      if (!inBlock.length) {
        block.classList.toggle('hidden', key !== 'all');
        return;
      }
      var visible = Array.prototype.some.call(inBlock, function (el) {
        return !el.classList.contains('filtered');
      });
      block.classList.toggle('hidden', !visible);
    });

    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === key));
    });

    if (empty) empty.classList.toggle('on', !anyVisible);

    // narrowing the list is only useful if you can see the result
    if (key !== 'all') {
      var main = document.querySelector('main');
      if (main) window.scrollTo({ top: main.offsetTop - 12, behavior: 'smooth' });
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      applyFilter(chip.dataset.filter);
    });
  });

  /* ── accordions ───────────────────────────────────────── */
  var toggleAll = document.getElementById('toggle-all');
  if (toggleAll) {
    toggleAll.addEventListener('click', function () {
      var panels = document.querySelectorAll('details');
      var opening = !Array.prototype.every.call(panels, function (d) { return d.open; });

      panels.forEach(function (d) { d.open = opening; });
      toggleAll.querySelector('.lbl').textContent = opening ? 'Collapse all detail' : 'Expand all detail';

      // collapsing from halfway down the page otherwise dumps you
      // somewhere unrecognisable
      if (!opening) window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // keep the button label honest if panels are opened individually
    document.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        var all = document.querySelectorAll('details');
        var allOpen = Array.prototype.every.call(all, function (x) { return x.open; });
        toggleAll.querySelector('.lbl').textContent = allOpen ? 'Collapse all detail' : 'Expand all detail';
      });
    });
  }

  var printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* ── modals ───────────────────────────────────────────── */
  document.querySelectorAll('.modal-open').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.getElementById(btn.dataset.modal);
      if (m) m.classList.add('on');
    });
  });

  document.querySelectorAll('.ov').forEach(function (ov) {
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) ov.classList.remove('on');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.ov.on').forEach(function (o) { o.classList.remove('on'); });
  });

  paintProgress();
  applyFilter('all');
})();
