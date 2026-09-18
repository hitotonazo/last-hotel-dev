(() => {
  'use strict';

  const STORAGE_KEY = 'hotelNestraState';
  const PHASES = ['phase0', 'phase1', 'phase2', 'phase3', 'phase4', 'truth', 'ending'];
  const INITIAL_STATE = {
    phase: 'phase0',
    discovered031: false,
    internal031Viewed: false,
    discovered10F: false,
    specialGuestsViewed: false,
    discoveredElevator2021: false,
    discoveredRenovation: false,
    discoveredB2: false,
    undergroundStep: 1,
    undergroundViewed: false,
    truthReached: false,
    truthAlterationPlayed: false,
    endingTriggered: false
  };
  let interactionLocked = false;

  const readState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return { ...INITIAL_STATE };
      const state = { ...INITIAL_STATE, ...parsed };
      return PHASES.includes(state.phase) ? state : { ...INITIAL_STATE };
    } catch {
      return { ...INITIAL_STATE };
    }
  };

  const writeState = (state) => {
    const next = { ...INITIAL_STATE, ...state };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  };

  const resetProgress = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const stateForPhase = (phase) => {
    const phaseIndex = PHASES.indexOf(phase);
    const state = { ...INITIAL_STATE, phase: phaseIndex >= 0 ? phase : 'phase0' };
    if (phaseIndex >= 1) Object.assign(state, { discovered031: true, internal031Viewed: true });
    if (phaseIndex >= 2) state.discovered10F = true;
    if (phaseIndex >= 3) Object.assign(state, { specialGuestsViewed: true, discoveredElevator2021: true });
    if (phaseIndex >= 4) Object.assign(state, { discoveredRenovation: true, discoveredB2: true, undergroundStep: 1 });
    if (phaseIndex >= 5) Object.assign(state, { undergroundStep: 5, undergroundViewed: true, truthReached: true, truthAlterationPlayed: true });
    if (phaseIndex >= 6) state.endingTriggered = true;
    return state;
  };

  const setHidden = (element, hidden) => { if (element) element.hidden = hidden; };

  const renderProgress = () => {
    const state = readState();
    document.documentElement.dataset.gamePhase = state.phase;

    setHidden(document.querySelector('[data-record-031]'), !state.discovered031 || state.endingTriggered);
    document.querySelectorAll('[data-discover-031]').forEach((button) => setHidden(button, state.discovered031));

    const floorMap = document.querySelector('[data-floor-map]');
    if (floorMap) {
      const hiddenFloor = state.discovered031;
      floorMap.src = hiddenFloor ? 'images/floor-map-hidden.png' : 'images/floor-map-normal.png';
      floorMap.alt = hiddenFloor ? '10階の特別宿泊フロアと2021年増設の業務用エレベーターを含む館内図' : '地下1階から9階までのHOTEL NESTRA館内図';
    }
    setHidden(document.querySelector('[data-discover-10f]'), !state.discovered031);
    const renovationButton = document.querySelector('[data-discover-renovation]');
    setHidden(renovationButton, !state.discoveredElevator2021 || state.discoveredRenovation);
    renovationButton?.closest('.archive__media')?.classList.toggle('is-anomalous', state.discoveredElevator2021 && !state.discoveredRenovation);
    setHidden(document.querySelector('[data-construction-record]'), !state.discoveredRenovation);
    setHidden(document.querySelector('.image-hotspot--b2'), !state.discoveredRenovation);
    document.querySelectorAll('[data-underground-denied]').forEach((element) => setHidden(element, state.discoveredB2));
    document.querySelectorAll('[data-underground-granted]').forEach((element) => setHidden(element, !state.discoveredB2));
    document.querySelectorAll('[data-truth-denied]').forEach((element) => setHidden(element, state.truthReached));
    document.querySelectorAll('[data-truth-granted]').forEach((element) => setHidden(element, !state.truthReached));
    document.querySelectorAll('[data-guests-denied]').forEach((element) => setHidden(element, state.discovered10F));
    document.querySelectorAll('[data-guests-granted]').forEach((element) => setHidden(element, !state.discovered10F));
    document.querySelectorAll('[data-guest-031]').forEach((element) => setHidden(element, state.endingTriggered));
    document.querySelectorAll('[data-gallery-031-image]').forEach((image) => {
      const endingSrc = image.dataset.endingSrc;
      if (state.endingTriggered && endingSrc) image.src = endingSrc;
    });

    setHidden(document.querySelector('[data-ending-content]'), !state.endingTriggered);
  };

  const discover = ({ button, patch, message, focusTarget, afterEffect }) => {
    if (interactionLocked || window.SiteAlteration?.isPlaying()) return;
    interactionLocked = true;
    button.disabled = true;
    const applyChange = () => {
      writeState({ ...readState(), ...patch });
      renderProgress();
    };
    const effect = window.SiteAlteration?.play({ message, onChange: applyChange, focusTarget });
    if (!effect) {
      applyChange();
      interactionLocked = false;
      afterEffect?.();
      return;
    }
    effect.then(() => afterEffect?.()).finally(() => { interactionLocked = false; });
  };

  const initGame = () => {
    renderProgress();
    document.querySelectorAll('[data-discover-031]').forEach((button) => button.addEventListener('click', () => {
      if (readState().discovered031) return;
      discover({ button, patch: { phase: 'phase1', discovered031: true, internal031Viewed: true }, message: 'サイトが改変されました', focusTarget: document.querySelector('[data-record-031]') });
    }));
    document.querySelector('[data-discover-10f]')?.addEventListener('click', (event) => {
      const state = readState();
      if (!state.discovered031) return;
      if (state.discovered10F) {
        window.location.href = 'guests.html';
        return;
      }
      discover({ button: event.currentTarget, patch: { phase: 'phase2', discovered10F: true }, message: 'サイトが改変されました', afterEffect: () => { window.location.href = 'guests.html'; } });
    });
    document.querySelector('[data-discover-renovation]')?.addEventListener('click', (event) => {
      const state = readState();
      if (!state.discoveredElevator2021 || state.discoveredRenovation) return;
      discover({ button: event.currentTarget, patch: { phase: 'phase3', discoveredRenovation: true }, message: 'サイトが改変されました', focusTarget: document.querySelector('[data-construction-record]') });
    });
    document.querySelector('.image-hotspot--b2')?.addEventListener('click', (event) => {
      event.preventDefault();
      const state = readState();
      if (!state.discoveredRenovation) return;
      if (state.discoveredB2) {
        window.location.href = 'underground.html';
        return;
      }
      discover({ button: event.currentTarget, patch: { phase: 'phase4', discoveredB2: true, undergroundStep: 1 }, message: 'サイトが改変されました', afterEffect: () => { window.location.href = 'underground.html'; } });
    });
    const guestsGranted = document.querySelector('[data-guests-granted]');
    if (guestsGranted && readState().discovered10F && !readState().specialGuestsViewed) {
      writeState({ ...readState(), specialGuestsViewed: true });
    }
    document.querySelector('[data-complete-guests]')?.addEventListener('click', (event) => {
      event.preventDefault();
      writeState({ ...readState(), phase: 'phase3', specialGuestsViewed: true, discoveredElevator2021: true });
      window.location.href = 'index.html';
    });
    document.querySelector('[data-unlock-truth]')?.addEventListener('click', (event) => {
      const state = readState();
      if (!state.discoveredB2) return;
      if (state.truthReached && state.truthAlterationPlayed) {
        window.location.href = 'truth.html';
        return;
      }
      discover({ button: event.currentTarget, patch: { phase: 'truth', undergroundStep: 5, undergroundViewed: true, truthReached: true, truthAlterationPlayed: true }, message: 'サイトが改変されました', afterEffect: () => { window.location.href = 'truth.html'; } });
    });
    addEventListener('pageshow', renderProgress);
  };

  const initUndergroundReveal = () => {
    const records = [...document.querySelectorAll('[data-underground-record]')];
    if (!records.length || !readState().discoveredB2) return;
    const reveal = (record, index) => {
      record.classList.add('is-visible');
      const state = readState();
      const step = index + 1;
      if ((Number(state.undergroundStep) || 1) < step) writeState({ ...state, undergroundStep: step });
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      records.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = records.indexOf(entry.target);
        reveal(entry.target, index);
        observer.unobserve(entry.target);
      });
    }, { threshold: .18 });
    records.forEach((record) => observer.observe(record));
  };

  const initEnding = () => {
    const trigger = document.querySelector('[data-ending-trigger]');
    if (!trigger || !readState().truthReached) return;
    const share = document.querySelector('[data-share-x]');
    const shareText = 'もうひとつの生活拠点を、あなたに。\n#おかしなサイト\nhttps://x.com/ARG_ObserverX';
    if (share) share.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    if (readState().endingTriggered) {
      renderProgress();
      return;
    }
    const begin = () => {
      if (readState().endingTriggered) return;
      writeState({ ...readState(), phase: 'ending', endingTriggered: true });
      renderProgress();
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          begin();
        }
      }, { threshold: .45 });
      observer.observe(trigger);
    } else begin();
  };

  const initCommonUi = () => {
    document.querySelectorAll('[data-menu-toggle]').forEach((button) => button.addEventListener('click', () => {
      const header = button.closest('.site-header');
      const open = !header.classList.contains('is-menu-open');
      header.classList.toggle('is-menu-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    }));
    document.querySelectorAll('[data-exploration-reset]').forEach((button) => button.addEventListener('click', () => {
      if (window.confirm('探索の進行状況を初期化しますか？')) {
        resetProgress();
        window.location.href = 'index.html';
      }
    }));
  };

  const initDebug = () => {
    if (!window.SiteAlterationDebug) return;
    window.SiteAlterationDebug.init({
      storagePrefix: 'hotelNestra',
      state: {
        phases: PHASES,
        getPhase: () => readState().phase,
        getDetails: () => {
          const state = readState();
          return {
            discoveredB2: state.discoveredB2,
            undergroundStep: state.undergroundStep,
            undergroundViewed: state.undergroundViewed,
            truthReached: state.truthReached,
            truthAlterationPlayed: state.truthAlterationPlayed,
            endingTriggered: state.endingTriggered
          };
        },
        setPhase: (phase) => {
          writeState(stateForPhase(phase));
          window.location.reload();
        }
      }
    });
  };

  const initHero = () => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;
    const slides = [...hero.querySelectorAll('[data-hero-slide]')];
    const dots = [...hero.querySelectorAll('[data-hero-dot]')];
    let current = 0;
    let timer;
    const interval = 5500;
    const show = (next) => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === current));
      dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    };
    const restart = () => {
      clearInterval(timer);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(current + 1), interval);
    };
    hero.querySelector('[data-hero-prev]')?.addEventListener('click', () => { show(current - 1); restart(); });
    hero.querySelector('[data-hero-next]')?.addEventListener('click', () => { show(current + 1); restart(); });
    dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); restart(); }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(timer); else restart(); });
    restart();
  };

  initDebug();

  document.addEventListener('DOMContentLoaded', () => {
    initCommonUi();
    initGame();
    initHero();
    initUndergroundReveal();
    initEnding();
  });
})();
