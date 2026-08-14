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

  /* ── Clockify budget band ─────────────────────────────── */
  var band = document.getElementById('budget');

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

  function paintBudget(d) {
    var budgetHrs = d.retainer.hours;
    var used      = d.usedHours;
    var rate      = d.rate;
    var over      = used > budgetHrs;
    var pct       = used / budgetHrs * 100;

    band.dataset.state = over ? 'over' : 'ok';

    set('bud-hours',   used.toFixed(1));
    set('bud-dollars', money(used * rate));
    set('bud-pct',     Math.round(pct) + '%');
    set('bud-flag',    over ? (used - budgetHrs).toFixed(1) + ' hrs over · ' + money((used - budgetHrs) * rate)
                            : (budgetHrs - used).toFixed(1) + ' hrs remaining');

    // Bar: gold up to the budget line, hatched red beyond it. 6% headroom
    // keeps the budget tick clear of the right edge when we're over.
    var scale = Math.max(used, budgetHrs) * 1.06;
    document.getElementById('bud-in').style.width   = (Math.min(used, budgetHrs) / scale * 100) + '%';
    document.getElementById('bud-over').style.width = (Math.max(0, used - budgetHrs) / scale * 100) + '%';
    document.getElementById('bud-tick').style.left  = (budgetHrs / scale * 100) + '%';

    /* ── run rate ── */
    var now       = new Date();
    var thisKey   = now.toISOString().slice(0, 7);
    var complete  = d.months.filter(function (m) { return m.key !== thisKey; });
    var current   = d.months.filter(function (m) { return m.key === thisKey; })[0];
    var avg       = complete.length
                    ? complete.reduce(function (a, m) { return a + m.hours; }, 0) / complete.length
                    : used;

    var avgEl = document.getElementById('bud-avg');
    avgEl.textContent = avg.toFixed(1) + ' hrs';
    avgEl.classList.toggle('warn', avg > budgetHrs / 6);

    // project the current month linearly by day, then add the closed months
    var dim       = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var elapsed   = now.getDate();
    var curHrs    = current ? current.hours : 0;
    var projected = (used - curHrs) + (elapsed ? curHrs / elapsed * dim : 0);

    var projEl = document.getElementById('bud-proj');
    projEl.textContent = projected.toFixed(1) + ' hrs · ' + money(projected * rate);
    projEl.classList.toggle('warn', projected > budgetHrs);

    var end     = new Date(d.retainer.end + 'T00:00:00Z');
    var daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
    set('bud-left', daysLeft + ' days');

    /* ── the sentence that matters ── */
    // find the month the running total actually passed the budget
    var running = 0, crossed = null;
    d.months.forEach(function (m) {
      running += m.hours;
      if (crossed === null && running > budgetHrs) crossed = m.label;
    });

    var note = document.getElementById('bud-note');
    if (over) {
      note.innerHTML =
        'The six-month retainer is <b>already spent</b>, with ' + daysLeft + ' days still to run — ' +
        'the running total passed 60 hours during <b>' + (crossed || 'the last few weeks') +
        '</b>. The work has kept pace with what the Network actually needs; ' +
        'the budget was set before chapters, the Academy subscription and Advocate Weekly were on the table. ' +
        'That gap is exactly what the <a href="/proposal">Sept 2026 – Aug 2027 proposal</a> is meant to close, ' +
        'which is why getting it in front of the board matters more than it did a month ago.';
    } else {
      note.innerHTML =
        money((budgetHrs - used) * rate) + ' of the retainer remains with ' + daysLeft + ' days left. ' +
        'The <a href="/proposal">Sept 2026 – Aug 2027 proposal</a> sets the budget for what comes next.';
    }

    /* ── month rows ── */
    var monthly = budgetHrs / 6; // the retainer's implied monthly allowance
    document.getElementById('bud-months').innerHTML =
      '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#BB8C3A;font-weight:600;margin-bottom:8px">By month</div>' +
      d.months.map(function (m) {
        var w = Math.min(100, m.hours / (monthly * 1.8) * 100);
        return '<div class="mrow">' +
                 '<span class="lab">' + m.label + '</span>' +
                 '<span class="mb"><i class="' + (m.hours > monthly ? 'hot' : '') + '" style="width:' + w + '%"></i></span>' +
                 '<span class="val">' + m.hours.toFixed(1) + ' hrs <small>' + money(m.dollars) + '</small></span>' +
               '</div>';
      }).join('') +
      '<div style="font-size:11.5px;color:#87afc6;margin-top:8px">' +
        'Red bars are months that ran past the ' + monthly.toFixed(0) + ' hr allowance the retainer assumed.' +
      '</div>';

    /* ── project split ── */
    document.getElementById('bud-projects').innerHTML =
      '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#BB8C3A;font-weight:600;margin-bottom:8px">By project</div>' +
      d.projects.map(function (p) {
        var w = used ? p.inHours / used * 100 : 0;
        return '<div class="mrow">' +
                 '<span class="lab" style="width:auto;flex:0 0 150px">' + p.name + '</span>' +
                 '<span class="mb"><i style="width:' + w + '%"></i></span>' +
                 '<span class="val">' + p.inHours.toFixed(1) + ' hrs <small>' + money(p.inDollars) + '</small></span>' +
               '</div>';
      }).join('');
  }

  // Clockify is occasionally slow enough that a single call fails. One retry
  // costs nothing and spares Mark and Carly a scary red "Unavailable" panel
  // over a blip that resolves itself.
  function loadBudget(attempt) {
    fetch('/.netlify/functions/budget', { cache: attempt > 1 ? 'reload' : 'default' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || 'budget unavailable');
        paintBudget(d);
        if (d.stale) {
          var flag = document.getElementById('bud-flag');
          flag.textContent = flag.textContent + ' · last read a moment ago';
        }
      })
      .catch(function () {
        if (attempt < 2) { setTimeout(function () { loadBudget(attempt + 1); }, 2500); return; }
        band.dataset.state = 'error';
        document.getElementById('bud-flag').textContent = 'Unavailable';
        document.getElementById('bud-err').hidden = false;
      });
  }

  if (band) loadBudget(1);

  paintProgress();
  applyFilter('all');
})();
