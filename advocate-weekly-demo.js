/* ============================================================
   Champions Advocate Weekly — interactive approval workflow demo
   Pure front-end simulation. No data leaves the page.
   ============================================================ */
(function () {
  'use strict';

  // ---- the two production modes -------------------------------------------
  var MODE = 'curate'; // 'curate' | 'enhance'

  var modeEls = document.querySelectorAll('.mode');
  modeEls.forEach(function (el) {
    el.addEventListener('click', function () {
      MODE = el.getAttribute('data-mode');
      modeEls.forEach(function (m) { m.classList.toggle('on', m === el); });
      // reset downstream if they switch after generating
      resetDownstream();
    });
  });

  var genBtn = document.getElementById('wf-generate');
  var thinking = document.getElementById('wf-thinking');
  var draft = document.getElementById('wf-draft');
  var published = document.getElementById('wf-published');

  // Draft content per mode. Curate = verbatim quote + link, no new words.
  // Enhance = AI ties in the Champions narrative (needs doctrinal review).
  var DRAFTS = {
    curate: {
      flag: 'No doctrinal review required',
      flagClass: 'none',
      cat: 'Educational Freedom',
      headline: 'Illinois Parent Sues School Over Secret Transition',
      paras: [
        '<span class="src">St. Louis, Mo —</span> "An Illinois school district is facing a federal class-action lawsuit over claims it secretly transitioned a minor student’s gender identity at school. The mother of a high school student enrolled in Community Unit School District 300 filed the suit in federal court against the district and the superintendent."',
        '<span class="src">The mother says school employees began using an alternate name and pronouns for her child in 2022 without informing her…</span>'
      ],
      note: 'Verbatim excerpt in quotation marks — attributed to <em>The LION, May 26 2026</em> — with a button straight to the source. Nothing is rewritten, so there is no new doctrinal content to review.',
      pray: null
    },
    enhance: {
      flag: 'Needs Mark’s doctrinal blessing',
      flagClass: 'need',
      cat: 'Educational Freedom',
      headline: 'When the School Keeps a Secret From a Mother',
      paras: [
        '<span class="src">St. Louis, Mo —</span> An Illinois district is being sued in federal court for allegedly transitioning a minor’s gender identity at school — using a new name and pronouns since 2022 — without ever telling her mother.',
        'This is exactly the Left-Hand-Kingdom question Champions are trained to see: God gives parents, not the state, the first authority over a child. When an institution quietly steps into that God-given role, the issue is not merely policy — it is vocation and the order of creation.'
      ],
      note: 'AI condenses the source and ties it to the Two-Kingdoms framing in the Advocate’s house voice. Because this adds our own words, it carries a flag for Mark to approve before it can publish.',
      pray: [
        '…for this mother and her child, and others caught in the same place.',
        '…for administrators who feel it is their duty to usurp parental authority.',
        '…for the Church to teach clearly on God’s gift of parental authority.'
      ]
    }
  };

  function resetDownstream() {
    if (draft) { draft.classList.remove('show'); }
    if (published) { published.classList.remove('show'); }
    var approveBtn = document.getElementById('wf-approve');
    if (approveBtn) { approveBtn.disabled = false; approveBtn.textContent = ''; rebuildApproveBtn(approveBtn); }
  }

  function rebuildApproveBtn(btn) {
    btn.innerHTML = 'Approve &amp; Publish <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }

  if (genBtn) {
    genBtn.addEventListener('click', function () {
      draft.classList.remove('show');
      published.classList.remove('show');
      thinking.classList.add('show');
      genBtn.disabled = true;

      // simulate the AI pass
      setTimeout(function () {
        thinking.classList.remove('show');
        genBtn.disabled = false;
        renderDraft(DRAFTS[MODE]);
        draft.classList.add('show');
        draft.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1300);
    });
  }

  function renderDraft(d) {
    document.getElementById('d-flag').className = 'reviewflag ' + d.flagClass;
    document.getElementById('d-flag').textContent = d.flag;
    document.getElementById('d-cat').textContent = d.cat;
    document.getElementById('d-headline').textContent = d.headline;

    var body = document.getElementById('d-body');
    body.innerHTML = d.paras.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    if (d.pray) {
      var ul = d.pray.map(function (li) { return '<li>' + li + '</li>'; }).join('');
      body.insertAdjacentHTML('beforeend',
        '<div class="praybox"><b>Let Us Pray…</b><ul style="list-style:none;padding:0;margin:0">' + ul + '</ul></div>');
    }
    document.getElementById('d-note').innerHTML = d.note;

    // reviewer copy adapts to the mode
    var rv = document.getElementById('wf-reviewer-copy');
    if (d.flagClass === 'none') {
      rv.innerHTML = 'Curation mode adds no new words, so this can go live with a single click — no <code>Doctrinal&nbsp;Review</code> queue.';
    } else {
      rv.innerHTML = 'Enhance mode added our own framing, so it lands in Mark’s <code>Doctrinal&nbsp;Review</code> queue. One look, one click — nothing else changes — and it’s live.';
    }

    var approveBtn = document.getElementById('wf-approve');
    approveBtn.disabled = false;
    rebuildApproveBtn(approveBtn);
  }

  var approveBtn = document.getElementById('wf-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', function () {
      approveBtn.disabled = true;
      approveBtn.innerHTML = 'Publishing…';
      setTimeout(function () {
        published.classList.add('show');
        approveBtn.innerHTML = 'Published ✓';
        published.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
    });
  }

  var reqBtn = document.getElementById('wf-request');
  if (reqBtn) {
    reqBtn.addEventListener('click', function () {
      reqBtn.innerHTML = 'Sent back to draft ↩';
      setTimeout(function () { reqBtn.innerHTML = 'Request changes'; }, 1600);
    });
  }

  // smooth "see it live" jump
  var liveLink = document.getElementById('jump-live');
  if (liveLink) {
    liveLink.addEventListener('click', function (e) {
      e.preventDefault();
      var t = document.getElementById('the-site-page');
      if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  }
})();
