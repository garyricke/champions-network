/* ============================================================
   Champions Network — Session 003 Study Guide
   session-003.js
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

  // Set initial open items
  document.querySelectorAll('.s2-acc-item.open').forEach(item => {
    const body = item.querySelector('.s2-acc-body');
    if (body) body.style.maxHeight = body.scrollHeight + 'px';
  });

  /* ── TABS ── */
  document.querySelectorAll('.s2-tab-nav').forEach(nav => {
    const btns = nav.querySelectorAll('.s2-tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const section = nav.closest('section') || nav.parentElement.parentElement;
        section.querySelectorAll('.s2-tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.getAttribute('data-ftb') === target);
        });
        // recompute any open accordions inside the newly shown panel
        section.querySelectorAll('.s2-tab-panel.active .s2-acc-item.open').forEach(item => {
          const body = item.querySelector('.s2-acc-body');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        });
      });
    });
  });

  /* ── CHECKLIST ── */
  document.querySelectorAll('.chk').forEach(chk => {
    chk.addEventListener('click', () => chk.classList.toggle('checked'));
    chk.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chk.classList.toggle('checked'); } });
  });

  /* ── MODALS ── */
  const overlay  = document.getElementById('s2-overlay');
  const modalTag   = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');

  const modals = {
    honor: {
      tag: 'Opening Devotional',
      title: 'Honor Everyone',
      body: `
        <p>Session 3 opens in 1 Peter 2:15–17 — the same passage that guides all of LCRL's work, but with the spotlight on one short command in the middle of it.</p>
        <div class="modal-pullquote">"Live as people who are free… Honor everyone. Love the brotherhood. Fear God. Honor the emperor." — 1 Peter 2:15–17</div>
        <h4>Why "Honor Everyone" Is So Hard</h4>
        <p>Peter does not say honor the people who agree with you, or honor the leaders you voted for. He says <strong>honor everyone</strong>. In a culture that increasingly dishonors one another — through contempt, caricature, and the assumption of bad faith — this is a radical, counter-cultural calling.</p>
        <h4>Honor Flows From Human Dignity</h4>
        <p>We can honor everyone because every person bears the image of God. Human dignity is not earned by agreement or behavior; it is conferred by the Creator. When we honor an opponent, we are not endorsing their position — we are recognizing the dignity God already gave them.</p>
        <h4>For Your Chapter</h4>
        <p>Consider how your Champions Chapter might cultivate a culture of honor in your community — modeling for a divided world what it looks like to disagree without dishonoring.</p>`
    },
    'dynamic-differentiation': {
      tag: 'Core Principle #1',
      title: 'Dynamic Differentiation',
      body: `
        <p>The first of three principles that help us frame the cultural issues of our day — and depoliticize them for the sake of better conversations.</p>
        <h4>What It Means</h4>
        <p>Engaging culture as a Two-Kingdom Citizen means knowing — and showing others — how God works in the world today. Sometimes God is <strong>saving</strong> people for eternity (right-hand kingdom). Sometimes He is <strong>preserving order</strong> in this world (left-hand kingdom). Dynamic Differentiation is the practice of looking for that difference in God's action and responding accordingly.</p>
        <h4>Why "Dynamic"?</h4>
        <p>The word <em>dynamic</em> reminds us that situations in our world are always on the move. We already practice differentiation in daily life — knowing when it is appropriate to speak and when it isn't.</p>
        <div class="modal-pullquote">Just because the stop light at your intersection is GREEN doesn't mean it's safe to proceed. You still need to look, and proceed with caution.</div>
        <p>Differentiating a temporal concern from an eternal one keeps us from treating every issue as a salvation issue — and helps us meet people where they actually are.</p>`
    },
    'reformation-restraint': {
      tag: 'Core Principle #2',
      title: 'Reformation Restraint',
      body: `
        <p>The second principle helps us discern whether — and how — the Church should speak to a given issue.</p>
        <h4>God Is Always at Work</h4>
        <p>Lutherans know God is at work in the right-hand kingdom by grace through faith — a gift, not of works, so no one can boast (Ephesians 2:8–9). Faith itself can't be seen directly in others; we perceive it by the fruit it produces.</p>
        <p>So too in the left-hand kingdom: God may be at work among public servants — governing officials, law enforcement — in ways we cannot always perceive. <strong>Don't assume God is NOT already at work</strong> through them.</p>
        <h4>Restraint Before Reform</h4>
        <p>Before we jump into a cultural issue to bring reform, we practice restraint — taking time to see whether God is doing something we may not immediately see. Are there others, of different traditions or vocations, God may already be using? Can we lend support to what others are <em>already</em> doing to order the culture?</p>
        <div class="modal-pullquote">Restraint is not passivity. It is the humility to look before we leap — and the wisdom to join God's work rather than duplicate or disrupt it.</div>`
    },
    'vocational-respect': {
      tag: 'Core Principle #3',
      title: 'Vocational Respect',
      body: `
        <p>The third principle cautions us on exactly how to be involved in a concern — with honor for the vocations through which God orders society.</p>
        <div class="modal-pullquote">"Honor your father and your mother, that it may be well with you and you may live long on the earth."</div>
        <p>This is not only a Christian commandment but an accepted reality in virtually every culture. Being a parent, a professional, or a public servant — these are vocations where God is at work to create order in the face of human brokenness.</p>
        <h4>Why It Matters for Liberty</h4>
        <p>A society that honors these vocations can last; one that does not jeopardizes liberty. When Jesus says <em>"give to Caesar what is Caesar's,"</em> He extends the "honor your father and mother" mentality, secondarily, to the vocations where God is at work in this world.</p>
        <p>That is why Paul can call Christians to submit to the authorities — <strong>vocational respect while seeking justice</strong>. It's how Christians keep things civil now, so that we can speak about God's saving work forever.</p>`
    },
    'al-smith': {
      tag: 'Free to Believe — Chapter 4',
      title: 'Employment Division v. Smith',
      body: `
        <p>Goodrich opens Chapter 4 — "Are We Under Attack?" — with the case commonly known as <em>Al Smith v. Oregon</em>.</p>
        <h4>The Facts</h4>
        <p>Oregon outlawed any use of peyote, including its sacramental use by Native Americans. When Al Smith was denied unemployment benefits for that religious use, the case reached the Supreme Court — and, surprisingly, the Court sided with the State of Oregon.</p>
        <h4>Why It Mattered</h4>
        <p>The ruling tossed out decades of religious-liberty precedent, finding a way around the long-standing <strong>"substantial burden"</strong> test for religious exemptions. It sent waves of worry across religious organizations nationwide.</p>
        <div class="modal-pullquote">Key point: precedent can change in a moment's notice. Don't assume.</div>
        <h4>The Response: RFRA</h4>
        <p>The shock of <em>Smith</em> led to the celebrated, broadly bipartisan passage of the <strong>Religious Freedom Restoration Act (RFRA)</strong> — restoring strong protection for religious exercise. Practice telling this story aloud; it will help you make the point in future conversations.</p>`
    },
    obergefell: {
      tag: 'Free to Believe — Chapter 4',
      title: 'Obergefell v. Hodges',
      body: `
        <p>Champions need to understand this case and the arguments given for both same-sex marriage and traditional marriage.</p>
        <h4>The Shift</h4>
        <p>For the first time, <strong>"the State"</strong> — not God — was deciding what marriage is. In practice, five unelected justices redefined marriage against centuries of precedent.</p>
        <div class="modal-pullquote">Key question: Will traditional marriage continue to be allowed — or is this the beginning of the end of any and all marriage?</div>
        <h4>Why It's Pivotal</h4>
        <p>After <em>Obergefell</em>, questions immediately arose as to the continued worthiness of religious freedom itself. Goodrich notes this is the moment many common Christian beliefs began to be treated as incompatible with the prevailing culture.</p>
        <p>A helpful case summary: <a href="https://constitutioncenter.org/the-constitution/supreme-court-case-library/obergefell-v-hodges" target="_blank" rel="noopener">National Constitution Center — Obergefell v. Hodges</a>.</p>`
    },
    amos: {
      tag: 'Free to Believe — Chapter 5',
      title: 'Corporation of the Presiding Bishop v. Amos',
      body: `
        <p>Chapter 5 — "Is Discrimination Evil?" — turns on the difference between wrongful discrimination and the legitimate need to be <em>discriminant</em>.</p>
        <h4>The Issue</h4>
        <p>Whether a religious organization can consider religion in employment — even for non-religious jobs — under Title VII's religious exemption.</p>
        <h4>The Decision</h4>
        <p class="">The Supreme Court ruled <strong>in favor of the Church</strong>, upholding the exemption that lets religious organizations define and carry out their mission without significant governmental interference.</p>
        <h4>The Bigger Principle</h4>
        <p>Religious freedom is a fundamental human right rooted in who we are: the freedom to search for transcendent truth, and the freedom to associate with others doing the same. The right of religious assembly has meant three things — the right to determine one's beliefs and doctrine, to establish internal rules of self-governance, and to choose one's own members and leaders.</p>`
    },
    hosanna: {
      tag: 'Free to Believe — Chapter 5',
      title: 'Hosanna-Tabor v. Perich',
      body: `
        <p>A landmark religious-liberty case — and one every Champion should be able to tell as a story.</p>
        <h4>The Issue</h4>
        <p>Does the First Amendment's <strong>"ministerial exception"</strong> protect a religious institution from employment-discrimination lawsuits when it comes to those who carry out its religious mission?</p>
        <h4>The Decision</h4>
        <p>The Supreme Court ruled <strong>in favor of the Church</strong> — affirming a religious body's right to choose its own ministers without being subject to employment-discrimination laws.</p>
        <div class="modal-pullquote">"The interest of society in the enforcement of employment discrimination statutes is undoubtedly important. But so, too, is the interest of religious groups in choosing who will preach their beliefs, teach their faith, and carry out their mission." — Chief Justice John Roberts</div>
        <h4>The Question It Raises</h4>
        <p>What would be the problem if antidiscrimination laws always trumped religious freedom? And if religious organizations can decide who they hire, can they remain free in their religious conduct moving forward? These are exactly the questions Champions train to answer.</p>`
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
  const answers = [1, 1, 0, 1, 1, 1, 1, 1, 1, 0]; // 0-indexed correct option
  const explanations = [
    'Session 3 introduces Pillar Two: Prayer. As advocates for God\'s left-hand kingdom causes, Champions lean into the Lord daily for His counsel and trust.',
    'The devotional centers on "Honor everyone" — the hardest of Peter\'s four commands, grounded in the God-given dignity of every person.',
    'The three core principles are Dynamic Differentiation, Reformation Restraint, and Vocational Respect — tools to frame and depoliticize cultural issues.',
    'Dynamic Differentiation organizes our response around whether a concern is temporal (God preserving order) or eternal (God saving) — looking for the difference in God\'s action.',
    'Reformation Restraint calls us to pause before jumping in — to see whether God may already be at work through others of different vocations or traditions.',
    'Vocational Respect extends "Honor your father and mother" to the vocations — parent, professional, public servant — through which God orders society.',
    'In Employment Division v. Smith (Al Smith v. Oregon), the Court sided with the State, tossing out decades of precedent by working around the "substantial burden" test.',
    'Congress responded by passing RFRA — the Religious Freedom Restoration Act — to restore strong protection for the free exercise of religion.',
    'Title VII prohibits employment discrimination on the basis of race, color, sex, national origin, and religion — and includes a religious-organization exemption.',
    'In Hosanna-Tabor v. Perich, the Supreme Court protected the "ministerial exception" — a church\'s First Amendment right to choose its own ministers.'
  ];

  let currentQ = 0;
  let score = 0;
  const questions = document.querySelectorAll('.quiz-q');
  const fill = document.getElementById('quiz-fill');

  function updateProgress() {
    fill.style.width = (currentQ / questions.length * 100) + '%';
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
        fill.style.width = '100%';
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
      sub.textContent = 'You\'ve mastered Session 003. You can frame, depoliticize, and engage with wisdom.';
    } else if (score >= 8) {
      msg.textContent = 'Well Done — Strong Understanding';
      sub.textContent = 'Review the principles you missed and you\'ll be fully equipped for the roundtable.';
    } else if (score >= 6) {
      msg.textContent = 'Good Start — Keep Studying';
      sub.textContent = 'Revisit the Three Core Principles and the Free to Believe cases for reinforcement.';
    } else {
      msg.textContent = 'Keep Going — Every Champion Grows';
      sub.textContent = 'Review the full session and retake when ready. Pillar Two is Prayer — lean in!';
    }
    scoreEl.classList.add('show');
  }

  document.getElementById('quiz-retry').addEventListener('click', () => {
    currentQ = 0;
    score = 0;
    fill.style.width = '0%';
    document.getElementById('quiz-score').classList.remove('show');
    questions.forEach((qEl) => {
      qEl.classList.remove('active');
      const opts = qEl.querySelectorAll('.quiz-opt');
      opts.forEach(o => {
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
