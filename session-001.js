/* ============================================================
   Champions Network — Year 1, Session 001 Study Guide
   session-001.js  (podcast-first; shares the player from Session 004)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL ── */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - nav.offsetHeight - 16, behavior: 'smooth' });
      }
    });
  });

  /* ── SCROLL REVEAL ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── ACCORDION ── */
  document.querySelectorAll('.s2-acc-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.s2-acc-item');
      const group = item.closest('.s2-accordion');
      const isOpen = item.classList.contains('open');
      group.querySelectorAll('.s2-acc-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.s2-acc-body').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        item.querySelector('.s2-acc-body').style.maxHeight = null;
      } else {
        item.classList.add('open');
        const body = item.querySelector('.s2-acc-body');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
  document.querySelectorAll('.s2-acc-item.open').forEach(item => {
    const body = item.querySelector('.s2-acc-body');
    if (body) body.style.maxHeight = body.scrollHeight + 'px';
  });

  /* ============================================================
     PODCAST PLAYER  (same engine as Session 004)
     ============================================================ */
  const pod = document.querySelector('.pod');
  if (pod) {
    const audio   = document.getElementById('pod-audio');
    const playBtn = pod.querySelector('.pod-play');
    const scrub   = pod.querySelector('.pod-scrub');
    const fill    = pod.querySelector('.pod-fill');
    const buffer  = pod.querySelector('.pod-buffer');
    const knob    = pod.querySelector('.pod-knob');
    const curEl   = pod.querySelector('.pod-cur');
    const durEl   = pod.querySelector('.pod-dur');
    const rateBtn = pod.querySelector('.pod-rate');

    const fmt = s => {
      if (!isFinite(s) || s < 0) s = 0;
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + String(sec).padStart(2, '0');
    };

    // Streamed audio often reports duration as Infinity/NaN until fully
    // buffered, which would freeze the scrubber. Fall back to the known length.
    const FALLBACK_DUR = parseFloat(audio.dataset.duration) || 0;
    const dur = () => {
      const d = audio.duration;
      return (isFinite(d) && d > 0) ? d : FALLBACK_DUR;
    };

    const paint = () => {
      const d = dur();
      if (d <= 0) return;
      const pct = Math.min((audio.currentTime / d) * 100, 100);
      fill.style.width = pct + '%';
      knob.style.left = pct + '%';
      curEl.textContent = fmt(audio.currentTime);
      scrub.setAttribute('aria-valuenow', Math.round(pct));
      scrub.setAttribute('aria-valuetext', fmt(audio.currentTime) + ' of ' + fmt(d));
    };

    audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(dur()); paint(); });
    audio.addEventListener('durationchange', () => { durEl.textContent = fmt(dur()); });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('play',  () => pod.classList.add('playing'));
    audio.addEventListener('pause', () => pod.classList.remove('playing'));
    audio.addEventListener('ended', () => pod.classList.remove('playing'));
    audio.addEventListener('progress', () => {
      const d = dur();
      if (audio.buffered.length && d > 0) {
        const end = audio.buffered.end(audio.buffered.length - 1);
        buffer.style.width = Math.min(end / d * 100, 100) + '%';
      }
    });

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        // play() rejects with AbortError if paused before it resolves — ignore it.
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        audio.pause();
      }
    });

    pod.querySelectorAll('.pod-skip').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseFloat(btn.getAttribute('data-skip'));
        const d = dur() || Infinity;
        audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), d);
        paint();
      });
    });

    const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
    let rateIdx = 0;
    rateBtn.addEventListener('click', () => {
      rateIdx = (rateIdx + 1) % RATES.length;
      audio.playbackRate = RATES[rateIdx];
      rateBtn.textContent = RATES[rateIdx] + '×';
    });

    let dragging = false;
    const seekFromEvent = e => {
      const rect = scrub.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const ratio = Math.min(Math.max(x / rect.width, 0), 1);
      const d = dur();
      if (d > 0) { audio.currentTime = ratio * d; paint(); }
    };
    const startDrag = e => { dragging = true; seekFromEvent(e); e.preventDefault(); };
    const moveDrag  = e => { if (dragging) seekFromEvent(e); };
    const endDrag   = () => { dragging = false; };
    scrub.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);
    scrub.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: true });
    window.addEventListener('touchend', endDrag);
    scrub.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { audio.currentTime += 5; paint(); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime -= 5; paint(); e.preventDefault(); }
    });
  }

  /* ── MODALS ── */
  const overlay    = document.getElementById('s2-overlay');
  const modalTag   = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');

  const modals = {
    'two-kingdoms': {
      tag: 'The Big Idea',
      title: 'God Engages the World Two Ways',
      body: `
        <p>Everything in the Champions Network starts here: God is at work in the world in two distinct ways, and a Champion learns to tell them apart.</p>
        <h4>To Bless and Preserve</h4>
        <p>God blesses the culture of this world in order to <strong>preserve</strong> it for now — using government, family, and society to keep things ordered and safe. This is His "left-hand" work, and it is where civic life and religious liberty live.</p>
        <h4>To Save</h4>
        <p>God <strong>saves</strong> individuals from sin, death, and the devil through the Gospel. Jesus lived, died, and rose again to save people for eternity. This is His "right-hand" work, and no law or election advances it.</p>
        <div class="modal-pullquote">Champions are equipped to understand God's two-kingdom engagement — and then to live it out as faithful civic citizens and God's ambassadors.</div>
        <p>Confusing the two is what makes so many Christians anxious about public life. Keeping them distinct is what lets a Champion engage culture with confidence.</p>`
    },
    'journey': {
      tag: 'The Path',
      title: 'The 5-Stage Journey',
      body: `
        <p>Everyone who joins the Champions Academy begins as a <strong>Champion Apprentice</strong>. Just as in most trades and sciences, we learn before we do.</p>
        <p>From there, the Academy lays out a <strong>5-Stage Journey</strong> toward becoming everything you can be as a Champion Knight. You'll learn more about why we use this terminology as you go — for now, simply know that the path is designed to build genuine confidence.</p>
        <div class="modal-pullquote">You will enjoy becoming confident in being a Christian in this world — and specifically in how to engage others on the cultural issues of our day.</div>
        <p>This course of learning is meant to change your life, possibly your family, and hopefully your local community.</p>`
    },
    'chapter': {
      tag: 'The Community',
      title: 'What Is a Champions Chapter?',
      body: `
        <p>A <strong>Champions Chapter</strong> is a local group of Champion Apprentices and Facilitators who meet to learn and engage — normally once a month for the lesson discussions.</p>
        <h4>How You Join</h4>
        <p>You access the Academy through a subscription; your local facilitators provide an access code. If you don't have a local chapter yet, the LCRL National Champions Network staff will help you join a <strong>Special Online Chapter</strong> until a local one is founded.</p>
        <h4>What a Chapter Facilitates</h4>
        <ul>
          <li>Community Engagement Plans</li>
          <li>Prayer &amp; Worship Opportunities</li>
          <li>Book Discussion Groups</li>
          <li>Key Two-Kingdom Bible Study opportunities for your congregation</li>
          <li>Launching another Champions Group at your church or a nearby one</li>
        </ul>
        <p>Remember: we are not learning for learning's sake. We learn and grow so we can engage real people in our own communities.</p>`
    },
    'for-others': {
      tag: 'The Objective',
      title: 'Championing Liberty — For Others',
      body: `
        <p>Being a champion for religious liberty is <strong>not</strong> about conquering the world for Christ, as if launching a new season of the crusades. It is about championing religious liberty <em>for others</em> — even for those who are not religious or God-fearing.</p>
        <h4>Freedom of Conscience</h4>
        <p>This reflects the philosophy of the Founding Fathers — specifically Madison and Jefferson — who argued that freedom of conscience is a natural, unalienable right underpinning all other civil liberties.</p>
        <div class="modal-pullquote">If the government can control what you believe, it can inevitably control what you say, write, and do.</div>
        <h4>A Servant Mindset</h4>
        <p>Champions are servant-minded, with a Christlike posture. Some of us are passionate and want to get going ASAP — like the apostle Peter, quick with a sword. But Jesus, reattaching the servant's ear, tells Peter, "No, not that way." That's why we take time to learn principles like Dynamic Differentiation, Reformation Restraint, and Vocational Respect — so we slow down and see what God is already doing before we act.</p>`
    }
  };

  function openModal(key) {
    const data = modals[key];
    if (!data) return;
    modalTag.textContent   = data.tag;
    modalTitle.textContent = data.title;
    modalBody.innerHTML    = data.body;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal')));
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ── QUIZ ── */
  const answers = [1, 1, 0, 2, 1, 1, 0, 2, 1, 0]; // 0-indexed correct option
  const explanations = [
    'God engages the world in two distinct ways: He blesses and preserves the culture for now, and He saves individuals from sin, death, and the devil through the Gospel.',
    'God\'s saving work is accomplished through the Gospel — Jesus lived, died, and rose to save people for eternity. It is not advanced by any law or government.',
    'Everyone who joins the Champions Academy starts as a Champion Apprentice — because, as in any trade or science, we learn before we do.',
    'The Academy maps a 5-Stage Journey toward becoming a Champion Knight. Apprentice is where everyone begins.',
    'A Champions Chapter is a local group of Apprentices and Facilitators who meet — normally monthly — to learn and to practice engaging.',
    'Championing religious liberty means defending it for everyone — even those who are not religious — not conquering the world for Christ.',
    'Madison and Jefferson argued that freedom of conscience is a natural, unalienable right that underpins all other civil liberties.',
    'The five-fold purpose of each session is Inspirational, Educational, Prayerful, Social, and Missional — the Missional piece has you building an advocacy plan for your community.',
    'LCRL stands for the Lutheran Center for Religious Liberty — the LCMS\'s advocacy voice in Washington, D.C.',
    'The Network\'s theme passage is 1 Peter 2:15–17 — "Honor everyone. Love the brotherhood. Fear God. Honor the emperor." — learned by heart one phrase at a time.'
  ];

  let currentQ = 0;
  let score = 0;
  const questions = document.querySelectorAll('.quiz-q');
  const fillBar = document.getElementById('quiz-fill');

  function updateProgress() {
    fillBar.style.width = (currentQ / questions.length * 100) + '%';
  }

  questions.forEach((qEl, qi) => {
    const opts = qEl.querySelectorAll('.quiz-opt');
    const feedback = qEl.querySelector('.quiz-feedback');
    const nextBtn = qEl.querySelector('.quiz-next');

    opts.forEach((opt, oi) => {
      opt.addEventListener('click', () => {
        if (opt.disabled) return;
        opts.forEach(o => o.disabled = true);
        const correct = answers[qi];
        if (oi === correct) {
          opt.classList.add('correct');
          feedback.className = 'quiz-feedback correct show';
          feedback.textContent = '✓ Correct! ' + explanations[qi];
          score++;
        } else {
          opt.classList.add('incorrect');
          opts[correct].classList.add('show-correct');
          feedback.className = 'quiz-feedback incorrect show';
          feedback.textContent = '✗ Not quite. ' + explanations[qi];
        }
        nextBtn.style.display = 'block';
      });
    });

    nextBtn.addEventListener('click', () => {
      qEl.classList.remove('active');
      currentQ++;
      updateProgress();
      if (currentQ < questions.length) {
        questions[currentQ].classList.add('active');
      } else {
        fillBar.style.width = '100%';
        showScore();
      }
    });
  });

  function showScore() {
    const scoreEl = document.getElementById('quiz-score');
    document.getElementById('score-num').textContent = score;
    const msg = document.getElementById('score-msg');
    const sub = document.getElementById('score-sub');
    if (score === 10) {
      msg.textContent = 'Outstanding — Welcome, Champion!';
      sub.textContent = 'You\'ve grasped the introduction. You\'re ready to begin the Journey as a Champion Apprentice.';
    } else if (score >= 8) {
      msg.textContent = 'Well Done — Strong Start';
      sub.textContent = 'Review the couple you missed and you\'ll be fully oriented for your first chapter meeting.';
    } else if (score >= 6) {
      msg.textContent = 'Good Beginning — Keep Going';
      sub.textContent = 'Give the teaching podcast another listen, especially the two-kingdom idea — everything else builds on it.';
    } else {
      msg.textContent = 'Just Getting Started — That\'s Okay';
      sub.textContent = 'Work back through the introduction and retake when ready. Every Champion begins as an Apprentice.';
    }
    scoreEl.classList.add('show');
  }

  document.getElementById('quiz-retry').addEventListener('click', () => {
    currentQ = 0;
    score = 0;
    fillBar.style.width = '0%';
    document.getElementById('quiz-score').classList.remove('show');
    questions.forEach(qEl => {
      qEl.classList.remove('active');
      qEl.querySelectorAll('.quiz-opt').forEach(o => { o.disabled = false; o.className = 'quiz-opt'; });
      qEl.querySelector('.quiz-feedback').className = 'quiz-feedback';
      qEl.querySelector('.quiz-feedback').textContent = '';
      qEl.querySelector('.quiz-next').style.display = 'none';
    });
    questions[0].classList.add('active');
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
  });

  updateProgress();

});
