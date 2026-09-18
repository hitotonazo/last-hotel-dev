(() => {
  'use strict';

  let playing = false;
  let scrollPosition = 0;
  let previousFocus = null;

  const focusWithoutRing = (element) => {
    if (!(element instanceof HTMLElement)) return;
    element.classList.add('site-alteration-focus-target');
    element.addEventListener('blur', () => element.classList.remove('site-alteration-focus-target'), { once: true });
    element.focus({ preventScroll: true });
  };

  const ensureOverlay = (message) => {
    let overlay = document.querySelector('[data-site-alteration-overlay]');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'site-alteration-overlay';
    overlay.dataset.siteAlterationOverlay = '';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '画面演出');
    overlay.innerHTML = `<div class="site-alteration-overlay__noise" aria-hidden="true"></div><div class="site-alteration-overlay__message" data-site-alteration-message tabindex="-1"><p role="status"></p></div>`;
    overlay.querySelector('p').textContent = message;
    document.body.append(overlay);
    return overlay;
  };

  const lockPage = () => {
    scrollPosition = window.scrollY;
    document.documentElement.classList.add('is-site-alteration-locked');
    Object.assign(document.body.style, { position: 'fixed', top: `-${scrollPosition}px`, right: '0', left: '0', width: '100%' });
  };

  const unlockPage = () => {
    document.documentElement.classList.remove('is-site-alteration-locked');
    Object.assign(document.body.style, { position: '', top: '', right: '', left: '', width: '' });
    window.scrollTo(0, scrollPosition);
  };

  const play = ({ onChange, focusTarget, message = 'サイトが改変されました', duration = 1500, changeAt = 650 } = {}) => {
    if (playing) return Promise.resolve(false);
    const overlay = ensureOverlay(message);
    const messageElement = overlay.querySelector('[data-site-alteration-message]');
    messageElement?.querySelector('p') && (messageElement.querySelector('p').textContent = message);
    playing = true;
    previousFocus = document.activeElement;
    lockPage();
    document.body.classList.add('is-site-altering');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.onkeydown = (event) => { if (event.key === 'Tab') event.preventDefault(); };
    focusWithoutRing(messageElement);

    return new Promise((resolve) => {
      window.setTimeout(() => { if (typeof onChange === 'function') onChange(); }, changeAt);
      window.setTimeout(() => {
        document.body.classList.remove('is-site-altering');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.onkeydown = null;
        unlockPage();
        playing = false;
        if (focusTarget) {
          focusTarget.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
          focusWithoutRing(focusTarget);
        } else focusWithoutRing(previousFocus);
        resolve(true);
      }, duration);
    });
  };

  window.SiteAlteration = { play, isPlaying: () => playing };
  // Existing pages can migrate gradually.
  window.MikageAlteration = window.SiteAlteration;
})();
