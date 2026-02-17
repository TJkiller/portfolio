/**
 * script.js — Thato Motsepe Portfolio
 *
 * Modules:
 *  1.  Theme toggle (dark / light, persisted via localStorage)
 *  2.  Sticky header (blur background on scroll)
 *  3.  Custom cursor (desktop only, with hover expand)
 *  4.  Mobile navigation drawer
 *  5.  Scroll-reveal animations (IntersectionObserver)
 *  6.  Active nav link scroll spy (IntersectionObserver)
 *  7.  Portfolio filter (show/hide cards by category)
 *  8.  Scroll-to-top button
 *  9.  Footer year
 * 10.  Smooth anchor scrolling
 * 11.  FormSubmit redirect (set next URL dynamically)
 */

'use strict';

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element|null}
 */
const qs  = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll — returns a real Array
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element[]}
 */
const qsa = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Throttle — ensures fn fires at most once per `delay` ms
 * @param {Function} fn
 * @param {number} [delay=100]
 * @returns {Function}
 */
function throttle(fn, delay = 100) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}


/* ============================================================
   1. THEME TOGGLE
   ============================================================ */

function initTheme() {
  const html        = document.documentElement;
  const btn         = qs('#theme-toggle');
  const STORAGE_KEY = 'tm-theme';

  // Apply saved preference (default: dark)
  const saved = localStorage.getItem(STORAGE_KEY) ?? 'dark';
  html.setAttribute('data-theme', saved);

  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  });
}


/* ============================================================
   2. STICKY HEADER
   ============================================================ */

function initStickyHeader() {
  const header = qs('#site-header');
  if (!header) return;

  const update = throttle(() => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, 80);

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* ============================================================
   3. CUSTOM CURSOR
   ============================================================ */

function initCursor() {
  // Only on pointer-capable (non-touch) devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const cursor     = qs('.cursor');
  const cursorRing = qs('.cursor-ring');
  if (!cursor || !cursorRing) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Animate with lerp for the trailing ring
  function tick() {
    cursor.style.left = `${mouseX}px`;
    cursor.style.top  = `${mouseY}px`;

    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top  = `${ringY}px`;

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Expand ring on hover of interactive elements
  const hoverSelector = 'a, button, [role="button"], input, textarea, .filter-btn, .project-card, .skill-item';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) cursorRing.classList.add('hovered');
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) cursorRing.classList.remove('hovered');
  });
}


/* ============================================================
   4. MOBILE NAVIGATION DRAWER
   ============================================================ */

function initMobileNav() {
  const burger   = qs('#burger');
  const navLinks = qs('#nav-links');
  const overlay  = qs('#mobile-overlay');
  if (!burger || !navLinks || !overlay) return;

  const open = () => {
    navLinks.classList.add('open');
    overlay.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    navLinks.classList.remove('open');
    overlay.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', () => {
    navLinks.classList.contains('open') ? close() : open();
  });

  // Close on nav link click
  qsa('.nav-link').forEach(link => link.addEventListener('click', close));

  // Close on overlay click
  overlay.addEventListener('click', close);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) close();
  });
}


/* ============================================================
   5. SCROLL-REVEAL ANIMATIONS
   ============================================================ */

function initScrollReveal() {
  const targets = qsa('[data-animate]');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el    = entry.target;
      const delay = parseInt(el.dataset.delay ?? '0', 10);

      setTimeout(() => el.classList.add('revealed'), delay);

      observer.unobserve(el); // animate once only
    });
  }, {
    threshold:  0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  targets.forEach(el => observer.observe(el));
}


/* ============================================================
   6. SCROLL SPY — active nav link highlighting
   ============================================================ */

function initScrollSpy() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link[data-section]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}


/* ============================================================
   7. PORTFOLIO FILTER
   ============================================================ */

function initProjectFilter() {
  const filterBtns = qsa('.filter-btn');
  const cards      = qsa('.project-card');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const cat     = card.dataset.category;
        const matches = filter === 'all' || cat === filter;

        if (matches) {
          card.classList.remove('hidden');
          // Re-trigger reveal animation
          card.classList.remove('revealed');
          requestAnimationFrame(() => {
            setTimeout(() => card.classList.add('revealed'), 10);
          });
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}


/* ============================================================
   8. SCROLL-TO-TOP BUTTON
   ============================================================ */

function initScrollToTop() {
  const btn = qs('#scroll-top');
  if (!btn) return;

  const toggle = throttle(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, 100);

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   9. FOOTER YEAR
   ============================================================ */

function initFooterYear() {
  const el = qs('#year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ============================================================
   10. SMOOTH ANCHOR SCROLLING
       (accounts for fixed header height)
   ============================================================ */

function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (href === '#') return;

    const target = qs(href);
    if (!target) return;

    e.preventDefault();

    const headerH = qs('#site-header')?.offsetHeight ?? 0;
    const top     = target.getBoundingClientRect().top + window.scrollY - headerH - 16;

    window.scrollTo({ top, behavior: 'smooth' });
  });
}


/* ============================================================
   11. FORMSUBMIT — set dynamic redirect URL
       So the form returns the user to the current page
       after a successful submission.
   ============================================================ */

function initFormRedirect() {
  const nextInput = qs('#form-next-url');
  if (nextInput) {
    nextInput.value = window.location.href;
  }
}


/* ============================================================
   INIT — run all modules once DOM is ready
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initStickyHeader();
  initCursor();
  initMobileNav();
  initScrollReveal();
  initScrollSpy();
  initProjectFilter();
  initScrollToTop();
  initFooterYear();
  initSmoothScroll();
  initFormRedirect();
});