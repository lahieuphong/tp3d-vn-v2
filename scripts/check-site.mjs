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
for (const route of [
  '/projects/missing-project',
  '/spaces/missing-space',
  '/experience/missing-room',
  '/collections/missing-collection',
  '/products/missing-product',
  '/materials/missing-material',
  '/journal/missing-article',
]) {
  const r = await fetch(new URL(route, origin));
  assert.equal(r.status, 404, `Expected 404 for ${route}`);
}
console.log(
  JSON.stringify(
    {
      pages: visited.size,
      images: images.size,
      invalidRoutes: 7,
      routes: report,
    },
    null,
    2,
  ),
);
