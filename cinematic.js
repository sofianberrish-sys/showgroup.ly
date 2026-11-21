/* Enhance the existing opening with reversible scroll-driven photographic scenes. */
(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  if (!hero || !window.matchMedia || !window.requestAnimationFrame) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 700px)');
  const journey = document.createElement('div');
  journey.className = 'cinema-journey';
  hero.before(journey);
  journey.append(hero);

  const opening = hero.querySelector('.hero-image');
  const openingCopy = hero.querySelector('.hero-content');
  const shade = hero.querySelector('.hero-shade');
  const world = document.createElement('div');
  world.className = 'cinema-world';
  world.setAttribute('aria-hidden', 'true');
  hero.insertBefore(world, shade);
  world.append(opening);
  const assembly = window.ShowGroupAssembly?.create(world, requestPaint);
  // Restore the aisle from the distant platform toward the vases with a soft fade front.
  const aisle = document.createElement('img');
  aisle.className = 'cinema-aisle';
  aisle.alt = '';
  aisle.decoding = 'async';
  aisle.src = 'images/entrance-clean.png';
  aisle.addEventListener('error', () => { aisle.hidden = true; });
  world.append(aisle);
  const pointerCapable = window.matchMedia('(hover: hover) and (pointer: fine)');
  const foreground = createForeground();
  let pointerX = 0;
  let pointerY = 0;

  // Vase and bouquet share one registered photo plane, so resizing preserves perspective.
  function createForeground() {
    return ['left', 'right'].map(side => {
      const layer = document.createElement('div');
      layer.className = 'cinema-depth cinema-depth-' + side;
      layer.setAttribute('aria-hidden', 'true');
      const flowers = document.createElement('img');
      flowers.className = 'cinema-blooms';
      flowers.alt = '';
      flowers.decoding = 'async';
      flowers.src = 'images/decor-foreground.png';
      const vase = document.createElement('img');
      vase.className = 'cinema-vase';
      vase.alt = '';
      vase.decoding = 'async';
      vase.src = 'images/decor-vase-empty.png';
      // Only the front lip sits above the stems; the bouquet remains inside the opening.
      const rim = document.createElement('img');
      rim.className = 'cinema-vase-lip';
      rim.alt = '';
      rim.decoding = 'async';
      rim.src = vase.src;
      const reveal = () => {
        if (flowers.complete && vase.complete && flowers.naturalWidth && vase.naturalWidth) {
          layer.classList.add('is-loaded');
        }
      };
      flowers.addEventListener('load', reveal);
      vase.addEventListener('load', reveal);
      const fail = () => {
        layer.dataset.failed = 'true';
        layer.hidden = true;
      };
      flowers.addEventListener('error', fail);
      vase.addEventListener('error', fail);
      layer.append(vase, flowers, rim);
      world.append(layer);
      reveal();
      return { layer, flowers };
    });
  }

  const scenes = [
    {
      image: 'images/8.jpeg',
      title: 'نقترب… فتظهر الحكاية.',
      label: 'THE SCENE',
      description: 'تناغم الورد والخامات، وحضور يملأ المكان.',
      chapter: '02 / المشهد',
    },
    {
      image: 'images/14.jpeg',
      title: 'وفي كل تفصيلة، أثر.',
      label: 'THE DETAILS',
      description: 'ألوان وضوء ولمسات صغيرة، تُكمل الصورة.',
      chapter: '03 / التفاصيل',
    },
  ];

  // Keep scene imagery decorative: the same work is accessible in the gallery.
  const layers = scenes.map((scene, index) => {
    const layer = document.createElement('div');
    layer.className = 'cinema-scene';
    layer.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = scene.image;
    image.alt = '';
    image.decoding = 'async';
    layer.append(image);
    hero.insertBefore(layer, shade);

    const caption = document.createElement('div');
    caption.className = 'cinema-caption';
    caption.setAttribute('aria-hidden', 'true');
    const label = document.createElement('p');
    label.className = 'eyebrow';
    label.textContent = scene.label;
    const title = document.createElement('h2');
    title.textContent = scene.title;
    const description = document.createElement('p');
    description.textContent = scene.description;
    caption.append(label, title, description);
    if (index === scenes.length - 1) {
      caption.classList.add('is-actionable');
      const explore = document.createElement('a');
      explore.className = 'button button-light cinema-explore';
      explore.href = '#portfolio';
      explore.textContent = 'اكتشف بقية أعمالنا ↙';
      caption.append(explore);
    }
    caption.inert = true;
    hero.append(caption);
    return { layer, image, caption };
  });

  const controls = document.createElement('div');
  controls.className = 'cinema-controls';
  const chapters = document.createElement('nav');
  chapters.className = 'cinema-chapters';
  chapters.setAttribute('aria-label', 'مشاهد الافتتاحية');
  const stops = [0, .91, .99];
  const chapterLinks = ['01 / البداية', ...scenes.map(scene => scene.chapter)].map((title, i) => {
    const anchor = document.createElement('span');
    anchor.className = 'cinema-anchor';
    anchor.id = 'cinema-chapter-' + i;
    journey.append(anchor);
    const link = document.createElement('a');
    link.href = '#' + anchor.id;
    link.textContent = title;
    link.addEventListener('click', event => {
      event.preventDefault();
      const top = journey.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + Math.max(0, journey.offsetHeight - window.innerHeight) * stops[i],
        behavior: 'auto',
      });
    });
    chapters.append(link);
    return link;
  });
  const actions = document.createElement('div');
  actions.className = 'cinema-actions';
  const skip = document.createElement('a');
  skip.href = '#intro';
  skip.textContent = 'تجاوز المشهد ↓';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.setAttribute('aria-pressed', 'false');
  actions.append(skip, toggle);
  controls.append(chapters, actions);
  const buildStatus = document.createElement('p');
  buildStatus.className = 'cinema-build-status';
  buildStatus.setAttribute('aria-live', 'polite');
  hero.append(buildStatus);
  let lastBuildStep = -1;
  const progress = document.createElement('div');
  progress.className = 'cinema-progress';
  progress.setAttribute('aria-hidden', 'true');
  const progressFill = document.createElement('span');
  progress.append(progressFill);
  hero.append(controls, progress);

  const clamp = value => Math.max(0, Math.min(1, value));
  const blend = (value, start, end) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  let manualStatic = false;
  let scheduled = false;
  let pageVisible = true;
  let displayedProgress = null;
  let displayedPointerX = 0;
  let displayedPointerY = 0;

  function follow(current, target) {
    return Math.abs(target - current) < .0001 ? target : current + (target - current) * .2;
  }

  // Briefly settle visual motion after input; stop scheduling once it reaches the target.
  function paint() {
    scheduled = false;
    if (motionPreference.matches || manualStatic || !pageVisible) return;
    const rect = journey.getBoundingClientRect();
    const target = clamp(-rect.top / Math.max(1, journey.offsetHeight - window.innerHeight));
    if (displayedProgress === null || Math.abs(target - displayedProgress) > .35) {
      displayedProgress = target;
    }
    displayedProgress = follow(displayedProgress, target);
    displayedPointerX = follow(displayedPointerX, pointerX);
    displayedPointerY = follow(displayedPointerY, pointerY);
    const p = displayedProgress;
    const depth = compactScreen.matches ? .06 : .13;
    const firstFade = blend(p, .84, .89);
    const secondFade = blend(p, .945, .975);
    const approach = blend(p, .2, .83);
    const build = assembly?.render(p);
    if (build && build.step !== lastBuildStep) {
      buildStatus.textContent = String(build.step).padStart(2, '0') + ' / 12 · ' + build.label;
      lastBuildStep = build.step;
    }
    buildStatus.style.opacity = String(1 - firstFade);
    paintAisle(p, firstFade);
    const cameraX = compactScreen.matches ? 0 : displayedPointerX * 5;
    const cameraY = compactScreen.matches ? 0 : displayedPointerY * 3;
    world.style.transform =
      `translate(-50%, -50%) scale(${1.02 + depth * approach}) ` +
      `translate(${cameraX}px, ${cameraY}px)`;
    paintForeground(p, firstFade, approach);
    openingCopy.style.opacity = String(1 - blend(p, .025, .08));
    openingCopy.style.transform = `translateY(${-25 * blend(p, .025, .08)}px)`;
    openingCopy.inert = p > .08;

    layers[0].layer.style.opacity = String(firstFade);
    layers[0].image.style.transform =
      `scale(${1.04 + depth * blend(p, .3, .76)}) translateY(${-2 * blend(p, .3, .76)}%)`;
    layers[1].layer.style.opacity = String(secondFade);
    layers[1].image.style.transform =
      `scale(${1.03 + depth * .7 * blend(p, .68, 1)})`;
    const captionProgress = [
      blend(p, .885, .9) * (1 - blend(p, .93, .945)),
      blend(p, .975, .99),
    ];
    layers.forEach((scene, i) => {
      scene.caption.style.opacity = String(captionProgress[i]);
      scene.caption.style.transform = `translateY(${20 * (1 - captionProgress[i])}px)`;
      scene.caption.setAttribute('aria-hidden', String(captionProgress[i] < .6));
      scene.caption.inert = captionProgress[i] < .6;
    });
    const chapter = p < .87 ? 0 : p < .96 ? 1 : 2;
    chapterLinks.forEach((link, i) => {
      if (i === chapter) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    progressFill.style.transform = `scaleX(${p})`;
    if (p !== target || displayedPointerX !== pointerX || displayedPointerY !== pointerY) {
      requestPaint();
    }
  }

  // The mask follows image depth: small Y values are at the platform, large Y at the vases.
  function paintAisle(progress, sceneFade) {
    const extension = blend(progress, .61, .675);
    // Start at the photographed walkway head, then reveal only to its lower edge.
    const front = 56 + extension * 27.2;
    const feather = 0.8;
    const mask = extension === 1 ? 'none' :
      `linear-gradient(to bottom, #000 0%, #000 ${front - feather}%, ` +
      `transparent ${front + feather}%, transparent 100%)`;
    aisle.style.maskImage = mask;
    aisle.style.webkitMaskImage = mask;
    aisle.style.opacity = String(blend(progress, .61, .62) * (1 - sceneFade));
  }

  // Fade the fitted bouquet in place, with its stem base behind the front lip.
  function paintForeground(progress, fade, approach) {
    const strength = compactScreen.matches ? .35 : 1;
    foreground.forEach(({ layer, flowers }, index) => {
      const direction = index === 0 ? -1 : 1;
      const horizontal = direction * approach * 10 * strength - displayedPointerX * 3;
      const vertical = approach * 4 * strength - displayedPointerY * 2;
      layer.style.transform =
        `translate3d(${horizontal}px, ${vertical}px, 0)`;
      layer.style.opacity = String(blend(progress, .69, .735) * (1 - fade));
      layer.hidden = progress > .9 || layer.dataset.failed === 'true';
      const growth = blend(progress, .75 + index * .004, .795 + index * .004);
      flowers.style.transform =
        `translateY(calc(.8% + ${(1 - growth) * 6}px)) scale(.82)`;
      flowers.style.opacity = String(growth);
    });
  }

  function requestPaint() {
    if (scheduled || !pageVisible) return;
    scheduled = true;
    window.requestAnimationFrame(paint);
  }

  function updateMode() {
    const isStatic = manualStatic || motionPreference.matches;
    journey.classList.toggle('is-static', isStatic);
    toggle.textContent = isStatic ? 'عرض ثابت · تفعيل الحركة' : 'إيقاف الحركة';
    toggle.setAttribute('aria-pressed', String(isStatic));
    // A system preference always takes precedence over the optional motion button.
    toggle.disabled = motionPreference.matches;
    if (motionPreference.matches) toggle.textContent = 'عرض ثابت · حسب إعدادات جهازك';
    openingCopy.inert = false;
    pointerX = 0;
    pointerY = 0;
    displayedPointerX = 0;
    displayedPointerY = 0;
    displayedProgress = null;
    layers.forEach(scene => {
      scene.caption.setAttribute('aria-hidden', 'true');
      scene.caption.inert = true;
    });
    if (typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('showgroup:motion-mode', {
        detail: { static: isStatic },
      }));
    }
    if (isStatic) {
      assembly?.render(1, true);
      buildStatus.style.opacity = '0';
      world.style.transform = 'translate(-50%, -50%)';
      aisle.style.opacity = '1';
      aisle.style.maskImage = 'none';
      aisle.style.webkitMaskImage = 'none';
      foreground.forEach(({ layer, flowers }) => {
        layer.hidden = layer.dataset.failed === 'true';
        layer.style.transform = 'none';
        layer.style.opacity = '1';
        flowers.style.transform = 'translateY(.8%) scale(.82)';
        flowers.style.opacity = '1';
      });
    }
    requestPaint();
  }

  toggle.addEventListener('click', () => {
    const wasInside = journey.getBoundingClientRect().top < 0 &&
      journey.getBoundingClientRect().bottom > window.innerHeight;
    manualStatic = !manualStatic;
    updateMode();
    if (wasInside) journey.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint, { passive: true });
  hero.addEventListener('pointermove', event => {
    if (!pointerCapable.matches || manualStatic || motionPreference.matches) return;
    const box = hero.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - box.top) / window.innerHeight * 2 - 1));
    requestPaint();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    requestPaint();
  });
  motionPreference.addEventListener('change', updateMode);
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) requestPaint();
  });
  journey.classList.add('is-ready');
  updateMode();
})();
