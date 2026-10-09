/** The Atrium's closed doors (owner decision, 2026-10-09): the outlines
 * (atrium-orbit-doors.ts), the pictures drawn from them
 * (work/atrium-orbit/comp-plates/doors.mjs, outside Git, writes the files
 * checked here) and entering a room through its door (room-door-entry.ts,
 * the real module against a small owned DOM double).
 *
 * How the doors are laid on the plates, frame by frame, is checked with the
 * controller in check:atrium-orbit-foundation. Nothing here measures a
 * browser: how the doors look and how the entry feels were judged on a
 * production-equivalent build (docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md
 * §15.9). */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import sharp from 'sharp';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const EXPERIENCE = 'components/home/experience/';
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const file = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const json = (value) =>
  JSON.stringify(value, (_, v) =>
    typeof v === 'number' ? Number(v.toFixed(9)) : v,
  );
const same = (a, b, message) => assert.equal(json(a), json(b), message);
const near = (a, b, message, epsilon = 1e-9) =>
  assert.ok(Math.abs(a - b) <= epsilon, `${message}: ${a} vs ${b}`);

const model = loadStoryMath('atrium-orbit-model');
const manifest = loadStoryMath('atrium-orbit-manifest');
const transition = loadStoryMath('atrium-orbit-transition');
const doors = loadStoryMath('atrium-orbit-doors');
const { ATRIUM_ORBIT_STATES: STATES, ATRIUM_ROOMS: ROOMS } = model;
const {
  ATRIUM_ORBIT_DOORS,
  ATRIUM_ORBIT_DOOR_BATTENS,
  atriumDoors,
  doorAt,
  doorFrame,
  doorOutline,
  doorsClip,
} = doors;
const [W, H] = manifest.ATRIUM_ORBIT_COMP.intrinsic;
const SHOTS = transition.ATRIUM_ORBIT_SHOTS;

const heightAt = (points, x) => {
  for (let i = 1; i < points.length; i++)
    if (x <= points[i][0] || i === points.length - 1) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      return ay + ((by - ay) * (x - ax)) / (bx - ax);
    }
  return points[0][1];
};
/** The points of a CSS polygon() in px of the plate. */
const polygon = (css, tall = 1) => {
  assert.match(css, /^polygon\((?:-?[\d.]+% -?[\d.]+%(?:, )?)+\)$/, css);
  return css
    .slice(8, -1)
    .split(', ')
    .map((pair) => pair.split(' ').map((n) => Number.parseFloat(n) / 100))
    .map(([x, y]) => [x * W, y * H * tall]);
};
/** Signed area (shoelace): a line walked there and back adds nothing. */
const area = (points) =>
  points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + (x * ny - nx * y) / 2;
  }, 0);
const inside = (points, x, y) => {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
};
const SHUT = Object.fromEntries(ROOMS.map((room) => [room, 0]));
const OPEN = Object.fromEntries(ROOMS.map((room) => [room, 1]));

// ---------------------------------------------------------------------------
// 1. The outlines. Every view shows its own room's door; the wide Atrium all
// four, in the order the rooms are numbered. A leaf stands inside the plate,
// its lintel above its sill all the way across, and no two leaves overlap.
// ---------------------------------------------------------------------------
{
  same(Object.keys(ATRIUM_ORBIT_DOORS), STATES);
  same(
    ATRIUM_ORBIT_DOORS.arrival.map((door) => door.room),
    ROOMS,
    'the wide Atrium shows the four doors, in order',
  );
  for (const view of STATES) {
    const shown = atriumDoors(view);
    same(
      shown,
      ATRIUM_ORBIT_DOORS[view],
      `${view}: every door is on the plate`,
    );
    if (view !== 'arrival')
      assert.ok(
        shown.some((door) => door.room === view),
        `${view} shows its own door`,
      );
    assert.equal(
      new Set(shown.map((door) => door.room)).size,
      shown.length,
      `${view}: one door a room`,
    );
    const outlines = shown.map(doorOutline);
    for (const [index, outline] of outlines.entries()) {
      const name = `${view} · ${shown[index].room}`;
      assert.ok(
        outline.left >= 0 && outline.right <= W && outline.left < outline.right,
        `${name}: across the plate`,
      );
      for (const points of [outline.top, outline.bottom]) {
        assert.equal(points[0][0], outline.left, name);
        assert.equal(points.at(-1)[0], outline.right, name);
        for (let i = 1; i < points.length; i++)
          assert.ok(points[i][0] > points[i - 1][0], `${name}: left to right`);
      }
      for (let x = outline.left; x <= outline.right; x += 4) {
        const head = heightAt(outline.top, x);
        const foot = heightAt(outline.bottom, x);
        assert.ok(head > 0 && foot < H, `${name}: inside the plate`);
        // A door is tall: its sill far below its lintel everywhere.
        assert.ok(foot - head > 150, `${name}: lintel above sill at ${x}`);
      }
      for (const other of outlines.slice(index + 1))
        assert.ok(
          outline.right <= other.left || other.right <= outline.left,
          `${name}: leaves never overlap`,
        );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Where a room view shows the doorway beside its own, that leaf is the
// neighbour's own, the pan's shift across: the two plates of a pan carry one
// leaf, as they carry one doorway (the plates were made to agree, §15.7).
// The Kitchen view's Living doorway is its own drawing: the Atrium is round
// and no pan joins the two.
// ---------------------------------------------------------------------------
{
  const shift = (index) => {
    assert.equal(SHOTS[index].kind, 'pan');
    return Math.round(SHOTS[index].shift * W);
  };
  const own = (room) =>
    ATRIUM_ORBIT_DOORS[room].find((door) => door.room === room);
  const borrowed = [
    ['living', 'bedroom', shift(1)],
    ['bedroom', 'living', -shift(1)],
    ['bathroom', 'kitchen', shift(3)],
  ];
  for (const [view, room, across] of borrowed) {
    const door = ATRIUM_ORBIT_DOORS[view].find((item) => item.room === room);
    same(
      door.from,
      { view: room, shift: across },
      `${view}: ${room}'s own leaf`,
    );
    same(
      door.top,
      own(room).top.map(([x, y]) => [x + across, y]),
    );
    same(
      door.sill,
      own(room).sill.map(([x, y]) => [x + across, y]),
    );
    // The plate's edge cuts it; what is left is still a door to choose.
    const outline = doorOutline(door);
    assert.ok(outline.left === 0 || outline.right === W, `${view}: cut`);
    assert.ok(outline.right - outline.left > 250, `${view}: wide enough`);
  }
  for (const view of ROOMS) assert.equal(own(view).from, undefined);
  same(
    STATES.flatMap((view) =>
      ATRIUM_ORBIT_DOORS[view]
        .filter((door) => door.from)
        .map((door) => [view, door.room]),
    ),
    borrowed.map(([view, room]) => [view, room]),
    'no other leaf is borrowed',
  );
  // Bedroom → Bathroom has no doorway in the clear on either plate (a
  // planter stands before it): neither plate carries the other's leaf.
  assert.equal(SHOTS[2].kind, 'pan');
  same(
    [
      ATRIUM_ORBIT_DOORS.bedroom.map((door) => door.room),
      ATRIUM_ORBIT_DOORS.bathroom.map((door) => door.room),
    ],
    [
      ['living', 'bedroom'],
      ['bathroom', 'kitchen'],
    ],
  );
}

// ---------------------------------------------------------------------------
// 3. The push from the wide Atrium onto Living lays one doorway on the
// other (§15.5). The two leaves agree with it: the wide Atrium's battens
// are counted across the opening the push matches, so each lies on the
// Living view's own batten when the plate has grown.
// ---------------------------------------------------------------------------
{
  const push = SHOTS[0];
  assert.equal(push.kind, 'push');
  const wide = ATRIUM_ORBIT_DOORS.arrival[0];
  const living = doorOutline(ATRIUM_ORBIT_DOORS.living[0]);
  same(
    wide.across.map((x) => Math.round(x)),
    push.door.x.map((x) => Math.round(x * W)),
    'counted across the opening the push matches',
  );
  for (const door of STATES.flatMap((view) => ATRIUM_ORBIT_DOORS[view]))
    if (door !== wide) assert.equal(door.across, undefined);
  const grown =
    (push.goal.x[1] - push.goal.x[0]) / (push.door.x[1] - push.door.x[0]);
  for (let k = 0; k <= ATRIUM_ORBIT_DOOR_BATTENS; k++) {
    const joint =
      wide.across[0] +
      (k / ATRIUM_ORBIT_DOOR_BATTENS) * (wide.across[1] - wide.across[0]);
    const lands = (push.goal.x[0] + (joint / W - push.door.x[0]) * grown) * W;
    const own =
      living.left +
      (k / ATRIUM_ORBIT_DOOR_BATTENS) * (living.right - living.left);
    // Under a seventh of a batten: the joints are drawn wider than that.
    near(lands, own, `batten ${k}`, 2.6);
  }
  assert.ok(
    (living.right - living.left) / ATRIUM_ORBIT_DOOR_BATTENS / 2.6 > 7,
    'a seventh of a batten',
  );
}

// ---------------------------------------------------------------------------
// 4. What the leaves show through. One polygon a view, always the same
// number of points (two of them can be played between), in shares of the
// picture's box. Shut, it is exactly the leaves; a leaf that has risen has
// lost that share of its height from below; all risen, nothing is left. The
// lines that join the leaves are walked there and back and enclose nothing.
// ---------------------------------------------------------------------------
{
  for (const view of STATES) {
    const shown = atriumDoors(view);
    const outlines = shown.map(doorOutline);
    const whole = (outline) =>
      Math.abs(area([...outline.top, ...outline.bottom.toReversed()]));
    const shut = polygon(doorsClip(view, SHUT));
    near(
      Math.abs(area(shut)),
      outlines.reduce((sum, outline) => sum + whole(outline), 0),
      `${view}: shut is exactly the leaves`,
      // Percentages are written to three places.
      W * H * 2e-5,
    );
    for (const [index, door] of shown.entries()) {
      const frame = doorFrame(door);
      assert.ok(
        inside(shut, frame.x * W, frame.y * H),
        `${view} · ${door.room}: its middle shows`,
      );
      for (const risen of [0.25, 0.5, 0.9, 1]) {
        const partly = polygon(
          doorsClip(view, { ...SHUT, [door.room]: risen }),
        );
        assert.equal(partly.length, shut.length, 'the same number of points');
        near(
          Math.abs(area(partly)),
          Math.abs(area(shut)) - risen * whole(outlines[index]),
          `${view} · ${door.room} risen ${risen}`,
          W * H * 2e-5,
        );
        // It rises: what is left hangs from the lintel.
        const { left, right, top } = outlines[index];
        const x = (left + right) / 2;
        const head = heightAt(top, x);
        const foot = heightAt(outlines[index].bottom, x);
        if (risen < 1)
          assert.ok(
            inside(partly, x, head + (foot - head) * (1 - risen) * 0.5),
            'the upper part still shows',
          );
        assert.equal(
          inside(partly, x, foot - (foot - head) * risen * 0.5),
          false,
          'the part below is open',
        );
      }
    }
    near(Math.abs(area(polygon(doorsClip(view, OPEN)))), 0, `${view}: open`, 1);
    // Out of range is held; a room without a number counts as shut.
    assert.equal(
      doorsClip(view, { living: 4, bedroom: -2 }),
      doorsClip(view, { ...SHUT, living: 1 }),
    );
    assert.equal(doorsClip(view, {}), doorsClip(view, SHUT));
    // On a stage wider than the plate the picture is taller than its box:
    // the same outline, further down the box.
    const tall = polygon(doorsClip(view, SHUT, 0.75), 0.75);
    assert.equal(tall.length, shut.length);
    for (const [index, [x, y]] of tall.entries()) {
      near(x, shut[index][0], `${view}: across`, 0.05);
      near(y, shut[index][1], `${view}: down the picture`, 0.05);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Choosing a door: the leaf under a place on the picture, or none.
// ---------------------------------------------------------------------------
{
  for (const view of STATES) {
    const shown = atriumDoors(view);
    for (const door of shown) {
      const frame = doorFrame(door);
      assert.equal(
        doorAt(view, frame.x, frame.y),
        door,
        `${view} · ${door.room}`,
      );
      assert.ok(frame.width > 0.08 && frame.height > 0.2, 'a door-sized frame');
      const outline = doorOutline(door);
      // Just above the lintel and just below the sill there is no door.
      const x = (outline.left + outline.right) / 2;
      assert.equal(
        doorAt(view, x / W, (heightAt(outline.top, x) - 3) / H),
        null,
      );
      assert.equal(
        doorAt(view, x / W, (heightAt(outline.bottom, x) + 3) / H),
        null,
      );
    }
    // The pier between two doors, the oculus and the floor are not doors.
    const gaps = shown
      .map(doorOutline)
      .toSorted((a, b) => a.left - b.left)
      .flatMap((outline, i, all) =>
        i ? [(all[i - 1].right + outline.left) / 2] : [],
      );
    for (const x of gaps) assert.equal(doorAt(view, x / W, 0.45), null);
    assert.equal(doorAt(view, 0.5, 0.04), null);
    assert.equal(doorAt(view, 0.5, 0.96), null);
  }
}

// ---------------------------------------------------------------------------
// 6. The doors are shut wherever the Atrium shows, and only choosing one
// opens it. (The first version let them come down as the Atrium arrived, so
// the rooms were seen open once on the way in; the owner asked the same
// evening that they never be.) So nothing in the door data knows the story
// position or time, and the controller never raises a leaf: whatever it
// draws, it draws shut.
// ---------------------------------------------------------------------------
{
  same(
    [doors.doorsRisen, doors.ATRIUM_ORBIT_DOOR_FALL],
    [undefined, undefined],
    'no fall',
  );
  const strip = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const data = strip(read(`${EXPERIENCE}atrium-orbit-doors.ts`));
  assert.doesNotMatch(
    data,
    /home-motion|StoryProgress|OrbitProgress|arrive\(|span\(|editorial\(|Date\.|performance\./,
    'the door data knows no story position and no time',
  );
  const controller = strip(read(`${EXPERIENCE}atrium-orbit-controller.ts`));
  assert.match(controller, /const SHUT = \{\};/);
  same(
    controller.match(/doorsClip\([^)]*\)/g),
    ['doorsClip(id, SHUT, window.height)'],
    'the one outline the controller writes is every door shut',
  );
  assert.doesNotMatch(controller, /SHUT\[|SHUT\.|Object\.assign\(SHUT/);
  // And shut it is: with nothing risen, the outline is every leaf, whole.
  for (const view of STATES)
    assert.equal(doorsClip(view, {}), doorsClip(view, SHUT));
  // The entry is the one place a leaf is raised, and only the chosen one.
  const entry = strip(read(`${EXPERIENCE}room-door-entry.ts`));
  same(entry.match(/doorsClip\([^)]*\)/g), [
    'doorsClip(view, {}, tall)',
    'doorsClip(view, { [room]: 1 }, tall)',
  ]);
}

// ---------------------------------------------------------------------------
// 7. The pictures. One for each file of a plate, the plate's own size, clear
// except on the leaves, and never spilling past them. A borrowed leaf is the
// neighbour's own picture of it.
// ---------------------------------------------------------------------------
{
  const {
    ATRIUM_ORBIT_COMP: COMP,
    compPlateFile,
    plateDoorSources,
    plateSources,
  } = manifest;
  const pixels = async (name) => {
    const { data, info } = await sharp(file(`public${name}`))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, info };
  };
  const sheets = {};
  for (const view of STATES) {
    const plate = plateSources(view);
    const leaves = plateDoorSources(view);
    // The plate's own choices, with `-doors` in the name.
    const named = (text) => text.replaceAll('-doors', '');
    same(
      leaves.sources.map((s) => ({ ...s, srcset: named(s.srcset) })),
      plate.sources,
      `${view}: the plate's own choice of file`,
    );
    same(
      { ...leaves.fallback, src: named(leaves.fallback.src) },
      plate.fallback,
    );
    assert.notEqual(leaves.fallback.src, plate.fallback.src);
    for (const width of view === 'arrival'
      ? COMP.widths.slice(0, 2)
      : COMP.widths) {
      const name = compPlateFile(view, width, '-doors');
      assert.ok(existsSync(file(`public${name}`)), `${name} exists`);
      const meta = await sharp(file(`public${name}`)).metadata();
      const under = await sharp(
        file(`public${compPlateFile(view, width)}`),
      ).metadata();
      same(
        [meta.format, meta.hasAlpha, meta.width, meta.height],
        ['webp', true, under.width, under.height],
        `${name}: the plate's size`,
      );
    }
    // No door picture is requested by any name the manifest does not give.
    const sheet = await pixels(compPlateFile(view, W, '-doors'));
    sheets[view] = sheet;
    same([sheet.info.width, sheet.info.height], [W, H]);
    const alpha = (x, y) =>
      sheet.data[(Math.round(y) * W + Math.round(x)) * 4 + 3];
    const shown = atriumDoors(view);
    const outlines = shown.map(doorOutline);
    for (const [index, door] of shown.entries()) {
      const { left, right, top, bottom } = outlines[index];
      // Solid across the upper part of the leaf (a planter may stand before
      // its foot).
      for (const u of [0.15, 0.5, 0.85]) {
        const x = left + (right - left) * u;
        const head = heightAt(top, x);
        const foot = heightAt(bottom, x);
        assert.ok(
          alpha(x, head + (foot - head) * 0.3) >= 250,
          `${view} · ${door.room}: solid at ${u}`,
        );
      }
    }
    // Clear everywhere else: no pixel shows more than a trace outside the
    // leaves (their outlines and the little they are drawn past them).
    let spilled = 0;
    let covered = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (sheet.data[(y * W + x) * 4 + 3] < 24) continue;
        covered++;
        const on = outlines.some(
          (outline) =>
            x >= outline.left - 4 &&
            x <= outline.right + 4 &&
            y >= heightAt(outline.top, x) - 5 &&
            y <= heightAt(outline.bottom, x) + 3,
        );
        if (!on) spilled++;
      }
    assert.equal(spilled, 0, `${view}: nothing drawn off the leaves`);
    assert.ok(covered > 20000, `${view}: the leaves are drawn`);
    for (const [x, y] of [
      [4, 4],
      [W - 5, 4],
      [W / 2, 60],
      [W / 2, H - 40],
    ])
      assert.equal(alpha(x, y), 0, `${view}: clear at ${x}, ${y}`);
  }
  // A borrowed leaf is the neighbour's own picture of it, moved across:
  // where both plates of a pan show it, they show the same pixels (what
  // differs is the encoder's noise).
  for (const view of STATES)
    for (const door of ATRIUM_ORBIT_DOORS[view]) {
      if (!door.from) continue;
      const here = sheets[view].data;
      const there = sheets[door.from.view].data;
      const outline = doorOutline(door);
      let sum = 0;
      let count = 0;
      for (let y = 0; y < H; y += 2)
        for (
          let x = Math.ceil(outline.left) + 3;
          x < outline.right - 3;
          x += 2
        ) {
          const i = (y * W + x) * 4;
          const j = (y * W + x - door.from.shift) * 4;
          if (here[i + 3] < 250 || there[j + 3] < 250) continue;
          for (let c = 0; c < 3; c++)
            sum += Math.abs(here[i + c] - there[j + c]);
          count += 3;
        }
      assert.ok(count > 30000, `${view} · ${door.room}: compared`);
      assert.ok(
        sum / count < 3,
        `${view} · ${door.room}: one leaf on both plates (${(sum / count).toFixed(2)})`,
      );
    }
}

// ---------------------------------------------------------------------------
// 8. Entering a room (room-door-entry.ts): source rules, then the real
// module in a small owned double of the page.
// ---------------------------------------------------------------------------
const source = read(`${EXPERIENCE}room-door-entry.ts`);
{
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  // It listens for a choice and for the document leaving; it never takes
  // the wheel, a touch or the scroll, and has no loop of its own.
  same(
    [...code.matchAll(/addEventListener\(\s*'([a-z]+)'/g)].map((m) => m[1]),
    ['click', 'pagehide', 'pageshow', 'popstate'],
  );
  same(
    [...code.matchAll(/removeEventListener\(\s*'([a-z]+)'/g)].map((m) => m[1]),
    ['click', 'pagehide', 'pageshow', 'popstate'],
  );
  assert.doesNotMatch(
    code,
    /wheel|touchmove|touchstart|scrollBy|scrollIntoView|overflow|requestAnimationFrame|setInterval|IntersectionObserver|ResizeObserver|MutationObserver/,
  );
  // One prevented default: the link's own activation, taken to go through
  // the door first. One write of the scroll position: the room's page, put
  // at its top under the cover.
  assert.equal(code.match(/preventDefault\(\)/g).length, 1);
  assert.equal(code.match(/scrollTo/g).length, 1);
  assert.match(
    code,
    /function releaseCover\(\) \{[\s\S]*?window\.scrollTo\(\{ top: 0, left: 0, behavior: 'instant' \}\);/,
  );
  // Flat poses only, as everywhere in the orbit; nothing promoted by hand.
  assert.doesNotMatch(
    code,
    /translate3d|translateZ|matrix|rotate|skew|perspective|will-change|willChange|backface/,
  );
  // The route is the room link's own: none is written here, and the
  // approved Atrium, its camera and the World gateway are not named.
  assert.doesNotMatch(code, /['"`]\/(spaces|worlds|world)\b/);
  assert.doesNotMatch(
    code,
    /scene3-camera|hc-atrium-camera|hc-atrium-cta|data-world-gateway|data-atrium-/,
  );
  assert.match(code, /link\.click\(\);/);
  // The controller's stylesheet lets the leaves be chosen, through the copy
  // that lies over them, and adds no motion of its own.
  const css = read(`${EXPERIENCE}atrium-orbit-preview.css`).replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  assert.match(
    css,
    /\.hc-room-orbit-doors \{[^}]*pointer-events: auto;\s*cursor: pointer;\s*\}/,
  );
  assert.match(
    css,
    /\.hc-worlds \.hc-room-orbit-copy,\s*\.hc-worlds \.hc-room-orbit-indicator \{\s*pointer-events: none;\s*\}\s*\.hc-worlds \.hc-room-orbit-copy a \{\s*pointer-events: auto;\s*\}/,
  );
  // The doors fill their plate's own box (the box is what is posed and
  // joined), so they need no size, pose or place in the stack of their own.
  same(
    css
      .match(/\.hc-room-orbit-doors \{([^}]*)\}/)[1]
      .trim()
      .split('\n')
      .map((line) => line.trim()),
    [
      'position: absolute;',
      'inset: 0;',
      'pointer-events: auto;',
      'cursor: pointer;',
    ],
  );
  assert.equal(css.match(/\.hc-room-orbit-doors\b/g).length, 1);
}

// The double: elements that record what is played on them, a clock that is
// stepped by hand, a location that can be moved.
function world({ reduced = false, pathname = '/', pseudo = true } = {}) {
  let now = 0;
  const pending = [];
  const clock = {
    setTimeout(run, ms) {
      const timer = { run, at: now + ms };
      pending.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      const at = pending.indexOf(timer);
      if (at >= 0) pending.splice(at, 1);
    },
    advance(ms) {
      now += ms;
      for (const timer of pending.filter((item) => item.at <= now)) {
        clock.clearTimeout(timer);
        timer.run();
      }
    },
  };
  const played = [];
  class Animation {
    constructor(target, keyframes, options) {
      Object.assign(this, { target, keyframes, options, state: 'running' });
      // As a browser reports it; `pseudo: false` is one that cannot play a
      // pseudo-element and plays the element itself.
      this.effect = {
        pseudoElement: pseudo ? (options.pseudoElement ?? null) : null,
      };
      this.finished = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      this.finished.catch(() => {});
    }
    cancel() {
      if (this.state !== 'running') return;
      this.state = 'cancelled';
      this.reject(new Error('cancelled'));
    }
    finish() {
      if (this.state !== 'running') return;
      this.state = 'finished';
      this.resolve(this);
    }
  }
  class Element {
    children = [];
    parentElement = null;
    dataset = {};
    attrs = new Map();
    listeners = [];
    clicks = 0;
    rect = { left: 0, top: 0, width: 0, height: 0 };
    offsetWidth = 0;
    offsetHeight = 0;
    constructor(tag, className = '') {
      this.tagName = tag.toUpperCase();
      this.className = className;
      const style = {
        setProperty: (name, value) => (style[name] = value),
        removeProperty: (name) => delete style[name],
      };
      this.style = style;
    }
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    remove() {
      const siblings = this.parentElement?.children;
      if (siblings) siblings.splice(siblings.indexOf(this), 1);
      this.parentElement = null;
    }
    contains(node) {
      for (let at = node; at; at = at.parentElement)
        if (at === this) return true;
      return false;
    }
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    }
    getAttribute(name) {
      return this.attrs.get(name) ?? null;
    }
    get href() {
      return this.getAttribute('href');
    }
    has(name) {
      return this.className.split(' ').includes(name);
    }
    closest(selector) {
      const tests = selector.split(',').map((part) => part.trim());
      for (let at = this; at; at = at.parentElement)
        for (const test of tests) {
          if (test === '.hc-room-orbit-cta' && at.has('hc-room-orbit-cta'))
            return at;
          if (test === '.hc-room-orbit-doors' && at.has('hc-room-orbit-doors'))
            return at;
          if (
            test === '.hc-atrium-rooms a[data-room]' &&
            at.tagName === 'A' &&
            at.dataset.room &&
            at.parentElement?.has('hc-atrium-rooms')
          )
            return at;
          assert.ok(
            [
              '.hc-room-orbit-cta',
              '.hc-room-orbit-doors',
              '.hc-atrium-rooms a[data-room]',
            ].includes(test),
            `unexpected selector ${test}`,
          );
        }
      return null;
    }
    getBoundingClientRect() {
      return this.rect;
    }
    animate(keyframes, options) {
      const animation = new Animation(this, keyframes, options);
      played.push(animation);
      return animation;
    }
    addEventListener(type, run, capture = false) {
      this.listeners.push({ type, run, capture });
    }
    removeEventListener(type, run, capture = false) {
      this.listeners = this.listeners.filter(
        (item) =>
          !(item.type === type && item.run === run && item.capture === capture),
      );
    }
    /** A click at this element: capture listeners on the way down. Returns
     * the event, so what was prevented can be read. */
    dispatch(init = {}) {
      const event = {
        target: this,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        clientX: 0,
        clientY: 0,
        defaultPrevented: false,
        stopped: false,
        preventDefault() {
          event.defaultPrevented = true;
        },
        stopPropagation() {
          event.stopped = true;
        },
        ...init,
      };
      const path = [];
      for (let at = this; at; at = at.parentElement) path.unshift(at);
      for (const node of path) {
        if (event.stopped) break;
        for (const item of node.listeners)
          if (item.type === 'click' && item.capture) item.run(event);
      }
      return event;
    }
    /** The link's own activation: the router's handler would hear it at the
     * root unless it is stopped on the way. */
    click() {
      const event = this.dispatch();
      if (!event.stopped && !event.defaultPrevented) {
        this.clicks++;
        page.followed.push(this.href);
      }
    }
  }
  const body = new Element('body');
  const windowListeners = [];
  const page = {
    followed: [],
    assigned: [],
    scrolls: [],
    location: {
      pathname,
      assign: (href) => page.assigned.push(href),
    },
  };
  const window = {
    location: page.location,
    scrollTo: (options) => page.scrolls.push({ ...options }),
    addEventListener: (type, run) => windowListeners.push({ type, run }),
    removeEventListener(type, run) {
      const at = windowListeners.findIndex(
        (item) => item.type === type && item.run === run,
      );
      if (at >= 0) windowListeners.splice(at, 1);
    },
  };
  const loaded = { exports: {} };
  const tokens = { exports: {} };
  const transpile = (text) =>
    ts.transpileModule(text, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText;
  runInNewContext(transpile(read('lib/motion/tokens.ts')), {
    module: tokens,
    exports: tokens.exports,
  });
  runInNewContext(transpile(source), {
    module: loaded,
    exports: loaded.exports,
    window,
    document: {
      body,
      createElement: (tag) => new Element(tag),
    },
    Element,
    HTMLElement: Element,
    setTimeout: (run, ms) => clock.setTimeout(run, ms),
    clearTimeout: (timer) => clock.clearTimeout(timer),
    require(specifier) {
      if (specifier === '@/lib/motion/tokens') return tokens.exports;
      assert.match(specifier, /^\.\/atrium-orbit-(doors|manifest|model)$/);
      return loadStoryMath(specifier.slice(2));
    },
  });

  // The Atrium as the controller leaves it in the Living hold at 1440 × 900:
  // the plate box is 1600 wide, 144px of it off the stage's left.
  const worlds = new Element('section', 'hc-chapter hc-worlds');
  const camera = worlds.appendChild(new Element('div', 'hc-atrium-camera'));
  const backdrop = camera.appendChild(new Element('div', 'hc-atrium-backdrop'));
  const stage = backdrop.appendChild(new Element('div', 'hc-room-orbit-stage'));
  Object.assign(stage, {
    rect: { left: 0, top: 0, width: 1440, height: 900 },
    offsetWidth: 1440,
    offsetHeight: 900,
  });
  const leaves = (view, left) => {
    const picture = stage.appendChild(
      new Element('picture', 'hc-room-orbit-doors'),
    );
    picture.dataset.doors = view;
    Object.assign(picture, {
      rect: { left, top: 0, width: 1600, height: 900 },
      offsetWidth: 1600,
      offsetHeight: 900,
    });
    picture.image = picture.appendChild(new Element('img'));
    return picture;
  };
  const copy = worlds.appendChild(
    new Element('div', 'hc-atrium-copy hc-room-orbit-copy'),
  );
  const cta = copy.appendChild(new Element('a', 'hc-link hc-room-orbit-cta'));
  cta.setAttribute('href', '/spaces/living');
  const arrow = cta.appendChild(new Element('span'));
  const rooms = worlds.appendChild(new Element('nav', 'hc-atrium-rooms'));
  const links = ROOMS.map((room) => {
    const link = rooms.appendChild(new Element('a', 'hc-atrium-room-link'));
    link.dataset.room = room;
    link.setAttribute('href', `/spaces/${room}`);
    link.label = link.appendChild(new Element('span'));
    return link;
  });
  const indicator = worlds.appendChild(
    new Element('div', 'hc-room-orbit-indicator'),
  );
  const gateway = worlds.appendChild(new Element('a', 'hc-atrium-cta'));
  const held = [];
  const state = {
    doors: [],
    whole: true,
    room: 'living',
    tall: 1,
  };
  const host = {
    worlds,
    stage,
    links,
    doors: () => state.doors,
    whole: () => state.whole,
    tall: () => state.tall,
    room: () => state.room,
    reduced: () => reduced,
    hold: (on) => held.push(on),
  };
  const settle = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };
  return {
    module: loaded.exports,
    entry: loaded.exports.createRoomDoorEntry(host),
    clock,
    played,
    page,
    body,
    worlds,
    camera,
    backdrop,
    stage,
    copy,
    cta,
    arrow,
    rooms,
    links,
    indicator,
    gateway,
    leaves,
    state,
    held,
    settle,
    windowListeners,
    fire: (type, event = {}) =>
      windowListeners
        .filter((item) => item.type === type)
        .forEach((item) => item.run(event)),
    cover: () => body.children.find((node) => 'roomEntry' in node.dataset),
    on: (target) => played.filter((item) => item.target === target),
    running: () => played.filter((item) => item.state === 'running'),
  };
}

{
  const { module } = world();
  const { ROOM_ENTRY, isPlainActivation, doorPush } = module;
  const plain = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };
  assert.equal(isPlainActivation(plain), true);
  for (const change of [
    { button: 1 },
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
    { defaultPrevented: true },
  ])
    assert.equal(isPlainActivation({ ...plain, ...change }), false);
  // The same level as the World gateway's cover: above the header, below
  // the intro.
  assert.equal(ROOM_ENTRY.zIndex, 150);
  // The light takes the picture while the camera is still closing in, and
  // the leaf is up before it does.
  assert.ok(
    ROOM_ENTRY.openMs <
      ROOM_ENTRY.pushDelayMs + ROOM_ENTRY.pushMs - ROOM_ENTRY.lightMs,
  );
  assert.ok(ROOM_ENTRY.pushDelayMs + ROOM_ENTRY.pushMs < 1800, 'under 2s');
  // The camera's end: the doorway brought to the middle and grown to fill
  // the stage, no further than the limit, and never so far across that the
  // stage's own edge comes into view.
  const stage = { width: 1440, height: 900 };
  for (const door of [
    { x: 720, y: 420, width: 500, height: 400 },
    { x: 1380, y: 430, width: 300, height: 400 },
    { x: 60, y: 600, width: 220, height: 380 },
    { x: 700, y: 480, width: 190, height: 205 },
    { x: 720, y: 450, width: 2000, height: 1200 },
  ]) {
    const push = doorPush(door, stage);
    assert.ok(push.scale >= 1 && push.scale <= ROOM_ENTRY.pushMax);
    assert.equal(
      push.scale,
      Math.min(
        ROOM_ENTRY.pushMax,
        Math.max(1, stage.width / door.width, stage.height / door.height),
      ),
    );
    // The stage, posed about its top left corner, still covers itself.
    assert.ok(push.x <= 0 && push.x + push.scale * stage.width >= stage.width);
    assert.ok(
      push.y <= 0 && push.y + push.scale * stage.height >= stage.height,
    );
    // Where the stage's edge allows, the doorway ends in the middle.
    const landsX = push.x + push.scale * door.x;
    const freeX =
      stage.width / 2 - push.scale * door.x <= 0 &&
      stage.width / 2 - push.scale * door.x >= stage.width * (1 - push.scale);
    if (freeX) near(landsX, stage.width / 2, 'the doorway in the middle', 1e-9);
  }
  same(doorPush({ x: 720, y: 450, width: 2000, height: 1200 }, stage), {
    x: 0,
    y: 0,
    scale: 1,
  });
}

// Through the Living door, on the Living view.
{
  const w = world();
  const { ROOM_ENTRY } = w.module;
  const picture = w.leaves('living', -102);
  w.state.doors = [{ view: 'living', picture }];
  same(
    [
      w.worlds.listeners.map((item) => [item.type, item.capture]),
      w.windowListeners.map((item) => item.type),
    ],
    [[['click', true]], ['pagehide', 'pageshow', 'popstate']],
    'one listener on the Atrium, three on the document leaving',
  );
  // A place off the leaves is no door; a modified or a middle click is the
  // browser's.
  const frame = doorFrame(ATRIUM_ORBIT_DOORS.living[0]);
  const at = (door) => ({
    clientX: picture.rect.left + door.x * picture.rect.width,
    clientY: picture.rect.top + door.y * picture.rect.height,
  });
  for (const init of [
    { clientX: picture.rect.left + 0.47 * 1600, clientY: 30 },
    { ...at(frame), metaKey: true },
    { ...at(frame), button: 1 },
  ]) {
    const event = picture.image.dispatch(init);
    same(
      [event.defaultPrevented, event.stopped, w.held, w.played.length],
      [false, false, [], 0],
    );
  }
  for (const init of [{ ctrlKey: true }, { shiftKey: true }, { button: 1 }]) {
    const event = w.arrow.dispatch(init);
    same(
      [event.defaultPrevented, w.held.length],
      [false, 0],
      'the link is kept',
    );
  }
  // The door itself.
  const chosen = picture.image.dispatch(at(frame));
  same([chosen.defaultPrevented, chosen.stopped], [true, true]);
  same(w.held, [true], 'the controller stands still');
  const cover = w.cover();
  same(
    [
      cover.dataset.roomEntry,
      cover.getAttribute('aria-hidden'),
      cover.style.position,
      cover.style.inset,
      cover.style.zIndex,
      cover.style.opacity,
      cover.style.pointerEvents,
      cover.parentElement === w.body,
    ],
    ['living', 'true', 'fixed', '0', '150', '0', 'auto', true],
  );
  // What is played: the copy and controls leave (never the camera), and
  // the shade that backed them; the leaf rises; the stage closes in on the
  // doorway; the light comes last.
  const cleared = [w.copy, w.rooms, w.indicator, w.gateway];
  for (const node of cleared) {
    const [fade] = w.on(node);
    same(fade.keyframes, { opacity: 0 });
    assert.equal(fade.options.duration, ROOM_ENTRY.clearMs);
  }
  assert.equal(w.on(w.camera).length, 0, 'the approved camera is not played');
  const shade = w.on(w.backdrop);
  same(
    shade.map((item) => [item.keyframes, item.options.pseudoElement]),
    [[{ opacity: 0 }, '::before']],
    'only the shade behind the copy',
  );
  const [rise] = w.on(picture);
  same(rise.keyframes, [
    { clipPath: doorsClip('living', SHUT) },
    { clipPath: doorsClip('living', { ...SHUT, living: 1 }) },
  ]);
  same(
    [rise.options.duration, rise.options.fill],
    [ROOM_ENTRY.openMs, 'forwards'],
  );
  const [push] = w.on(w.stage);
  assert.equal(w.stage.style['transform-origin'], '0 0');
  assert.equal(push.keyframes[0].transform, 'translate(0px, 0px) scale(1)');
  const pose = push.keyframes[1].transform.match(
    /^translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)$/,
  );
  assert.ok(pose, push.keyframes[1].transform);
  const [x, y, scale] = pose.slice(1).map(Number);
  const door = {
    x: picture.rect.left + frame.x * 1600,
    y: frame.y * 900,
    width: frame.width * 1600,
    height: frame.height * 900,
  };
  near(
    scale,
    Math.min(
      ROOM_ENTRY.pushMax,
      Math.max(1, 1440 / door.width, 900 / door.height),
    ),
    'grown to fill the stage, within the limit',
    1e-3,
  );
  near(x + scale * door.x, 720, 'the doorway ends in the middle across', 0.02);
  assert.ok(y <= 0 && y + scale * 900 >= 900, 'the stage still covers');
  same(
    [push.options.duration, push.options.delay],
    [ROOM_ENTRY.pushMs, ROOM_ENTRY.pushDelayMs],
  );
  const [light] = w.on(cover);
  same(light.keyframes, [{ opacity: 0 }, { opacity: 1 }]);
  assert.equal(
    light.options.delay + light.options.duration,
    ROOM_ENTRY.pushDelayMs + ROOM_ENTRY.pushMs,
    'whole as the camera arrives',
  );
  assert.equal(w.played.length, cleared.length + 4);
  // Chosen again meanwhile (the door, the link, a label): taken, not begun
  // a second time.
  for (const node of [picture.image, w.arrow, w.links[2].label]) {
    const again = node.dispatch(at(frame));
    assert.equal(again.defaultPrevented, true);
  }
  same(
    [w.held, w.played.length, w.page.followed],
    [[true], cleared.length + 4, []],
  );
  // The light is whole: the room's own link is followed, once, and its
  // activation passes this module untouched.
  light.finish();
  await w.settle();
  assert.equal(cover.style.opacity, '1');
  same(w.page.followed, ['/spaces/living']);
  same(
    w.links.map((link) => link.clicks),
    [1, 0, 0, 0],
  );
  same(w.page.scrolls, [], 'the Atrium is not scrolled');
  // The stalled-animation guard fires later and changes nothing.
  w.clock.advance(ROOM_ENTRY.pushDelayMs + ROOM_ENTRY.pushMs + 500);
  same(w.page.followed, ['/spaces/living']);
  // The room's page comes: Home leaves, which is the arrival. The page is
  // put at its top under the cover, the stage is given back as it was, and
  // the cover lifts and is removed.
  w.page.location.pathname = '/spaces/living';
  w.entry.destroy();
  same(w.page.scrolls, [{ top: 0, left: 0, behavior: 'instant' }]);
  assert.equal('transform-origin' in w.stage.style, false);
  same([w.worlds.listeners.length, w.windowListeners.length], [0, 0]);
  const lift = w.on(cover).at(-1);
  same(lift.keyframes, [{ opacity: 1 }, { opacity: 0 }]);
  assert.equal(lift.options.duration, ROOM_ENTRY.releaseMs);
  assert.equal(w.cover(), cover, 'still there while it lifts');
  lift.finish();
  await w.settle();
  assert.equal(w.cover(), undefined, 'and gone');
  // Nothing was asked of the document: the router's link did it.
  w.clock.advance(ROOM_ENTRY.releaseWatchdogMs + 1000);
  same(w.page.assigned, []);
  same(w.held, [true], 'a controller that is gone is not let go');
}

// A browser that cannot play a pseudo-element would fade the backdrop
// itself, and the photograph with it: there the shade is left alone.
{
  const w = world({ pseudo: false });
  w.state.doors = [{ view: 'living', picture: w.leaves('living', -102) }];
  w.arrow.dispatch();
  same(
    w.on(w.backdrop).map((item) => item.state),
    ['cancelled'],
    'the backdrop is never faded',
  );
  assert.ok(w.on(w.stage).length === 1 && w.cover());
  w.entry.destroy();
}

// EXPLORE THIS ROOM and a room label go through the door of their room; a
// room whose door is not on the stage is entered under a short flat cover.
{
  const w = world();
  const living = w.leaves('living', -102);
  // The two plates of the pan lie its shift apart (a 1600px box).
  const bedroom = w.leaves('bedroom', -102 + SHOTS[1].shift * 1600);
  // Mid-pan: both plates show the Bedroom door, the Living plate only the
  // edge of it.
  w.state.doors = [
    { view: 'living', picture: living },
    { view: 'bedroom', picture: bedroom },
  ];
  w.state.room = 'bedroom';
  const chosen = w.arrow.dispatch();
  same([chosen.defaultPrevented, w.held], [true, [true]]);
  assert.equal(w.cover().dataset.roomEntry, 'bedroom');
  // The leaf rises on both pictures that show it; the camera goes through
  // the one that is larger on the stage.
  for (const [view, picture] of [
    ['living', living],
    ['bedroom', bedroom],
  ])
    same(w.on(picture)[0].keyframes, [
      { clipPath: doorsClip(view, SHUT) },
      { clipPath: doorsClip(view, { ...SHUT, bedroom: 1 }) },
    ]);
  const [push] = w.on(w.stage);
  const [x, , scale] = push.keyframes[1].transform
    .match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/)
    .slice(1)
    .map(Number);
  // Both pictures hold the doorway at one place on the stage, which is the
  // point of the plates agreeing; the Living plate's is cut by its edge.
  const own = doorOutline(ATRIUM_ORBIT_DOORS.bedroom[1]);
  const cut = doorOutline(ATRIUM_ORBIT_DOORS.living[1]);
  near(
    bedroom.rect.left + (own.left / W) * 1600,
    living.rect.left + (cut.left / W) * 1600,
    'one doorway under both pictures',
    1e-6,
  );
  // The doorway stands at the stage's right edge: the camera closes in on
  // it as far as that edge allows, which keeps the edge where it is.
  assert.ok(scale > 1);
  near(x, 1440 * (1 - scale), 'held by the stage edge', 0.02);
  w.on(w.cover())[0].finish();
  await w.settle();
  same(w.page.followed, ['/spaces/bedroom']);
  w.entry.destroy();
}
{
  // A label whose door is not on the stage (Kitchen, from Living).
  const w = world();
  const { ROOM_ENTRY } = w.module;
  w.state.doors = [{ view: 'living', picture: w.leaves('living', -102) }];
  const chosen = w.links[3].label.dispatch();
  same([chosen.defaultPrevented, w.held], [true, [true]]);
  same(
    w.played.map((item) => [item.target === w.cover(), item.options.duration]),
    [[true, ROOM_ENTRY.reducedMs]],
    'only the cover, short and flat',
  );
  w.played[0].finish();
  await w.settle();
  same(w.page.followed, ['/spaces/kitchen']);
  w.entry.destroy();
}
{
  // Reduced motion: no leaf, no camera, whatever is on the stage.
  const w = world({ reduced: true });
  const { ROOM_ENTRY } = w.module;
  const picture = w.leaves('living', -102);
  w.state.doors = [{ view: 'living', picture }];
  w.arrow.dispatch();
  same(
    w.played.map((item) => [item.target === w.cover(), item.options.duration]),
    [[true, ROOM_ENTRY.reducedMs]],
  );
  assert.equal(w.on(picture).length + w.on(w.stage).length, 0);
  w.played[0].finish();
  await w.settle();
  same(w.page.followed, ['/spaces/living']);
  w.entry.destroy();
}
{
  // The wide Atrium's plate is not on the stage (not decoded): the leaf
  // still rises over the photograph, and nothing is pushed.
  const w = world();
  const picture = w.leaves('arrival', -80);
  w.state.doors = [{ view: 'arrival', picture }];
  w.state.whole = false;
  w.state.room = null;
  const frame = doorFrame(ATRIUM_ORBIT_DOORS.arrival[2]);
  const chosen = picture.image.dispatch({
    clientX: -80 + frame.x * 1600,
    clientY: frame.y * 900,
  });
  assert.equal(chosen.defaultPrevented, true);
  assert.equal(w.cover().dataset.roomEntry, 'bathroom');
  assert.equal(w.on(picture).length, 1);
  assert.equal(w.on(w.stage).length, 0);
  // EXPLORE THIS ROOM without a room (the wide Atrium has no copy) is no
  // entry at all.
  const none = world();
  none.state.room = null;
  const idle = none.arrow.dispatch();
  same(
    [idle.defaultPrevented, none.held, none.cover()],
    [false, [], undefined],
  );
  w.entry.destroy();
  none.entry.destroy();
}
{
  // A stage wider than the plate: the picture is taller than its box, and
  // the place chosen is read on the picture.
  const w = world();
  const picture = w.leaves('kitchen', 0);
  Object.assign(picture, {
    rect: { left: 0, top: 0, width: 2560, height: 1080 },
    offsetWidth: 2560,
    offsetHeight: 1080,
  });
  w.state.doors = [{ view: 'kitchen', picture }];
  w.state.tall = 1080 / (2560 / (W / H));
  const frame = doorFrame(ATRIUM_ORBIT_DOORS.kitchen[0]);
  const down = 2560 / (W / H);
  const event = picture.image.dispatch({
    clientX: frame.x * 2560,
    clientY: frame.y * down,
  });
  assert.equal(event.defaultPrevented, true);
  assert.equal(w.cover().dataset.roomEntry, 'kitchen');
  same(w.on(picture)[0].keyframes[0], {
    clipPath: doorsClip('kitchen', SHUT, w.state.tall),
  });
  w.entry.destroy();
}

// The room is not entered after all: everything as it was.
{
  const w = world();
  const { ROOM_ENTRY } = w.module;
  const picture = w.leaves('living', -102);
  w.state.doors = [{ view: 'living', picture }];
  w.arrow.dispatch();
  assert.ok(w.running().length > 4);
  // The document leaves mid-entry (a link elsewhere, a closed tab).
  w.fire('pagehide');
  same(
    [
      w.running().length,
      w.cover(),
      w.held,
      'transform-origin' in w.stage.style,
    ],
    [0, undefined, [true, false], false],
    'nothing playing, no cover, the picture given back',
  );
  // And it can be entered again.
  w.arrow.dispatch();
  same(w.held, [true, false, true]);
  // Restored from the back-forward cache mid-entry: the same.
  w.fire('pageshow', { persisted: false });
  assert.ok(w.cover(), 'a fresh page show changes nothing');
  w.fire('pageshow', { persisted: true });
  same([w.cover(), w.held], [undefined, [true, false, true, false]]);
  // Back while the light is whole and the room's page has not come.
  w.arrow.dispatch();
  w.on(w.cover()).at(-1).finish();
  await w.settle();
  same(w.page.followed, ['/spaces/living']);
  w.fire('popstate');
  same([w.cover(), w.held.at(-1)], [undefined, false]);
  // The room's page never comes: its link is opened as a document, and a
  // cover nobody took off is lifted.
  w.arrow.dispatch();
  const cover = w.cover();
  w.on(cover).at(-1).finish();
  await w.settle();
  same(w.page.assigned, []);
  w.clock.advance(ROOM_ENTRY.navigationWatchdogMs + 1);
  same(w.page.assigned, ['/spaces/living']);
  w.clock.advance(ROOM_ENTRY.releaseWatchdogMs);
  const lift = w.on(cover).at(-1);
  same(lift.keyframes, [{ opacity: 1 }, { opacity: 0 }]);
  lift.finish();
  await w.settle();
  assert.equal(w.cover(), undefined);
  w.entry.destroy();
  w.entry.destroy();
  same([w.worlds.listeners.length, w.windowListeners.length], [0, 0]);
  // Destroyed while only opening (Home unmounted for another reason): the
  // cover goes with it.
  const other = world();
  other.state.doors = [
    { view: 'living', picture: other.leaves('living', -102) },
  ];
  other.arrow.dispatch();
  assert.ok(other.cover());
  other.entry.destroy();
  same(
    [other.cover(), other.running().length, other.page.scrolls],
    [undefined, 0, []],
  );
}

console.log(
  `Atrium doors passed: ${STATES.map((view) => `${view} ${atriumDoors(view).length}`).join(', ')} ` +
    `leaves inside their plates and never overlapping; a doorway shown by ` +
    `two plates carries one leaf (the pan's shift across, the same pixels); ` +
    `the wide Atrium's Living battens lie on the Living view's under the ` +
    `push; one clip of a fixed number of points, exactly the leaves when ` +
    `shut and nothing when risen; no fall: the controller draws every door ` +
    `shut at every position and only the entry raises one; a door picture for ` +
    `every plate file, clear off the leaves; entering a room: one click ` +
    `listener, plain activations only, the leaf up, the stage in, the ` +
    `light, then the room link's own route once; modified clicks, a second ` +
    `choice, reduced motion, a door off stage, a document that leaves and a ` +
    `route that never comes all end clean.`,
);
