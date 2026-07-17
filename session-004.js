/* ============================================================
   Champions Network — Year 2, Session 004 Study Guide
   session-004.js
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
     PODCAST PLAYER
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

    // Streamed MP3s often report duration as Infinity/NaN until fully buffered,
    // which would leave the scrubber and clock frozen. Fall back to the known
    // encoded length so the player stays usable either way.
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

    audio.addEventListener('loadedmetadata', () => {
      durEl.textContent = fmt(dur());
      paint();
    });
    audio.addEventListener('durationchange', () => {
      durEl.textContent = fmt(dur());
    });
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

    // Skip buttons (data-skip="-15" / "30")
    pod.querySelectorAll('.pod-skip').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseFloat(btn.getAttribute('data-skip'));
        const d = dur() || Infinity;
        audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), d);
        paint();
      });
    });

    // Playback rate cycle
    const RATES = [1, 1.25, 1.5, 1.75, 2, 0.75];
    let rateIdx = 0;
    rateBtn.addEventListener('click', () => {
      rateIdx = (rateIdx + 1) % RATES.length;
      audio.playbackRate = RATES[rateIdx];
      rateBtn.textContent = RATES[rateIdx] + '×';
    });

    // Scrub — click and drag
    let dragging = false;
    const seekFromEvent = e => {
      const rect = scrub.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const ratio = Math.min(Math.max(x / rect.width, 0), 1);
      const d = dur();
      if (d > 0) {
        audio.currentTime = ratio * d;
        paint();
      }
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

    // Keyboard on the scrubber
    scrub.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { audio.currentTime += 5; paint(); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime -= 5; paint(); e.preventDefault(); }
    });
  }

  /* ============================================================
     INFOGRAPHIC DECK VIEWER
     Pages are rendered on demand from the Cloudinary PDF
     (pg_N transformation), so nothing but the current page loads.
     ============================================================ */
  const deck = document.querySelector('.deck');
  if (deck) {
    const PAGES = parseInt(deck.getAttribute('data-pages'), 10);
    const BASE  = deck.getAttribute('data-base');
    const img     = deck.querySelector('.deck-img');
    const prevBtn = deck.querySelector('.deck-prev');
    const nextBtn = deck.querySelector('.deck-next');
    const countEl = deck.querySelector('.deck-count');
    const dotsWrap = deck.querySelector('.deck-dots');

    const pageUrl = n => `${BASE.replace('{pg}', n)}`;
    let page = 1;

    // Build dots
    for (let i = 1; i <= PAGES; i++) {
      const dot = document.createElement('button');
      dot.className = 'deck-dot' + (i === 1 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to page ' + i);
      dot.addEventListener('click', () => show(i));
      dotsWrap.appendChild(dot);
    }
    const dots = dotsWrap.querySelectorAll('.deck-dot');

    function preload(n) {
      if (n < 1 || n > PAGES) return;
      const p = new Image();
      p.src = pageUrl(n);
    }

    function show(n) {
      page = Math.min(Math.max(1, n), PAGES);
      deck.classList.add('loading');
      img.src = pageUrl(page);
      img.alt = `The Believer's Field Guide to Politics & Culture — page ${page} of ${PAGES}`;
      countEl.textContent = page + ' / ' + PAGES;
      prevBtn.disabled = page === 1;
      nextBtn.disabled = page === PAGES;
      dots.forEach((d, i) => d.classList.toggle('active', i === page - 1));
      preload(page + 1);
      preload(page - 1);
    }

    img.addEventListener('load',  () => deck.classList.remove('loading'));
    img.addEventListener('error', () => deck.classList.remove('loading'));

    prevBtn.addEventListener('click', () => show(page - 1));
    nextBtn.addEventListener('click', () => show(page + 1));

    // Arrow keys when the deck is in view and focused
    deck.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { show(page + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { show(page - 1); e.preventDefault(); }
    });

    show(1);
  }

  /* ── LEADER NOTES (reveal answers) ── */
  document.querySelectorAll('.leader-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.dq');
      const body = card.querySelector('.leader-body');
      const isOpen = card.classList.toggle('open');
      body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : null;
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.querySelector('.leader-label-text').textContent =
        isOpen ? 'Hide Leader Notes' : 'Reveal Leader Notes';
    });
  });

  /* ── MODALS ── */
  const overlay    = document.getElementById('s2-overlay');
  const modalTag   = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');

  const modals = {
    differentiate: {
      tag: 'Principle #1',
      title: 'Always Differentiate',
      body: `
        <p>Everything in Session 4 rests on this first move. Before you can talk about a cultural issue without heat, you have to know <em>which kingdom you are standing in</em>.</p>
        <h4>God's Saving Work</h4>
        <p>This is God's work through the Gospel — Jesus saving people from sin. It runs on <strong>grace and faith</strong>. It is not administered by any government, and no law or election can advance it.</p>
        <h4>God's Preserving Work</h4>
        <p>This is how God uses government, family, and society to keep the world ordered and safe. This is where moral law, the protection of life, and basic fairness are properly discussed.</p>
        <div class="modal-pullquote">When we talk politics, we are not trying to save the world through laws. We are trying to keep society civil.</div>
        <h4>The Question That Reframes the Room</h4>
        <p>Instead of asking "how do we win this?", ask: <strong>"What does God want for our society so that people can live peacefully?"</strong> That question moves a conversation out of the salvation register — where politics never belonged — and back into the register where it can actually be discussed.</p>
        <p>This is the same <em>Dynamic Differentiation</em> Session 3 introduced, now applied directly to the way you speak.</p>`
    },
    values: {
      tag: 'Principle #2',
      title: 'Focus on Values, Not Personalities',
      body: `
        <p>Arguments overheat when they attach to a person. The fastest way to cool one down is to move it back to what is actually at stake.</p>
        <h4>Three Moves</h4>
        <ul>
          <li><strong>Values and principles</strong> — say what you believe is right, and why.</li>
          <li><strong>Policies, not people</strong> — talk about what a law <em>does</em> and whom it affects, rather than attacking whoever proposed it.</li>
          <li><strong>Common ground</strong> — even with people who disagree, you can usually find shared moral values (protecting the vulnerable, human dignity) that align with natural law and basic decency.</li>
        </ul>
        <div class="modal-pullquote">A personality is something to defend or attack. A value is something to discuss.</div>
        <p>Notice that this is not a rhetorical trick. It is an honest description of what you actually care about — the politician is temporary; the value outlasts them.</p>`
    },
    language: {
      tag: 'Principle #3',
      title: 'Be Careful with Language',
      body: `
        <p>The way we define terms matters more than most people realize.</p>
        <div class="modal-pullquote">Whoever controls the language often controls the argument.</div>
        <h4>What This Asks of You</h4>
        <ul>
          <li><strong>Be clear about what you mean</strong> when you use a word — define it before you defend it.</li>
          <li><strong>Avoid loaded terms</strong> that trigger immediate conflict and end the conversation before it starts.</li>
          <li><strong>Stick to clear, descriptive language</strong> that the person across from you can actually follow.</li>
        </ul>
        <p>Champions who take this seriously find that a surprising number of "disagreements" were two people using the same word to mean two different things.</p>`
    },
    liberties: {
      tag: 'Principle #4',
      title: 'Defend Specific Liberties',
      body: `
        <p>Depoliticizing does not mean going silent. Dr. Seltz argues there are a few non-negotiable issues the Church should stand for in the public square — the ones foundational to civil society and human flourishing.</p>
        <h4>The Four</h4>
        <ul>
          <li><strong>Religious Liberty</strong> — defending the right of <em>everyone</em> to follow their conscience, not only our own.</li>
          <li><strong>The Sanctity of Life</strong> — protecting all human life, regardless of age or ability.</li>
          <li><strong>Marriage</strong> — maintaining the traditional definition of family.</li>
          <li><strong>Educational Freedom</strong> — supporting families' ability to educate their children according to their values.</li>
        </ul>
        <div class="modal-pullquote">While we shouldn't politicize everything, there are a few core issues that rise to a "Thus saith the Lord" for Caesar.</div>
        <p>These sit squarely in God's <strong>preserving</strong> work. Standing for them is not an attempt to legislate salvation — it is the ordinary civic labor of keeping a society liveable.</p>`
    },
    kindness: {
      tag: 'Principle #5',
      title: 'Lead with Kindness',
      body: `
        <p>The most important part of these conversations is not the argument. It is the relationship you have with the person in front of you.</p>
        <h4>What Kindness Actually Requires</h4>
        <p>If you care about someone, you will treat them with respect even when you disagree. That is not a technique for winning — it is what caring about a person looks like when the topic is hard.</p>
        <div class="modal-pullquote">You don't have to change their mind to have a successful conversation.</div>
        <h4>The Goal, Restated</h4>
        <p>Share your perspective with genuine concern for their well-being. Listen to their side. Remember that your common humanity matters more than any political policy.</p>
        <p>This is Session 3's <em>"honor everyone"</em> arriving at its practical destination: the person is not the position.</p>`
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
  const answers = [1, 2, 1, 0, 2, 1, 0, 2, 1, 2]; // 0-indexed correct option
  const explanations = [
    'Politics is a referee, not a savior. Government belongs to God\'s preserving work — it keeps the game civil. It was never meant to save anyone.',
    'To depoliticize is to stop treating an issue as a contest to win or a policy to force, and to have an open, honest conversation with a friend or neighbor instead.',
    'God\'s saving work is the Gospel — Jesus saving people from sin, by grace through faith. No government policy advances it.',
    'God\'s preserving work is how He uses government, family, and society to keep the world ordered and safe. Moral law and the protection of life belong to this conversation.',
    'We are not trying to save the world through laws; we are trying to keep society civil — so ask what God wants for our society so people can live peacefully.',
    'Talk about what a law actually does and whom it affects, rather than attacking the person who proposed it. Policies, not people.',
    'Whoever controls the language often controls the argument — so define your terms, and avoid loaded words that end a conversation before it starts.',
    'The four non-negotiables are religious liberty, the sanctity of life, marriage, and educational freedom. Tax policy is a prudential question, not a "Thus saith the Lord" for Caesar.',
    'Shared moral foundations — often called natural law — are written into nature itself, so you can hold them in common even with people of very different religious or philosophical views.',
    'You don\'t have to change their mind for the conversation to succeed. Share your perspective with genuine concern, listen, and remember your common humanity outranks the policy.'
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
      msg.textContent = 'Outstanding — Champion Grade!';
      sub.textContent = 'You can differentiate, depoliticize, and lead with kindness. Take this into your next hard conversation.';
    } else if (score >= 8) {
      msg.textContent = 'Well Done — Strong Understanding';
      sub.textContent = 'Review the principles you missed and you\'ll be fully equipped for the roundtable.';
    } else if (score >= 6) {
      msg.textContent = 'Good Start — Keep Studying';
      sub.textContent = 'Give the teaching podcast another listen, especially the first principle — everything else rests on it.';
    } else {
      msg.textContent = 'Keep Going — Every Champion Grows';
      sub.textContent = 'Work back through the five principles and retake when ready. Politics is a referee, not a savior.';
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
      qEl.querySelectorAll('.quiz-opt').forEach(o => {
        o.disabled = false;
        o.className = 'quiz-opt';
      });
      qEl.querySelector('.quiz-feedback').className = 'quiz-feedback';
      qEl.querySelector('.quiz-feedback').textContent = '';
      qEl.querySelector('.quiz-next').style.display = 'none';
    });
    questions[0].classList.add('active');
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
  });

  updateProgress();

});
