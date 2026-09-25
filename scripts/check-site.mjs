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
  if (route === '/') {
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
    assert.match(hero, /data-hero-control/);
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
      hero,
      /<canvas\b|<iframe\b|\bclass="[^"]*\bemh-/,
      'Home: opening must use live DOM without old Hero/WebGL/embed layers',
    );
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
await Promise.all(
  [...images].map(async (image) => {
    const r = await fetch(new URL(image, origin), { method: 'HEAD' });
    assert.equal(r.status, 200, `Missing image ${image}`);
  }),
);
const invalidRoutes = [
  '/projects/missing-project',
  '/spaces/missing-space',
  '/experience/missing-room',
  '/collections/missing-collection',
  '/products/missing-product',
  '/materials/missing-material',
  '/journal/missing-article',
  '/worlds/missing-world',
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
