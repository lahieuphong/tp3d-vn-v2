/** Crawl only this site's internal content routes and validate their generated image references. */
import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://localhost:3000';
const pending = ['/'];
const visited = new Set();
const images = new Set();
const report = [];
while (pending.length) {
  const route = pending.shift();
  if (visited.has(route)) continue;
  visited.add(route);
  assert(visited.size < 100, 'Unexpected crawl size');
  const response = await fetch(new URL(route, origin));
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  const html = await response.text();
  assert(html.includes('<h1'), `${route}: missing h1`);
  assert(
    !html.includes('Let’s try that again.'),
    `${route}: error boundary rendered`,
  );
  const loaderTags = [
    ...html.matchAll(
      /<div\b[^>]*\bdata-home-intro-overlay(?:="[^"]*")?[^>]*>/g,
    ),
  ];
  if (route !== '/') {
    assert.equal(
      loaderTags.length,
      0,
      `${route}: Home intro must not render on other routes`,
    );
  }
  if (route === '/') {
    assert.equal(
      loaderTags.length,
      1,
      'Home: exactly one intro overlay must be server-rendered',
    );
    const mainStart = html.search(/<main\b[^>]*id="main"/);
    const loaderStart = loaderTags[0].index;
    assert(
      mainStart > loaderStart,
      'Home: the intro must precede the existing SSR Home, not replace it',
    );
    const loader = html.slice(loaderStart, mainStart);
    assert.match(
      loader,
      /class="[^"]*\bhi-intro-monogram\b[^"]*"/,
      'Home: loader requires its material TP monogram',
    );
    assert.match(
      loader,
      /<svg\b/,
      'Home: the loader TP remains a lightweight SVG',
    );
    for (const detail of [
      'hi-intro-breeze',
      'hi-intro-slogan',
      'hi-header',
      'hi-wordmark',
      'hi-bottom-brand',
      'hi-entry-stone-face',
      'hi-entry-walnut-face',
      'A new breeze',
      'for living',
      'EST. 2026',
    ]) {
      assert(loader.includes(detail), `Home intro is missing ${detail}`);
    }
    assert.match(loader, /class="hi-header"[^>]*aria-hidden="true"[^>]*inert/);
    assert.equal(
      (loader.match(/class="hi-intro-breeze /g) ?? []).length,
      2,
      'one rear and one front cloth layer',
    );
    assert.doesNotMatch(
      loader,
      /<(?:a|button)\b/i,
      'loader navigation must remain presentational',
    );
    assert.match(loader, /PREPARING THE SPACE/);
    assert.match(loader, /<output\b[^>]*aria-live="polite"/);
    assert.match(
      loader,
      /<progress\b[^>]*aria-label="Essential homepage resources"/,
    );
    for (const panel of ['hi-panel-top', 'hi-panel-bottom']) {
      assert.equal(
        (loader.match(new RegExp('\\b' + panel + '\\b', 'g')) ?? []).length,
        1,
        `Home: one ${panel} element is required`,
      );
    }
    assert.doesNotMatch(
      loader,
      /<(?:canvas|video|iframe|h1)\b/i,
      'Home: loader contains no heavy viewer or duplicate hero heading',
    );
    assert.doesNotMatch(
      loader,
      /\bclass="[^"]*\b(?:sh-monogram|sh-ribbon|spatial-hero)\b|spatial-architecture|data-hero-layer/,
      'Home: the entry composition must be independent of the actual Homepage architecture and TP',
    );
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1];
    assert(head, 'Home: SSR head is required for the pre-paint intro decision');
    const bootstrap = [
      ...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
    ].find(([, code]) => code.includes('__tpHomeIntroRuntime'));
    assert(
      bootstrap,
      'Home: runtime bootstrap must be inline in the head before body paint',
    );
    assert(
      html.indexOf(bootstrap[0]) < html.indexOf('<body'),
      'Home: intro decision must precede the body',
    );
    assert.match(bootstrap[1], /location\.pathname === '\/'/);
    assert.match(bootstrap[1], /data-home-intro/);
    const main = html.match(
      /<main\b[^>]*id="main"[^>]*>([\s\S]*?)<\/main>/,
    )?.[1];
    assert(main, 'Home: missing semantic main content');
    assert.equal(
      (main.match(/<h1\b/g) ?? []).length,
      1,
      'Home: the complete opening and Worlds journey must have one h1',
    );
    const hero = html.match(
      /<section\b[^>]*class="[^"]*\bspatial-hero\b[^"]*"[^>]*>([\s\S]*?)<\/section>/,
    )?.[1];
    assert(hero, 'Home: missing spatial opening');
    assert.equal(
      (hero.match(/<h1\b/g) ?? []).length,
      1,
      'Home: opening must contain one meaningful h1',
    );
    assert.match(hero, /A new breeze/);
    assert.match(hero, /for living\./);
    assert.match(hero, /Một làn gió mới/);
    assert.match(hero, /cho không gian sống\./);
    assert.match(hero, /OUR STORY/);
    assert.match(hero, /CÂU CHUYỆN CỦA CHÚNG TÔI/);
    assert.match(hero, /lang="vi"/);
    assert.match(hero, /data-hero-deferred/);
    assert.match(hero, /sh-stage/);
    assert.match(hero, /class="sh-discovery"/);
    assert.match(hero, /id="spatial-hero-story"/);
    assert.match(hero, /becomes a way/);
    assert.match(hero, /of seeing\./);
    assert.equal(
      (main.match(/<[^>]+\bclass="[^"]*\bsh-monogram\b[^"]*"/g) ?? []).length,
      1,
      'Home: one large narrative TP in the complete HomeStory',
    );
    assert.equal(
      (main.match(/<[^>]+\bdata-shared-tp(?:=|\s|>)/g) ?? []).length,
      1,
      'Home: exactly one shared narrative TP owner',
    );
    assert.doesNotMatch(
      hero,
      /\bdata-shared-tp(?:=|\s|>)/,
      'Home: the shared artifact is outside the scene-local Hero',
    );
    // Inspect the emitted tag ancestry, rather than merely checking that the
    // marker occurs somewhere after the stage. This permits sibling reordering
    // while rejecting a TP nested back inside either scene.
    const ancestors = [];
    let tpParent;
    for (const match of main.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
      const [tag, name] = match;
      if (tag.startsWith('</')) ancestors.pop();
      else if (/\bdata-shared-tp(?:=|\s|>)/.test(tag)) {
        tpParent = ancestors.at(-1);
        break;
      } else if (
        !tag.endsWith('/>') &&
        !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(
          name,
        )
      )
        ancestors.push(tag);
    }
    assert.match(
      tpParent ?? '',
      /^<div\b[^>]*\bdata-home-story-stage(?:=|\s|>)/,
      'Home: the narrative TP is a direct child of the shared sticky stage',
    );
    assert.equal(
      (html.match(/<header\b/g) ?? []).length,
      1,
      'Home: one shared header',
    );
    assert.match(hero, /SCROLL TO DISCOVER/);
    assert.doesNotMatch(
      hero,
      /PAUSE|Resume opening animation|data-hero-control/,
    );
    for (const destination of [
      '/worlds',
      '/spaces',
      '/products',
      '/projects',
    ]) {
      assert(
        hero.includes(`href="${destination}"`),
        `Home: missing interactive portal to ${destination}`,
      );
    }
    assert.doesNotMatch(
      main,
      /<canvas\b|<iframe\b|\bclass="[^"]*\bemh-/,
      'Home: the opening and Worlds must use live DOM without old Hero/WebGL/embed layers',
    );

    const chapters = [
      ...main.matchAll(
        /<section\b[^>]*data-home-chapter="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g,
      ),
    ];
    assert.deepEqual(
      chapters.map(([, name]) => name),
      ['worlds'],
      'Home: only Worlds follows the two-scene opening',
    );
    assert.equal(
      (main.match(/<section\b/g) ?? []).length,
      3,
      'Home: the HomeStory wrapper must contain only the opening and Worlds sections',
    );
    assert.equal(
      (main.match(/<section\b[^>]*\bdata-home-story(?:=|\s|>)/g) ?? []).length,
      1,
      'Home: exactly one master HomeStory must render',
    );
    assert.equal(
      (main.match(/\bdata-home-story-stage(?:=|\s|>)/g) ?? []).length,
      1,
      'Home: Story and Worlds share one sticky stage',
    );
    assert.doesNotMatch(
      main,
      /data-sky-track|sky-static-aperture/,
      'Home: the superseded sky portal must not render',
    );
    assert.equal(
      (main.match(/\bdata-continuous-breeze(?:=|\s|>)/g) ?? []).length,
      1,
      'Home: the opening and Worlds share one Breeze owner',
    );
    assert.doesNotMatch(
      main,
      /\bclass="[^"]*\b(?:sh-ribbon|sh-veil|hc-breeze-journey)\b/,
      'Home: section-local ribbons and transition veils are removed',
    );
    assert.equal(
      (main.match(/\bid="cb-cloth"/g) ?? []).length,
      1,
      'Home: depth projections share one continuous geometry definition',
    );
    assert.equal(
      (main.match(/\bhref="#cb-cloth"/g) ?? []).length,
      3,
      'Home: rear/main/front projections reference the same fabric',
    );
    assert.equal(
      (main.match(/\bdata-breeze-svg(?:=|\s|>)/g) ?? []).length,
      2,
      'Home: two SVG planes host three coordinated fabric projections',
    );
    assert(
      main.indexOf('spatial-hero-story') <
        main.indexOf('data-home-chapter="worlds"'),
      'Home: Story must precede Worlds',
    );
    const chapterBodies = Object.fromEntries(
      chapters.map(([, name, body]) => [name, body]),
    );
    const textContent = main
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    for (const retiredHeading of [
      'THE ART OF FEELING AT HOME',
      'Designed around space, material and everyday living.',
      'ROOM TO DISCOVER',
      'A place for every day.',
      'SELECTED INTERIORS',
      'Spaces with a story.',
      'THE COLLECTIONS',
      'Different expressions.',
      'MATERIALS & DETAILS',
      'Materials define the atmosphere.',
      'FURNITURE & OBJECTS',
      'Objects with a sense of place.',
      'THE JOURNAL',
      'Notes on living well.',
      'Rooms as atmospheres.',
      'SAMPLE SPACES',
      'CURATED INTERIORS',
      'Natural materials, considered objects.',
    ]) {
      assert(
        !textContent.includes(retiredHeading),
        `Home: retired section still renders: ${retiredHeading}`,
      );
    }
    for (const { name, heading, destinations } of [
      {
        name: 'worlds',
        heading: 'home-worlds-title',
        // TP3D PASS 05: the primary gateway enters the Lobby; /worlds stays
        // reachable through the hero portal, navigation and the Lobby.
        destinations: ['/world'],
      },
    ]) {
      const body = chapterBodies[name];
      assert.match(body, new RegExp('<h2\\b[^>]*id="' + heading + '"'));
      assert(
        main.includes(`aria-labelledby="${heading}"`),
        `Home: ${name} chapter needs an accessible label`,
      );
      for (const destination of destinations) {
        assert(
          body.includes(`href="${destination}"`),
          `Home: ${name} is missing a real link to ${destination}`,
        );
      }
      const chapterImages = [...body.matchAll(/<img\b[^>]*>/g)];
      assert(
        chapterImages.length,
        `Home: ${name} is missing its visual assets`,
      );
      const roomPreviews = [
        ...body.matchAll(/<img\b(?=[^>]*data-room-preview="([a-z]+)")[^>]*>/g),
      ];
      assert.deepEqual(
        roomPreviews.map(([, room]) => room),
        ['living', 'bedroom', 'bathroom', 'kitchen'],
        'Home: four optimized room previews',
      );
      for (const [preview, room] of roomPreviews) {
        assert(
          preview.includes(
            `data-src="/images/home-chapters/room-preview-${room}.webp"`,
          ),
        );
        assert.match(preview, /width="192" height="192" alt=""/);
      }
      for (const [image] of chapterImages) {
        assert.match(
          image,
          /data-src="\/images\/home-chapters\//,
          'Home: later chapter assets have local deferred sources',
        );
        assert.doesNotMatch(
          image,
          /\ssrc(?:set)?="/,
          'Home: SSR must not fetch Atrium or interaction thumbnails at initial boot',
        );
        assert.match(
          image,
          /loading="lazy"/,
          'Home: later story assets start only on intent',
        );
        assert.match(
          image,
          /\bwidth="\d+"/,
          `Home: ${name} image needs intrinsic width`,
        );
        assert.match(
          image,
          /\bheight="\d+"/,
          `Home: ${name} image needs intrinsic height`,
        );
        assert.match(
          image,
          /\balt="[^"]*"/,
          `Home: ${name} image needs an alt attribute`,
        );
      }
    }
    const worldOptions = [
      ...chapterBodies.worlds.matchAll(
        /<a\b(?=[^>]*class="[^"]*\bhc-atrium-room-link\b)[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
      ),
    ];
    assert.equal(
      worldOptions.length,
      4,
      'Home: the atrium must expose four working room links',
    );
    for (const [index, [, href, body]] of worldOptions.entries()) {
      assert.equal(
        href,
        [
          '/spaces/living',
          '/spaces/bedroom',
          '/worlds/modern-bathroom',
          '/spaces/kitchen',
        ][index],
        'Home: atrium room links use existing Spaces or the published bathroom World',
      );
      assert(
        body.includes(['Living', 'Bedroom', 'Bathroom', 'Kitchen'][index]),
      );
    }
    assert.match(
      chapterBodies.worlds,
      /<em\b[^>]*data-chapter-reveal="6"[^>]*>the worlds\.<\/em>/,
    );
    assert.doesNotMatch(
      chapterBodies.worlds,
      /worlds-architecture|hc-world-selector|hc-worlds-daylight|the space\./,
    );
    assert.match(chapterBodies.worlds, /worlds-atrium\.webp/);
    assert.equal(
      (main.match(/\bdata-scene3-camera(?:=|\s|>)/g) ?? []).length,
      1,
      'Home: one Scene3 camera carries the sky, oculus and final atrium',
    );
    const scene3Plates = [...main.matchAll(/<img\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter((tag) =>
        /\bsrc="\/images\/home-chapters\/worlds-atrium\.webp"/.test(tag),
      );
    assert.equal(
      scene3Plates.length,
      1,
      'Home: no duplicate full-size sky/portal/atrium image',
    );
    assert.doesNotMatch(
      scene3Plates[0],
      /\bsrcset=/i,
      'Home: close-up sky reuses the full-resolution plate on every breakpoint',
    );
    assert.doesNotMatch(
      main,
      /data-sky-preview|data-sky-portal|story-still-sky|sky-static-aperture|swb-portal|scene3-portal/,
      'Home: no superseded portal or separate sky preview remains',
    );
    assert.doesNotMatch(
      main,
      /<h2\b[^>]*>[\s\S]*?Objects &amp;\s*<br\s*\/?>\s*Materials[\s\S]*?<\/h2>/,
    );
    assert.doesNotMatch(
      main,
      /home-spaces|home-materials|data-material-depth|hc-material|hc-room-portals|spaces-architecture|materials-architecture|material-groups|material-tableau/,
      'Home: deleted scene markup, bindings and image requests must be absent',
    );
    assert.doesNotMatch(
      main,
      /href="#(?:home-spaces|home-materials|spaces-chapter|materials-chapter)"/,
    );
    for (const route of [
      '/spaces',
      '/materials',
      '/products',
      '/projects',
      '/worlds',
    ]) {
      assert(
        html.includes(`href="${route}"`),
        `Navigation must retain ${route}`,
      );
    }
  }
  for (const section of html.matchAll(
    /<section[^>]*data-project-context[^>]*>([\s\S]*?)<\/section>/g,
  )) {
    assert(
      section[1].includes('class="project-preview'),
      `${route}: empty project relationship section`,
    );
    assert(
      /href="\/projects\/[^"/]+"/.test(section[1]),
      `${route}: missing related project link`,
    );
  }
  if (route.startsWith('/experience/')) {
    assert(
      html.includes('This spatial experience'),
      `${route}: missing immediate preparation state`,
    );
    assert(
      html.includes('being prepared.'),
      `${route}: missing preparation heading`,
    );
    assert(
      !html.includes('Opening your interior experience'),
      `${route}: misleading loading state`,
    );
    assert(!html.includes('<canvas'), `${route}: unexpected WebGL canvas`);
  }
  if (route === '/') {
    // TP3D PASS 05: ENTER THE WORLD is a real link to the Lobby.
    const gateway = html.match(
      /<a\b[^>]*\bdata-world-gateway\b[^>]*>[\s\S]*?<\/a>/,
    );
    assert(gateway, 'Home: the Atrium gateway must be server-rendered');
    assert.match(gateway[0], /href="\/world"/);
    assert.match(gateway[0], /ENTER THE WORLD/);
    assert.doesNotMatch(html, /EXPLORE 3D WORLDS/);
  }
  if (route === '/world') {
    // TP3D PASS 05: the Lobby shell, complete as server HTML.
    assert.match(html, /<title>The Lobby — TP3D<\/title>/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'Lobby: one h1');
    assert.equal(
      (html.match(/<header\b/g) ?? []).length,
      1,
      'Lobby: one header',
    );
    assert.doesNotMatch(
      html,
      /class="site-header|class="site-footer/,
      'Lobby: the editorial header and footer step aside',
    );
    assert.doesNotMatch(html, /<canvas\b|three\.module|atmospheric-sky/);
    assert.match(html, /<main\b[^>]*id="main"[^>]*data-world-lobby/);
    const rooms = (nav) =>
      [
        ...(
          html.match(new RegExp(`aria-label="${nav}"[\\s\\S]*?</ol>`))?.[0] ??
          ''
        ).matchAll(
          /<li\b[^>]*data-world-room="([^"]+)"[^>]*data-status="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g,
        ),
      ].map(([, id, status, body]) => ({ id, status, body }));
    const spatial = rooms('Lobby rooms');
    const map = rooms('World map');
    for (const list of [spatial, map]) {
      assert.deepEqual(
        list.map((room) => room.id),
        ['gallery', 'objects', 'archive', 'lab', 'studio'],
        'Lobby: both navigation modes list the same rooms in order',
      );
      for (const room of list) {
        if (room.status === 'available')
          // TP3D PASS 06 / 10: the Gallery and Objects open their own rooms.
          assert.match(
            room.body,
            new RegExp(`<a\\b[^>]*href="/world/${room.id}"`),
          );
        else assert.doesNotMatch(room.body, /<a\b/, `${room.id}: no fake link`);
      }
    }
    assert.match(html, /<a\b[^>]*href="\/"[^>]*>[\s\S]*?Exit/);
  }
  if (route === '/world/gallery') {
    // TP3D PASS 06: Room 01, complete as server HTML, inside the World.
    assert.match(html, /<title>Gallery — TP3D<\/title>/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'Gallery: one h1');
    assert.equal(
      (html.match(/<header\b/g) ?? []).length,
      1,
      'Gallery: one header, the World chrome',
    );
    assert.doesNotMatch(
      html,
      /class="site-header|class="site-footer/,
      'Gallery: the editorial header and footer stay absent',
    );
    assert.doesNotMatch(
      html,
      /<canvas\b|<iframe\b|three\.module|atmospheric-sky|sketchfab\.com\/models/,
      'Gallery: no WebGL, no viewer, no Sketchfab',
    );
    assert.match(html, /<main\b[^>]*id="main"[^>]*data-world-gallery/);
    const exhibits = [
      ...html.matchAll(
        /<article\b[^>]*data-gallery-exhibit="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g,
      ),
    ];
    assert.deepEqual(
      exhibits.map(([, slug]) => slug),
      [
        'modern-kitchen',
        'white-modern-living-room',
        'minimalistic-modern-bedroom',
        'modern-bathroom',
      ],
      'Gallery: the four curated worlds, in curation order',
    );
    for (const [index, [, slug, body]] of exhibits.entries()) {
      // TP3D PASS 07: the exhibit carries the room into the detail page, and
      // the article is the fragment the detail page returns to.
      assert.match(body, new RegExp(`href="/worlds/${slug}\\?from=gallery"`));
      assert.match(
        html,
        new RegExp(`<article\\b[^>]*\\bid="${slug}"[^>]*data-gallery-exhibit`),
      );
      assert.match(body, new RegExp(`0${index + 1} / 04`));
      assert.match(body, /<h2\b/);
      assert.match(
        body,
        /\bwidth="1600"[^>]*\bheight="900"|\bheight="900"[^>]*\bwidth="1600"/,
      );
      assert.equal(
        /fetchpriority="high"/i.test(body),
        index === 0,
        `${slug}: only the first exhibit is priority-loaded`,
      );
    }
    const map = html.match(/aria-label="World map"[\s\S]*?<\/ol>/)?.[0] ?? '';
    assert.match(
      map,
      /<a\b[^>]*href="\/world\/gallery"[^>]*aria-current="page"/,
    );
    // TP3D PASS 10: Objects is open too, a plain link here, never current.
    assert.match(
      map,
      /<a\b(?=[^>]*\bhref="\/world\/objects")(?![^>]*aria-current)[^>]*>/,
    );
    assert.equal(
      (map.match(/<a\b/g) ?? []).length,
      2,
      'planned rooms stay text',
    );
    assert.match(
      html,
      /<a\b(?=[^>]*\bclass="wl-back")(?=[^>]*\bhref="\/world")/,
    );
    assert.match(html, /<a\b[^>]*href="\/"[^>]*>[\s\S]*?Exit/);
    assert.match(
      html,
      /<a\b(?=[^>]*\bclass="wg-catalogue")(?=[^>]*\bhref="\/worlds")/,
    );
  }
  if (route === '/world/objects') {
    // TP3D PASS 10: Room 02, complete as server HTML, inside the World.
    assert.match(html, /<title>Objects — TP3D<\/title>/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'Objects: one h1');
    assert.equal(
      (html.match(/<header\b/g) ?? []).length,
      1,
      'Objects: one header, the World chrome',
    );
    assert.doesNotMatch(
      html,
      /class="site-header|class="site-footer/,
      'Objects: the editorial header and footer stay absent',
    );
    assert.doesNotMatch(
      html,
      /<canvas\b|<iframe\b|three\.module|sketchfab\.com|\bfab\.com|\.glb\b/i,
      'Objects: no WebGL, no viewer, no model file, no marketplace',
    );
    assert.match(html, /<main\b[^>]*id="main"[^>]*data-world-objects/);
    const specimens = [
      ...html.matchAll(
        /<article\b[^>]*data-object-specimen="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g,
      ),
    ];
    assert.deepEqual(
      specimens.map(([, slug]) => slug),
      [
        'form-lounge-chair',
        'line-sofa',
        'round-coffee-table',
        'copper-pendant',
      ],
      'Objects: the four curated object studies, in curation order',
    );
    for (const [index, [, slug, body]] of specimens.entries()) {
      // TP3D PASS 11: a study opens in the Objects context, same route.
      assert.match(
        body,
        new RegExp(`<a\\b[^>]*href="/products/${slug}\\?from=objects"`),
      );
      assert.match(
        html,
        new RegExp(`<article\\b[^>]*\\bid="${slug}"[^>]*data-object-specimen`),
      );
      assert.match(html, new RegExp(`<a\\b[^>]*href="#${slug}"`));
      assert.match(body, new RegExp(`0${index + 1} / 04`));
      assert.match(body, /<h2\b/);
      assert.match(body, /Digital model · in preparation/);
      assert.doesNotMatch(body, /<button\b|aria-disabled|3D asset · available/);
      assert.equal(
        /fetchpriority="high"/i.test(body),
        index === 0,
        `${slug}: only the first study is priority-loaded`,
      );
    }
    const map = html.match(/aria-label="World map"[\s\S]*?<\/ol>/)?.[0] ?? '';
    assert.match(
      map,
      /<a\b[^>]*href="\/world\/objects"[^>]*aria-current="page"/,
    );
    assert.match(
      map,
      /<a\b(?=[^>]*\bhref="\/world\/gallery")(?![^>]*aria-current)[^>]*>/,
    );
    assert.equal(
      (map.match(/<a\b/g) ?? []).length,
      2,
      'planned rooms stay text',
    );
    assert.match(
      html,
      /<a\b(?=[^>]*\bclass="wl-back")(?=[^>]*\bhref="\/world")/,
    );
    assert.match(html, /<a\b[^>]*href="\/"[^>]*>[\s\S]*?Exit/);
    assert.match(
      html,
      /<a\b(?=[^>]*\bclass="wo-collection-link")(?=[^>]*\bhref="\/products")/,
    );
  }
  if (route === '/worlds') {
    assert.equal(
      (html.match(/data-world="/g) ?? []).length,
      4,
      'Worlds: missing scene sections',
    );
    assert.match(html, /id="world-index"/);
    assert.match(html, /<fieldset[^>]*class="world-filters"/);
    assert.match(html, /id="worlds-results"/);
    assert.doesNotMatch(
      html,
      /<iframe|<canvas|<script[^>]+src="https:\/\/(?:.*\.)?sketchfab\.com/,
      'Worlds must not embed a viewer',
    );
    const entries = [
      ...html.matchAll(
        /<article[^>]*data-world="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g,
      ),
    ];
    for (const [, slug, body] of entries) {
      const sceneLinks = [
        ...body.matchAll(/<a[^>]+href="(\/worlds\/[^"]+)"[^>]*>/g),
      ];
      assert.equal(
        sceneLinks.length,
        1,
        `${slug}: the whole card should be one detail link`,
      );
      assert.equal(sceneLinks[0][1], `/worlds/${slug}`);
      assert.doesNotMatch(sceneLinks[0][0], /target="_blank"/);
      assert.match(body, /class="world-card-overlay"/);
      assert.doesNotMatch(body, /world-card-copy/);
    }
  }
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !title.includes('Untitled'), `${route}: missing title`);
  for (const match of html.matchAll(/href="(\/[^"?#]*)/g)) {
    const href = match[1];
    if (
      !href.startsWith('//') &&
      !/\.[a-z0-9]+$/i.test(href) &&
      !href.startsWith('/@') &&
      !href.startsWith('/__') &&
      !visited.has(href)
    )
      pending.push(href);
  }
  for (const match of html.matchAll(/\b(?:src|srcset)="([^"]+)"/gi)) {
    for (const candidate of match[1].split(',')) {
      const image = candidate.trim().split(/\s+/)[0];
      if (image.startsWith('/images/')) images.add(image);
    }
  }
  report.push({ route, title });
}
for (const route of [
  '/world',
  '/world/gallery',
  '/world/objects',
  '/spaces',
  '/projects',
  '/collections',
  '/worlds',
  '/products',
  '/materials',
  '/journal',
]) {
  assert(
    visited.has(route),
    `The retained content route ${route} must stay discoverable`,
  );
}
await Promise.all(
  [...images].map(async (image) => {
    const r = await fetch(new URL(image, origin), { method: 'HEAD' });
    assert.equal(r.status, 200, `Missing image ${image}`);
    assert.match(
      r.headers.get('content-type') ?? '',
      /^image\//,
      `Image URL ${image} returned a non-image response`,
    );
  }),
);
// TP3D PASS 07: one detail route, two contexts. The crawl drops queries, so
// each context is requested explicitly. Neither renders a viewer.
{
  const detail = async (path) => {
    const r = await fetch(new URL(path, origin));
    assert.equal(r.status, 200, `${path}: HTTP ${r.status}`);
    return r.text();
  };
  const crumb = (html) =>
    html.match(/<p class="world-detail-crumb[^"]*">([\s\S]*?)<\/p>/)?.[1] ?? '';
  const rail = (html) =>
    [
      ...(
        html.match(/aria-label="Other worlds"[\s\S]*?<\/nav>/)?.[0] ?? ''
      ).matchAll(/aria-label="Open ([^"]+)"/g),
    ].map(([, title]) => title);
  const order = [
    'Modern Kitchen',
    'White Modern Living Room',
    'Minimalistic Modern Bedroom',
    'Modern Bathroom',
  ];
  for (const slug of ['modern-kitchen', 'modern-bathroom']) {
    const gallery = await detail(`/worlds/${slug}?from=gallery`);
    assert.match(
      crumb(gallery),
      new RegExp(
        `<a href="/world/gallery#${slug}"><span class="sr-only">Back to </span>ROOM 01 / GALLERY</a>`,
      ),
      `${slug}: Gallery context returns to its exhibit`,
    );
    assert.deepEqual(rail(gallery), order, 'Gallery browses its curation');
    const catalogue = await detail(`/worlds/${slug}`);
    assert.match(
      crumb(catalogue),
      new RegExp(`<a href="/worlds#${slug}">3D WORLDS</a>`),
      `${slug}: catalogue context unchanged`,
    );
    assert.deepEqual(
      rail(catalogue),
      order,
      'the catalogue browses all worlds',
    );
    const invalid = [];
    for (const from of ['lobby', 'GALLERY', '', 'gallery&from=gallery']) {
      const html = await detail(`/worlds/${slug}?from=${from}`);
      assert.match(
        crumb(html),
        new RegExp(`href="/worlds#${slug}"`),
        `${slug}?from=${from}: falls back to the catalogue`,
      );
      invalid.push(html);
    }
    // TP3D PASS 08: only the validated Gallery visit is served in the World
    // shell; the catalogue and every invalid context keep the editorial page.
    assert.equal(
      (gallery.match(/data-world-detail-shell="gallery"/g) ?? []).length,
      1,
      `${slug}: Gallery shell marker`,
    );
    assert.equal(
      (gallery.match(/<header class="wl-chrome wl-chrome--room">/g) ?? [])
        .length,
      1,
      `${slug}: one World chrome`,
    );
    for (const html of [catalogue, ...invalid])
      assert.doesNotMatch(
        html,
        /data-world-detail-shell|class="wl-chrome/,
        `${slug}: no World shell outside the Gallery context`,
      );
    for (const html of [gallery, catalogue]) {
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.match(html, /data-viewer="poster"/);
      assert.match(
        html,
        /class="world-detail-explore eyebrow"[^>]*>[\s\S]*?ENTER 3D WORLD/,
      );
      assert.doesNotMatch(
        html,
        /<iframe\b|sketchfab\.com\/models/,
        'no viewer before ENTER 3D WORLD',
      );
    }
  }
}
// TP3D PASS 11: an object study opened from Room 02 is served inside the
// World on the same product route; the collection's study and every invalid
// context keep the editorial page. Neither renders a viewer.
{
  const study = async (path) => {
    const r = await fetch(new URL(path, origin));
    assert.equal(r.status, 200, `${path}: HTTP ${r.status}`);
    return r.text();
  };
  const back = (html) =>
    html.match(/<a\b(?=[^>]*\bclass="back-link")[^>]*\bhref="([^"]*)"/)?.[1];
  for (const slug of ['form-lounge-chair', 'copper-pendant']) {
    const room = await study(`/products/${slug}?from=objects`);
    assert.equal(
      (room.match(/data-product-detail-shell="objects"/g) ?? []).length,
      1,
      `${slug}: Objects shell marker`,
    );
    assert.equal(
      (room.match(/<header class="wl-chrome wl-chrome--room">/g) ?? []).length,
      1,
      `${slug}: one World chrome`,
    );
    assert.equal(back(room), `/world/objects#${slug}`, `${slug}: way back`);
    assert.match(room, />← Back to Objects</);
    assert.match(
      room,
      /<a\b(?=[^>]*\bclass="wl-map-entry")(?=[^>]*\bhref="\/world\/objects")[^>]*aria-current="page"/,
      `${slug}: Objects is the current room`,
    );
    assert.match(room, /Digital model · in preparation/);
    const related = [
      ...room
        .slice(room.indexOf('objects-section'))
        .matchAll(/<a\b(?=[^>]*\bclass="image-link")[^>]*\bhref="([^"]*)"/g),
    ].map(([, h]) => h);
    assert.ok(
      related.length > 0 && related.every((h) => h.endsWith('?from=objects')),
      `${slug}: related studies keep the Objects context`,
    );
    const editorial = await study(`/products/${slug}`);
    const invalid = [];
    for (const query of [
      '?from=OBJECTS',
      '?from=gallery',
      '?from=objects&from=foo',
      '?from=',
    ])
      invalid.push(await study(`/products/${slug}${query}`));
    for (const html of [editorial, ...invalid]) {
      assert.doesNotMatch(
        html,
        /data-product-detail-shell|class="wl-chrome/,
        `${slug}: no World shell outside the Objects context`,
      );
      assert.equal(back(html), '/products', `${slug}: ← All objects`);
      assert.doesNotMatch(html, /\?from=objects/);
    }
    for (const html of [room, editorial]) {
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.doesNotMatch(
        html,
        /<iframe\b|<canvas\b|sketchfab\.com|\bfab\.com|three\.module|\.glb\b/i,
        `${slug}: no viewer, model or marketplace`,
      );
    }
  }
}
const invalidRoutes = [
  '/projects/missing-project',
  '/spaces/missing-space',
  '/experience/missing-room',
  '/collections/missing-collection',
  '/products/missing-product',
  '/materials/missing-material',
  '/journal/missing-article',
  '/worlds/missing-world',
  // Reserved World addresses stay unbuilt until their room exists.
  '/world/archive',
  '/world/gallery/modern-kitchen',
  // TP3D PASS 11: object studies stay on /products/[slug].
  '/world/objects/form-lounge-chair',
];
for (const route of invalidRoutes) {
  const r = await fetch(new URL(route, origin));
  assert.equal(r.status, 404, `Expected 404 for ${route}`);
}
console.log(
  JSON.stringify(
    {
      pages: visited.size,
      images: images.size,
      invalidRoutes: invalidRoutes.length,
      routes: report,
    },
    null,
    2,
  ),
);
