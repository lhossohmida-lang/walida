/* ===================================================
   WALIDA — Landing Page JavaScript
   Scroll-Snap Navigation + Local Video Control
   =================================================== */

'use strict';

(function () {
  // ─── State ───────────────────────────────────────
  let currentIndex = 0;
  let isScrolling  = false;
  const TOTAL      = 6;
  const SNAP_DELAY = 900;

  // ─── DOM refs ────────────────────────────────────
  const scroller    = document.getElementById('scroller');
  const panels      = Array.from(document.querySelectorAll('.panel'));
  const dots        = Array.from(document.querySelectorAll('.dot'));
  const progressBar = document.getElementById('progressBar');
  const scrollArrow = document.getElementById('scrollArrow');
  const heroBtn     = document.getElementById('heroCtaBtn');

  // Collect all video elements indexed by panel index
  const videos = {};
  document.querySelectorAll('.panel__video').forEach((vid) => {
    const idx = parseInt(vid.closest('.panel').dataset.index);
    videos[idx] = vid;
  });

  // ─── Play/Pause video for given panel ───────────
  function activateVideo(index) {
    Object.entries(videos).forEach(([i, vid]) => {
      const panelIdx = parseInt(i);
      if (panelIdx === index) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }

  // ─── Navigate to panel ──────────────────────────
  function goTo(index) {
    if (index < 0 || index >= TOTAL) return;
    currentIndex = index;
    const target = panels[index];
    scroller.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    updateUI(index);
  }

  // ─── Update UI on panel change ──────────────────
  function updateUI(index) {
    // Progress bar
    progressBar.style.width = ((index / (TOTAL - 1)) * 100) + '%';

    // Dots
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    // Arrow
    scrollArrow.classList.toggle('hidden', index >= TOTAL - 1);

    // Active class on panels (triggers CSS animations)
    panels.forEach((p, i) => p.classList.toggle('active', i === index));

    // Videos
    activateVideo(index);
  }

  // ─── Scroll event → detect current panel ────────
  let scrollTimer = null;
  scroller.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const newIndex = Math.round(scroller.scrollTop / window.innerHeight);
      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        updateUI(newIndex);
      }
    }, 50);
  }, { passive: true });

  // ─── Wheel / trackpad snapping ───────────────────
  let wheelAccum = 0;
  let wheelTimer = null;

  scroller.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    wheelAccum += e.deltaY;

    if (Math.abs(wheelAccum) >= 60) {
      const dir = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;

      if (dir > 0 && currentIndex < TOTAL - 1) {
        isScrolling = true;
        goTo(currentIndex + 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      } else if (dir < 0 && currentIndex > 0) {
        isScrolling = true;
        goTo(currentIndex - 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      }
    }

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelAccum = 0; }, 250);
  }, { passive: true });

  // ─── Touch swipe ─────────────────────────────────
  let touchStartY = 0;
  let touchStartT = 0;

  scroller.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartT = Date.now();
  }, { passive: true });

  scroller.addEventListener('touchend', (e) => {
    if (isScrolling) return;
    const dy  = touchStartY - e.changedTouches[0].clientY;
    const dt  = Date.now() - touchStartT;
    const vel = Math.abs(dy) / dt;

    if (Math.abs(dy) > 40 || vel > 0.3) {
      const dir = dy > 0 ? 1 : -1;
      if (dir > 0 && currentIndex < TOTAL - 1) {
        isScrolling = true;
        goTo(currentIndex + 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      } else if (dir < 0 && currentIndex > 0) {
        isScrolling = true;
        goTo(currentIndex - 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      }
    }
  }, { passive: true });

  // ─── Keyboard navigation ─────────────────────────
  document.addEventListener('keydown', (e) => {
    if (isScrolling) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentIndex < TOTAL - 1) {
        isScrolling = true;
        goTo(currentIndex + 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        isScrolling = true;
        goTo(currentIndex - 1);
        setTimeout(() => { isScrolling = false; }, SNAP_DELAY);
      }
    }
  });

  // ─── Dot nav ──────────────────────────────────────
  dots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
  });

  // ─── Scroll arrow ─────────────────────────────────
  scrollArrow.addEventListener('click', () => {
    if (currentIndex < TOTAL - 1) goTo(currentIndex + 1);
  });

  // ─── Hero CTA ─────────────────────────────────────
  if (heroBtn) heroBtn.addEventListener('click', () => goTo(1));

  // ─── Intersection Observer (fallback) ────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        const idx = parseInt(entry.target.dataset.index);
        if (idx !== currentIndex) {
          currentIndex = idx;
          updateUI(idx);
        }
      }
    });
  }, { root: scroller, threshold: [0.6] });

  panels.forEach((p) => observer.observe(p));

  // ─── Init ──────────────────────────────────────────
  function init() {
    panels[0].classList.add('active');
    dots[0].classList.add('active');
    progressBar.style.width = '0%';

    // Start hero video
    const v0 = videos[0];
    if (v0) {
      v0.play().catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
