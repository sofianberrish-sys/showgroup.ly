/* Progressive section fades: content stays visible without JavaScript or observer support. */
(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = new Set();
  const root = document.documentElement;
  let manualStatic = false;
  let observer;

  function reveal(element) {
    element.classList.add('is-visible');
    observer?.unobserve(element);
  }

  function register(scope = document) {
    const selectors = [
      '.intro > *', '.section-heading', '.filters', '.work',
      '.service-list article', '.about-image', '.about-copy',
      '.process > h2', '.steps article', '.contact > *',
    ].join(',');
    scope.querySelectorAll(selectors).forEach((element, index) => {
      if (targets.has(element)) return;
      targets.add(element);
      element.style.setProperty('--reveal-delay', (index % 3) * 65 + 'ms');
      element.classList.add('section-reveal');
      // Already visible content must never disappear when the enhancement loads.
      if (preference.matches || manualStatic || element.getBoundingClientRect().top < innerHeight) {
        reveal(element);
      } else {
        observer.observe(element);
      }
    });
  }

  function resetMode() {
    const disabled = preference.matches || manualStatic;
    root.classList.toggle('site-static', disabled);
    if (disabled) targets.forEach(reveal);
  }

  try {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { rootMargin: '0px 0px -24px 0px', threshold: .06 });
    root.classList.add('section-motion-ready');
    register();
    resetMode();
  } catch {
    root.classList.remove('section-motion-ready');
    return;
  }

  document.addEventListener('showgroup:gallery-updated', () => {
    // Drop detached cards after filtering so repeated browsing does not retain old nodes.
    targets.forEach(element => {
      if (!element.isConnected) {
        observer.unobserve(element);
        targets.delete(element);
      }
    });
    register(document.getElementById('gallery'));
  });
  document.addEventListener('showgroup:motion-mode', event => {
    manualStatic = Boolean(event.detail?.static);
    resetMode();
  });
  document.addEventListener('focusin', event => {
    const card = event.target.closest('.section-reveal');
    if (card) reveal(card);
  });
  preference.addEventListener('change', resetMode);
})();
