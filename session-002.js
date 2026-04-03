/* ============================================================
   Champions Network — Session 002 Study Guide
   session-002.js
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
        // find sibling panels in same section
        const section = nav.closest('section') || nav.parentElement.parentElement;
        section.querySelectorAll('.s2-tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.getAttribute('data-ftb') === target);
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
    prayer: {
      tag: 'Opening Devotional',
      title: 'Opening Prayer — Session 002',
      body: `
        <p>This prayer was offered by Dr. Gregory Seltz to open Session 002 of the Champions Network.</p>
        <div class="modal-pullquote">
          Heavenly Father, you have given us the greatest freedom ever imagined in the life, death, and resurrection of Jesus Christ. Nothing and no one can take that kind of freedom away from us.
        </div>
        <p>Lord, thank you for the grace that has been extended to us temporally through our U.S. Constitution — a government of the people, by the people, and for the people. We have so many liberties because of the spirit of eternal freedom afforded us in Jesus.</p>
        <p>Help us to be good stewards of our temporal liberties, not for ourselves, but for others. Give us the courage and the bravery and the fellowship of one another in Christ to not be silent should silence hurt others.</p>
        <p>Help us retain the freedoms so necessary for a clear and constant proclamation of the Gospel.</p>
        <div class="modal-pullquote">For Jesus' sake. Amen.</div>
        <p><em>— Dr. Gregory Seltz, Executive Director, Lutheran Center for Religious Liberty</em></p>`
    },
    'three-types': {
      tag: 'Free to Believe — Chapter 1',
      title: 'The Three Types of Christians',
      body: `
        <p>Luke Goodrich identifies three common frameworks among Christians when it comes to religious liberty — each with real flaws that prevent effective advocacy.</p>
        <div class="modal-types">
          <div class="modal-type">
            <h5>🏛 The Pilgrims</h5>
            <p>Their core assumption: Christians founded this nation, and therefore the Christian faith should always be prominent. The problem? Scripture doesn't stand behind dominance — and historically, Pilgrims were often quite poor at extending religious liberty to those who didn't believe like them.</p>
          </div>
          <div class="modal-type">
            <h5>✝️ The Martyrs</h5>
            <p>They argue America has no special status in God's world, point to the church's historical failures, and see religious liberty advocacy as just another form of Christian oppression. Their flaw: Scripture says persecution will come — but it is not a good thing, and no one should pray for it. Sometimes the church is truly crushed under persecution. It doesn't always flourish.</p>
          </div>
          <div class="modal-type">
            <h5>🌱 The Beginners</h5>
            <p>Everyone else — genuinely good people who simply lack the knowledge to take a stand. They don't speak up because they don't know how. This is precisely the group the Champions Network is designed to help. Many of us have floated between all three groups at different points in life.</p>
          </div>
        </div>
        <h4>The Better Way</h4>
        <p>Goodrich argues there is a fourth path — grounded in <strong>biblical justice</strong>. The most important relationship any person can have is with God. And because God himself never coerces anyone into that relationship, no government has the authority to do so either. That's not just a Christian argument. That's an argument rooted in the very nature of God and the nature of humanity.</p>
        <div class="modal-pullquote">"Religious Liberty is about justice, biblical justice, rooted in the nature of God and in the nature of mankind." — Luke Goodrich, Free to Believe</div>`
    },
    'two-kingdoms-detail': {
      tag: 'Mom & Pop Paper #1',
      title: 'Two Kingdoms — In Depth',
      body: `
        <p>The Two Kingdom doctrine is the lens through which LCRL views every religious liberty question. It is simple enough to explain to a friend — and profound enough to shape every political and theological conversation.</p>
        <h4>God Preserves — The Left Hand Kingdom</h4>
        <p>Through governments, laws, courts, and civic institutions, God preserves the world. He keeps order. He restrains chaos. He uses imperfect, often ungodly people to accomplish this. The State is a servant of God for temporal good — even when the State doesn't know it.</p>
        <h4>God Saves — The Right Hand Kingdom</h4>
        <p>Through the Church, the Word, and the Sacraments, God saves. This is not the State's business. Government is not equipped to adjudicate salvation, theological truth, or religious conscience. When it tries, it always abuses power.</p>
        <h4>The Boundary Jesus Drew</h4>
        <div class="modal-pullquote">"Give to Caesar what is Caesar's, and to God what is God's." — Matthew 22:21</div>
        <p>This is not merely a tax principle. Jesus places a limit on Caesar. Not everything belongs to Caesar. Conscience, belief, worship, relationship with God — these are not Caesar's to govern. When government crosses that line, it violates a boundary God himself established.</p>
        <h4>Why This Matters for Champions</h4>
        <p>Every major religious liberty battle today — from what pastors may preach, to what Christian businesses may decline, to what Christian schools may teach — is ultimately a question about this boundary. Champions are trained to see it clearly, name it accurately, and defend it faithfully.</p>`
    },
    'ch2-detail': {
      tag: 'Free to Believe — Chapter 2',
      title: 'Why Did God Give Us the Ability to Reject Him?',
      body: `
        <p>This is one of the most powerful questions Goodrich raises in Chapter 2 — and the answer is at the heart of why religious liberty matters.</p>
        <div class="modal-pullquote">"If you forced someone to be with you, do you think that would work? Would that person love you back? The answer is NOPE." — Pastor Mark Frith</div>
        <h4>Love Requires Freedom</h4>
        <p>God gave humanity the ability to reject Him because He desires genuine relationship — not coerced compliance. Forced love is not love. Coerced faith is not faith. This is the greatest act of love: to give someone the freedom to say no, while continuing to pursue them.</p>
        <h4>The Implication for Government</h4>
        <p>If God himself refuses to coerce belief — despite having every right and every power to do so — then no human government has the moral standing to do what God himself will not do. This is the theological foundation beneath religious liberty.</p>
        <h4>Reading Tip from Pastor Frith</h4>
        <p>This section of Chapter 2 is one that Pastor Frith recommends reading and re-reading. "I read and reread this section. It quenched my thirst for knowledge." Underline the biblical references Goodrich provides. Let them seep into your knowledge banks.</p>
        <p>The goal: be able to explain <em>why</em> religious liberty matters — not just that it is in the Constitution, but why God's own nature demands it.</p>`
    },
    'ch3-detail': {
      tag: 'Free to Believe — Chapter 3',
      title: "Goodrich's Definition of Religious Liberty",
      body: `
        <p>Chapter 3 gives Champions a practical toolkit for talking with skeptics — neighbors, coworkers, friends who aren't convinced that religious freedom is worth protecting. Goodrich begins with a common misconception to correct:</p>
        <h4>The Misconception</h4>
        <div class="modal-pullquote">"Religious people get to do whatever they want and the government can't do anything about it."</div>
        <p>This is wrong — and Goodrich corrects it with his working definition:</p>
        <h4>The Definition</h4>
        <div class="modal-pullquote">"Religious liberty means the government, within reasonable limits, leaves religion alone as much as possible."</div>
        <p>It is not absolute. A person cannot kill someone in the name of religion and claim protection. But the default posture of government should be non-interference. When religious practice conflicts with a government rule, the government should look for accommodation rather than forcing compliance.</p>
        <h4>The Three Arguments (No Scripture Required)</h4>
        <div class="modal-arg">
          <div class="modal-arg-num">1</div>
          <div class="modal-arg-text">
            <h5>Religious freedom benefits society</h5>
            <p>Putnam's research + Georgetown's $1 trillion statistic + countless examples of religious communities driving civic good. This argument works with anyone.</p>
          </div>
        </div>
        <div class="modal-arg">
          <div class="modal-arg-num">2</div>
          <div class="modal-arg-text">
            <h5>Religious freedom protects our other rights</h5>
            <p>History shows that when governments gain control over conscience, every other freedom erodes. Religious liberty is often the first freedom to fall — and rarely the last.</p>
          </div>
        </div>
        <div class="modal-arg">
          <div class="modal-arg-num">3</div>
          <div class="modal-arg-text">
            <h5>Religious freedom is a fundamental human right</h5>
            <p>The most important relationship any person can have is with God. To restrict that relationship is to violate something foundational to what it means to be human.</p>
          </div>
        </div>`
    },
    hosanna: {
      tag: 'Case Study — Free to Believe Introduction',
      title: 'The Hosanna-Tabor Case',
      body: `
        <p>Luke Goodrich opens <em>Free to Believe</em> with this landmark case — an LCMS school in Redford, Michigan that became the center of a Supreme Court battle over religious freedom.</p>
        <h4>The Facts</h4>
        <p>Hosanna-Tabor Evangelical Lutheran Church and School employed a teacher who was both a commissioned minister and a classroom teacher. When the teacher became ill and the school moved on, she threatened to sue under the Americans with Disabilities Act.</p>
        <p>The school argued that the "ministerial exception" — a legal doctrine protecting churches' right to hire and fire religious leaders — applied. The teacher argued she was primarily a teacher, not a minister.</p>
        <h4>The Supreme Court</h4>
        <p>In 2012, the Supreme Court ruled <strong>unanimously (9-0)</strong> in favor of Hosanna-Tabor. Chief Justice Roberts wrote the opinion, affirming the ministerial exception as a First Amendment protection that prevents courts from interfering in a church's decisions about who will lead, teach, and carry out its religious mission.</p>
        <div class="modal-pullquote">"The interest of society in the enforcement of employment discrimination statutes is undoubtedly important. But so, too, is the interest of religious groups in choosing who will preach their beliefs, teach their faith, and carry out their mission." — Chief Justice John Roberts</div>
        <h4>Why Champions Need to Know This</h4>
        <p>The lawsuits today against Christians are far more aggressive and look to be unending. What happened in Redford could happen in your congregation — over who you hire, what your pastor preaches, what your school teaches, and who sits in your pews. The Champions Network exists so no church faces that fight alone.</p>`
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
  const answers = [1, 2, 1, 3, 2, 1, 2, 1, 1, 2]; // 0-indexed correct option
  const explanations = [
    '1 Peter 2:15–17 — "Live as people who are free… Fear God. Honor the Emperor" — is LCRL\'s foundational scripture and the lens for all Champions work.',
    'LCRL stands for the Lutheran Center for Religious Liberty, based in Washington, D.C.',
    'Goodrich identifies three types: the Pilgrims, the Martyrs, and the Beginners — each with a flawed approach to religious liberty.',
    'Study is Pillar One. Champions commit to staying informed — through books, articles, and round table conversations — so they can engage with confidence.',
    'Goodrich argues religious liberty is not defined by any constitution or philosophy, but is rooted in God\'s own design for humanity — particularly our creation in His image.',
    'Putnam\'s research found that involvement in a religious community is the single greatest predictor of civic engagement — above education, income, or geography.',
    'Matthew 22:21 is the defining text for Two Kingdom doctrine: Caesar has a legitimate role, but not everything belongs to Caesar. Conscience and belief belong to God.',
    'ADF (Alliance Defending Freedom) is the legal organization Pastor Frith recommends for tracking active religious liberty cases and staying informed.',
    'Goodrich\'s working definition: "The government, within reasonable limits, leaves religion alone as much as possible." Not absolute — but the default is non-interference.',
    'Goodrich\'s first argument is pragmatic: religious freedom benefits society. Putnam\'s research and Georgetown\'s $1 trillion finding make this case powerfully.'
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
        // Already answered
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
      sub.textContent = 'You\'ve mastered Session 002. You are ready to be the public voice of truth.';
    } else if (score >= 8) {
      msg.textContent = 'Well Done — Strong Understanding';
      sub.textContent = 'Review the sections where you missed and you\'ll be fully equipped.';
    } else if (score >= 6) {
      msg.textContent = 'Good Start — Keep Studying';
      sub.textContent = 'Go back through the Two Kingdoms and Free to Believe sections for reinforcement.';
    } else {
      msg.textContent = 'Keep Going — Every Champion Grows';
      sub.textContent = 'Review the full session and retake when ready. Pillar One is Study — keep at it!';
    }
    scoreEl.classList.add('show');
  }

  document.getElementById('quiz-retry').addEventListener('click', () => {
    currentQ = 0;
    score = 0;
    fill.style.width = '0%';
    document.getElementById('quiz-score').classList.remove('show');
    questions.forEach((qEl, qi) => {
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
