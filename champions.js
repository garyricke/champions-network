/* ============================================================
   Champions for Religious Liberty Network — Landing Page JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- NAV SCROLL BEHAVIOR --- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- MOBILE NAV TOGGLE --- */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  hamburger?.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
  document.querySelectorAll('.nav-mobile a').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });

  /* --- SMOOTH SCROLL FOR ALL ANCHOR LINKS --- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = document.querySelector('.nav').offsetHeight + 16;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     WHO WE ARE — TABS
     ============================================================ */
  initTabs('.tabs-nav', '.tab-btn', '.tab-panel', 'data-tab', 'data-panel');

  function initTabs(navSel, btnSel, panelSel, btnAttr, panelAttr) {
    const navEl = document.querySelector(navSel);
    if (!navEl) return;
    const btns = navEl.querySelectorAll(btnSel);
    const panels = document.querySelectorAll(panelSel);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute(btnAttr);
        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector(`[${panelAttr}="${target}"]`)?.classList.add('active');
      });
    });
  }

  /* ============================================================
     GET STARTED — TABS
     ============================================================ */
  const startedBtns = document.querySelectorAll('.started-tab-btn');
  const startedPanels = document.querySelectorAll('.started-panel');
  startedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.started;
      startedBtns.forEach(b => b.classList.remove('active'));
      startedPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-started-panel="${target}"]`)?.classList.add('active');
    });
  });

  /* ============================================================
     ACCORDION
     ============================================================ */
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      // Toggle clicked
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ============================================================
     TIER CAROUSEL
     ============================================================ */
  const tierTrack = document.querySelector('.tier-track');
  const tierSlides = document.querySelectorAll('.tier-slide');
  const tierDots = document.querySelectorAll('.tier-dot');
  const tierStepBtns = document.querySelectorAll('.tier-step-btn');
  const tierPrev = document.querySelector('.tier-prev');
  const tierNext = document.querySelector('.tier-next');
  let tierCurrent = 0;
  const tierTotal = tierSlides.length;

  function goToTier(idx) {
    tierCurrent = (idx + tierTotal) % tierTotal;
    tierTrack.style.transform = `translateX(-${tierCurrent * 100}%)`;
    tierDots.forEach((d, i) => d.classList.toggle('active', i === tierCurrent));
    tierStepBtns.forEach((b, i) => b.classList.toggle('active', i === tierCurrent));
  }

  tierPrev?.addEventListener('click', () => goToTier(tierCurrent - 1));
  tierNext?.addEventListener('click', () => goToTier(tierCurrent + 1));
  tierDots.forEach((dot, i) => dot.addEventListener('click', () => goToTier(i)));
  tierStepBtns.forEach((btn, i) => btn.addEventListener('click', () => goToTier(i)));
  goToTier(0);

  /* Touch swipe support for tier carousel */
  let tierTouchStartX = 0;
  tierTrack?.addEventListener('touchstart', e => { tierTouchStartX = e.touches[0].clientX; }, { passive: true });
  tierTrack?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tierTouchStartX;
    if (Math.abs(dx) > 50) goToTier(dx < 0 ? tierCurrent + 1 : tierCurrent - 1);
  });

  /* ============================================================
     BLOG CAROUSEL
     ============================================================ */
  const blogTrack = document.querySelector('.blog-carousel-track');
  const blogCards = document.querySelectorAll('.blog-card');
  const blogPrev = document.querySelector('.blog-prev');
  const blogNext = document.querySelector('.blog-next');
  const blogDots = document.querySelectorAll('.blog-dot');
  let blogCurrent = 0;

  function getVisibleBlogCards() {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    return 3;
  }

  function getBlogCardWidth() {
    if (!blogCards.length) return 0;
    return blogCards[0].offsetWidth + 24; // 24 = gap
  }

  function goToBlog(idx) {
    const visible = getVisibleBlogCards();
    const maxIdx = Math.max(0, blogCards.length - visible);
    blogCurrent = Math.max(0, Math.min(idx, maxIdx));
    const offset = blogCurrent * getBlogCardWidth();
    if (blogTrack) blogTrack.style.transform = `translateX(-${offset}px)`;
    blogDots.forEach((d, i) => d.classList.toggle('active', i === blogCurrent));
  }

  blogPrev?.addEventListener('click', () => goToBlog(blogCurrent - 1));
  blogNext?.addEventListener('click', () => goToBlog(blogCurrent + 1));
  blogDots.forEach((dot, i) => dot.addEventListener('click', () => goToBlog(i)));
  window.addEventListener('resize', () => goToBlog(0));

  /* Blog touch swipe */
  let blogTouchStartX = 0;
  blogTrack?.addEventListener('touchstart', e => { blogTouchStartX = e.touches[0].clientX; }, { passive: true });
  blogTrack?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - blogTouchStartX;
    if (Math.abs(dx) > 50) goToBlog(dx < 0 ? blogCurrent + 1 : blogCurrent - 1);
  });

  /* ============================================================
     MODALS — generic system
     data-modal-open="id"  → opens modal#id
     data-modal-close      → closes parent .modal-overlay
     ============================================================ */
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    trigger.addEventListener('click', () => openModal(trigger.dataset.modalOpen));
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(o => closeModal(o));
    }
  });

  /* ============================================================
     CONTACT FORM — Netlify
     ============================================================ */
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const submitBtn = contactForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
      if (res.ok) {
        contactForm.innerHTML = `
          <div style="text-align:center;padding:2rem 0;">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#BB8C3A;margin:0 auto 1rem;display:block;">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
            <h4 style="color:#055A81;margin-bottom:0.5rem;">Message Received!</h4>
            <p style="color:#3d5166;font-size:0.9rem;">Rev. Mark Frith will be in touch with you shortly.<br>You can also <a href="https://calendly.com/markfrith/30min" target="_blank" rel="noopener" style="color:#0876A9;font-weight:600;">schedule directly via Calendly</a>.</p>
          </div>`;
      } else {
        throw new Error('Network error');
      }
    } catch {
      submitBtn.textContent = 'Try Again';
      submitBtn.disabled = false;
      alert('Something went wrong. Please email Mark.Frith@LCRLfreedom.org directly.');
    }
  });

  /* ============================================================
     SCROLL REVEAL — lightweight intersection observer
     ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('revealed'));
  }

});
