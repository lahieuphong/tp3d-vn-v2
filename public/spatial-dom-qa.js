/* Paste into DevTools on the localhost Homepage. The main QA operator sets the
 * real Device Toolbar viewport; this script does not fake media queries. */
(() => {
  const sizes = [
    [375, 812],
    [390, 844],
    [430, 932],
    [768, 1024],
    [820, 1180],
    [1024, 768],
    [1280, 800],
    [1366, 768],
    [1440, 900],
    [1728, 1117],
    [1920, 1080],
    [2560, 1440],
  ];
  const records = [];
  const round = (value) => Math.round(value * 100) / 100;
  const rect = (element) => {
    const r = element.getBoundingClientRect();
    return {
      x: round(r.x),
      y: round(r.y),
      right: round(r.right),
      bottom: round(r.bottom),
      width: round(r.width),
      height: round(r.height),
    };
  };
  const label = (element) =>
    element.id ||
    element.className?.baseVal ||
    element.className ||
    element.tagName;
  const painted = (element) => {
    if (!element?.getClientRects().length) return false;
    for (
      let node = element;
      node instanceof Element;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) < 0.05
      )
        return false;
    }
    return true;
  };
  const overlap = (a, b) => {
    const x = Math.min(a.right, b.right) - Math.max(a.x, b.x);
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
    return x > 2 && y > 2 ? { width: round(x), height: round(y) } : null;
  };
  const settle = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  async function scene(wanted) {
    const hero = document.querySelector('.spatial-hero');
    if (!hero)
      throw new Error('Open the localhost Homepage before running Spatial QA.');
    const motion = hero.querySelector('.sh-motion-control');
    if (motion?.getAttribute('aria-pressed') === 'false') motion.click();
    for (
      let attempt = 0;
      attempt < 2 && hero.dataset.scene !== wanted;
      attempt++
    ) {
      hero.querySelector('.sh-scene-control').click();
      await settle();
    }
    await document.fonts.ready;
    await settle();
    return hero.dataset.scene;
  }
  async function capture(wanted) {
    if (wanted) await scene(wanted);
    const hero = document.querySelector('.spatial-hero'),
      box = rect(hero),
      phase = hero.dataset.scene;
    const errors = [],
      notes = [];
    const viewport = { width: innerWidth, height: innerHeight };
    if (document.documentElement.scrollWidth > innerWidth + 1)
      errors.push({
        type: 'page-horizontal-overflow',
        width: document.documentElement.scrollWidth,
      });
    const selectors =
      phase === 'story'
        ? [
            '.sh-story-en',
            '.sh-story-vi',
            '.sh-story-axis-top',
            '.sh-story-axis-bottom',
            '.sh-read-story',
            '.sh-colophon',
          ]
        : ['.sh-welcome-en', '.sh-welcome-vi', '.sh-portals', '.sh-colophon'];
    const areas = selectors.flatMap((selector) => {
      const element = hero.querySelector(selector);
      return painted(element)
        ? [{ selector, element, box: rect(element) }]
        : [];
    });
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (
        area.box.x < box.x - 1 ||
        area.box.right > box.right + 1 ||
        area.box.y < box.y - 1 ||
        area.box.bottom > box.bottom + 1
      )
        errors.push({
          type: 'hero-content-clipped',
          selector: area.selector,
          box: area.box,
        });
      for (let j = i + 1; j < areas.length; j++) {
        const intersection = overlap(area.box, areas[j].box);
        if (intersection)
          errors.push({
            type: 'content-overlap',
            a: area.selector,
            b: areas[j].selector,
            ...intersection,
          });
      }
    }
    const text = [];
    for (const element of hero.querySelectorAll('h1,h2,p')) {
      if (!painted(element) || element.closest('[aria-hidden="true"]'))
        continue;
      const bounds = rect(element),
        style = getComputedStyle(element),
        range = document.createRange();
      range.selectNodeContents(element);
      const glyphs = [...range.getClientRects()].filter(
        (r) => r.width > 1 && r.height > 1,
      );
      const over = glyphs.some(
        (r) => r.x < bounds.x - 2 || r.right > bounds.right + 2,
      );
      if (over)
        errors.push({
          type: 'text-horizontal-overflow',
          selector: label(element),
          text: element.textContent.trim().slice(0, 85),
          box: bounds,
        });
      if (bounds.bottom > box.bottom + 1)
        errors.push({
          type: 'text-bottom-clipped',
          selector: label(element),
          box: bounds,
        });
      text.push({
        selector: label(element),
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        box: bounds,
        lines: new Set(glyphs.map((r) => Math.round(r.y))).size,
        text: element.innerText.trim(),
      });
    }
    const header = document.querySelector('.site-header'),
      headerBox = rect(header);
    const headerItems = [
      ...header.querySelectorAll('.wordmark,.desktop-nav,.header-actions'),
    ]
      .filter(painted)
      .map((el) => ({ label: label(el), box: rect(el) }));
    for (let i = 0; i < headerItems.length; i++) {
      const a = headerItems[i];
      if (a.box.x < 0 || a.box.right > innerWidth + 1)
        errors.push({ type: 'header-item-outside-viewport', ...a });
      for (let j = i + 1; j < headerItems.length; j++)
        if (overlap(a.box, headerItems[j].box))
          errors.push({
            type: 'header-overlap',
            a: a.label,
            b: headerItems[j].label,
          });
    }
    for (const area of areas)
      if (area.selector !== '.sh-colophon' && overlap(area.box, headerBox))
        errors.push({
          type: 'header-content-overlap',
          selector: area.selector,
        });
    const images = [...hero.querySelectorAll('img')].map((img) => ({
      src: (img.currentSrc || img.getAttribute('src') || 'deferred')
        .split('/')
        .at(-1),
      ready: img.complete && img.naturalWidth > 0,
      natural: [img.naturalWidth, img.naturalHeight],
      box: rect(img),
      visible: painted(img),
    }));
    for (const img of images)
      if (img.visible && !img.ready)
        errors.push({ type: 'broken-or-pending-visible-image', src: img.src });
    const portals = [...hero.querySelectorAll('.sh-portal')].map((el) => ({
      href: el.getAttribute('href'),
      box: rect(el),
      arch: rect(el.querySelector('.sh-portal-arch')),
      photo: rect(el.querySelector('.sh-portal-photo')),
      title: rect(el.querySelector('h2')),
      accessible: !el.closest('[inert],[aria-hidden="true"]'),
    }));
    portals.forEach((p) => {
      if (Math.abs(p.photo.width - p.photo.height) > 1)
        errors.push({
          type: 'atlas-photo-distortion',
          href: p.href,
          photo: p.photo,
        });
    });
    const activeAnimations = hero.getAnimations({ subtree: true }).map((a) => ({
      state: a.playState,
      time: round(Number(a.currentTime) || 0),
      target: label(a.effect.target),
    }));
    const result = {
      viewport,
      scene: phase,
      hero: box,
      heroViewportRatio: round(box.height / innerHeight),
      errors,
      notes,
      areas: areas.map(({ selector, box }) => ({ selector, box })),
      headerItems,
      text,
      portals,
      images,
      canvas: hero.querySelectorAll('canvas').length,
      iframes: hero.querySelectorAll('iframe').length,
      activeAnimations,
    };
    records.push(result);
    console.log(
      JSON.stringify({
        viewport,
        scene: phase,
        heroHeight: box.height,
        errors,
        canvas: result.canvas,
        iframe: result.iframes,
        animations: activeAnimations.length,
      }),
    );
    return result;
  }
  function summary() {
    return {
      records: records.length,
      missing: sizes.flatMap(([width, height]) =>
        ['discovery', 'story']
          .filter(
            (scene) =>
              !records.some(
                (r) =>
                  r.viewport.width === width &&
                  r.viewport.height === height &&
                  r.scene === scene,
              ),
          )
          .map((scene) => ({ width, height, scene })),
      ),
      failures: records
        .filter((r) => r.errors.length)
        .map(({ viewport, scene, errors }) => ({ viewport, scene, errors })),
    };
  }
  window.__spatialQA = { sizes, records, scene, capture, summary };
  console.log(
    'Spatial DOM QA ready: await __spatialQA.capture("discovery"), then capture("story") at each real viewport. summary() reports untested sizes.',
  );
})();
