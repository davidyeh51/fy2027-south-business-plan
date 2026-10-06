(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.querySelector('#stage');
  const previous = document.querySelector('#prev');
  const next = document.querySelector('#next');
  const pageLabel = document.querySelector('#page-label');
  const progress = document.querySelector('#progress-bar');
  const toc = document.querySelector('#toc-dialog');
  const sources = document.querySelector('#sources-dialog');
  const capture = new URLSearchParams(location.search).has('capture');
  let index = 0;
  if (capture) document.body.classList.add('capture');

  function resize() {
    const availableHeight = window.innerHeight - (capture ? 0 : 64) - (capture ? 0 : 28);
    const availableWidth = window.innerWidth - (capture ? 0 : window.innerWidth < 700 ? 16 : 28);
    const scale = Math.max(0.1, Math.min(availableWidth / 1440, availableHeight / 810));
    document.documentElement.style.setProperty('--scale', scale);
    stage.style.width = `${1440 * scale}px`;
    stage.style.height = `${810 * scale}px`;
  }

  function goTo(number, updateHash = true) {
    index = Math.max(0, Math.min(slides.length - 1, number));
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    pageLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    progress.style.width = `${(index + 1) / slides.length * 100}%`;
    document.title = `${slides[index].dataset.title}｜2027 商業計畫`;
    if (updateHash) history.replaceState(null, '', `#slide-${index + 1}`);
    return index;
  }

  function readHash() {
    const match = location.hash.match(/^#slide-(\d+)$/);
    goTo(match ? Number(match[1]) - 1 : 0, false);
  }

  slides.forEach((slide, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = slide.dataset.title;
    button.addEventListener('click', () => { goTo(i); toc.close(); });
    li.appendChild(button);
    document.querySelector('#toc-list').appendChild(li);
  });

  previous.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));
  document.querySelector('#toc-open').addEventListener('click', () => toc.showModal());
  document.querySelector('#sources-open').addEventListener('click', () => sources.showModal());
  document.querySelectorAll('.close-dialog').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  [toc, sources].forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });

  document.querySelector('#fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      document.querySelector('#fullscreen').textContent = '請使用 F11';
    }
  });

  document.addEventListener('keydown', event => {
    if (toc.open || sources.open || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const actions = {
      ArrowRight: () => goTo(index + 1), PageDown: () => goTo(index + 1),
      ArrowLeft: () => goTo(index - 1), PageUp: () => goTo(index - 1),
      Home: () => goTo(0), End: () => goTo(slides.length - 1),
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    else if (event.key === ' ' && !/BUTTON|A/.test(event.target.tagName)) {
      event.preventDefault(); goTo(event.shiftKey ? index - 1 : index + 1);
    }
  });
  let touchStart = null;
  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches[0]) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  window.addEventListener('resize', resize);
  window.addEventListener('hashchange', readHash);
  window.addEventListener('beforeprint', () => slides.forEach(slide => { slide.inert = false; slide.setAttribute('aria-hidden', 'false'); }));
  window.addEventListener('afterprint', () => goTo(index, false));
  // Exposed only for local visual QA and export, not for persistent user data.
  window.deck = { goTo, get index() { return index; }, count: slides.length };
  readHash(); resize();
})();
