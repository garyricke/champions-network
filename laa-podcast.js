/* ============================================================
   Liberty Action Alert — Podcast Series Page
   laa-podcast.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     NAV SCROLL + MOBILE
     ============================================================ */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  hamburger?.addEventListener('click', () => mobileNav.classList.toggle('open'));
  document.querySelectorAll('.nav-mobile a').forEach(a =>
    a.addEventListener('click', () => mobileNav.classList.remove('open'))
  );

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 16;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ============================================================
     AUDIO PLAYERS
     ============================================================ */
  const players = [];

  function fmt(s) {
    if (isNaN(s) || s === Infinity || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  document.querySelectorAll('.audio-player').forEach((container, idx) => {
    const audio       = container.querySelector('audio');
    const playBtn     = container.querySelector('.player-ctrl-play');
    const playIcon    = container.querySelector('.play-icon-play');
    const pauseIcon   = container.querySelector('.play-icon-pause');
    const track       = container.querySelector('.player-track');
    const fill        = container.querySelector('.player-fill');
    const timeCur     = container.querySelector('.time-current');
    const timeDur     = container.querySelector('.time-duration');

    const player = {
      container, audio, isPlaying: false,
      play() {
        // pause all others first
        players.forEach(p => { if (p !== this && p.isPlaying) p.pause(); });
        audio.play().catch(() => {});
        this.isPlaying = true;
        container.classList.add('is-playing');
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      },
      pause() {
        audio.pause();
        this.isPlaying = false;
        container.classList.remove('is-playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      },
      toggle() { this.isPlaying ? this.pause() : this.play(); }
    };
    players.push(player);

    playBtn.addEventListener('click', () => player.toggle());

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = pct + '%';
      if (timeCur) timeCur.textContent = fmt(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      if (timeDur) timeDur.textContent = fmt(audio.duration);
    });

    audio.addEventListener('ended', () => {
      player.pause();
      fill.style.width = '0%';
      audio.currentTime = 0;
      if (timeCur) timeCur.textContent = '0:00';
    });

    // Seek — click + drag
    let dragging = false;
    function seekTo(e) {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (audio.duration) audio.currentTime = pct * audio.duration;
    }
    track.addEventListener('mousedown', e => { dragging = true; seekTo(e); e.preventDefault(); });
    document.addEventListener('mousemove', e => { if (dragging) seekTo(e); });
    document.addEventListener('mouseup', () => { dragging = false; });

    // Touch seek
    track.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      if (audio.duration) audio.currentTime = pct * audio.duration;
    }, { passive: true });

    // Skip ±15s
    container.querySelector('.skip-back')?.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    container.querySelector('.skip-fwd')?.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
    });
  });

  /* ============================================================
     EPISODE CHIPS → SCROLL TO PLAYER & PLAY
     ============================================================ */
  document.querySelectorAll('[data-ep-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      const num = chip.getAttribute('data-ep-chip');
      const target = document.querySelector(`[data-player="${num}"]`);
      if (target) {
        const offset = nav.offsetHeight + 24;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        setTimeout(() => {
          const idx = parseInt(num, 10) - 1;
          if (players[idx] && !players[idx].isPlaying) players[idx].play();
        }, 700);
      }
    });
  });

  /* ============================================================
     TABS (reusable — supports multiple tab groups on page)
     ============================================================ */
  function initTabs(navSel, panelSel, tabAttr, panelAttr) {
    const navEl = document.querySelector(navSel);
    if (!navEl) return;
    const btns   = navEl.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll(panelSel);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute(tabAttr);
        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector(`[${panelAttr}="${target}"]`)?.classList.add('active');
      });
    });
  }

  initTabs('#themes-nav',  '.theme-panel',   'data-tab', 'data-theme');
  initTabs('#network-nav', '.network-panel', 'data-tab', 'data-net');

  /* ============================================================
     ACCORDION (pillars + principles)
     ============================================================ */
  document.querySelectorAll('.acc-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item  = trigger.closest('.acc-item');
      const group = item.closest('.accordion');
      const isOpen = item.classList.contains('open');
      // close all siblings
      group.querySelectorAll('.acc-item.open').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  /* ============================================================
     CASE MODALS
     ============================================================ */
  const overlay   = document.getElementById('modal-overlay');
  const modalTag  = document.getElementById('modal-case-tag');
  const modalName = document.getElementById('modal-case-name');
  const modalSub  = document.getElementById('modal-case-sub');
  const modalBody = document.getElementById('modal-case-body');

  const cases = {
    phillips: {
      tag:  'Religious Liberty Case',
      name: 'Jack Phillips',
      sub:  'Masterpiece Cakeshop · Lakewood, Colorado',
      body: `
        <p>Jack Phillips is a Christian baker who has been fighting for his freedom of conscience since 2012 — when he respectfully declined to create a custom cake celebrating a same-sex wedding, citing sincerely held religious convictions about marriage.</p>
        <p>What followed was more than a decade of legal battles. The Colorado Civil Rights Commission ruled against him multiple times. The Supreme Court issued a narrow ruling in his favor in 2018 — but on procedural grounds, not the broader principle. New lawsuits came immediately.</p>
        <div class="modal-quote">
          "When we make headlines, people give me a lot of attention. But then that attention goes away and I feel like I'm all by myself facing this. Now they're coming after my family."
          <cite>— Jack Phillips, as recounted by Dr. Gregory Seltz on the Liberty Action Alert</cite>
        </div>
        <p>Jack nearly lost his business multiple times across the years. His case is a defining illustration of why the Champions Network insists: <em>the process itself becomes the punishment</em>. Years of legal exposure, financial drain, and personal targeting — even after winning.</p>
        <p>The Champions Network exists so that believers like Jack Phillips are never left standing alone.</p>`
    },
    smith: {
      tag:  'First Amendment · Creative Expression',
      name: 'Lorie Smith',
      sub:  '303 Creative · Denver, Colorado',
      body: `
        <p>Lorie Smith is a web designer who creates websites celebrating personal stories and milestones. As a Christian, she believes marriage is between a man and a woman — and she didn't want to design wedding websites that would contradict that conviction.</p>
        <p>Rather than wait to be targeted, Lorie filed a preemptive lawsuit to protect her First Amendment right to freedom of creative expression. What followed was seven years of legal limbo — unable to fully operate her business while the case worked through the courts.</p>
        <div class="modal-quote">
          "The process becomes the punishment. Seven years. Think about that — who among us could survive seven years without being able to freely run their business?"
          <cite>— Rev. Mark Frith, Liberty Action Alert, August 2023</cite>
        </div>
        <p>The Supreme Court ultimately ruled in Lorie's favor in June 2023 — just weeks before these Liberty Action Alert episodes were recorded. A genuine victory. But it took a decade of her life to get there.</p>
        <p>Her story is why the Champions Network trains ordinary believers to understand these issues early, engage them confidently, and stand together — before the lawsuit comes.</p>`
    },
    stutzman: {
      tag:  'Conscience & the Power of the State',
      name: 'Barronelle Stutzman',
      sub:  "Arlene's Flowers · Richland, Washington",
      body: `
        <p>Barronelle Stutzman ran a beloved flower shop in Richland, Washington for over thirty years. She was known and loved throughout her community — including by her gay customers, some of whom she counted among her dearest friends.</p>
        <p>When a longtime customer asked her to provide flowers for his same-sex wedding, Barronelle gently declined — explaining her Christian beliefs about marriage. She expected a difficult conversation between old friends. What happened next was something else entirely.</p>
        <div class="modal-quote">
          "It wasn't even the neighborhood that brought the lawsuit. It was some state department that heard she had said no. And they bankrupted a grandmother. I said to people — how in the world can you say that this is a good thing?"
          <cite>— Rev. Mark Frith, Liberty Action Alert, August 2023</cite>
        </div>
        <p>The state of Washington — not the customer — brought the lawsuit. They pursued not just her business assets, but her personal assets as well. After years of legal battle, Barronelle was forced to sell her shop and retire. The community that loved her watched it happen.</p>
        <p>Her case makes the sharpest possible argument for why religious liberty must be defended for everyone — not because the church wants to force its views on others, but because the state must never be allowed to force its views on the church.</p>`
    }
  };

  document.querySelectorAll('[data-case]').forEach(card => {
    card.addEventListener('click', () => {
      const key  = card.getAttribute('data-case');
      const data = cases[key];
      if (!data) return;
      modalTag.textContent  = data.tag;
      modalName.textContent = data.name;
      modalSub.textContent  = data.sub;
      modalBody.innerHTML   = data.body;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

});
