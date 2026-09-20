import type { World } from '@/data/types';

export const MOSAIC_BLOCK_SIZE = 8;
export const mosaicBreakpoints = [
  'small',
  'mobile',
  'tablet',
  'desktop',
  'wide',
] as const;
export type MosaicBreakpoint = (typeof mosaicBreakpoints)[number];
export type MosaicSlot = {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
};
export type MosaicPattern = {
  id: string;
  columns: number;
  rows: number;
  aspectRatio: number;
  slots: MosaicSlot[];
};

// Each strip partitions the same row interval. These are complete rectangles,
// not auto-placement hints: no implicit tracks or empty cells are possible.
function strips(
  id: string,
  widths: number[],
  heights: number[][],
  aspectRatio: number,
): MosaicPattern {
  let col = 1;
  const slots = widths.flatMap((colSpan, index) => {
    let row = 1;
    const strip = heights[index].map((rowSpan) => {
      const slot = { col, row, colSpan, rowSpan };
      row += rowSpan;
      return slot;
    });
    col += colSpan;
    return strip;
  });
  return {
    id,
    columns: col - 1,
    rows: heights[0].reduce((a, b) => a + b, 0),
    aspectRatio,
    slots,
  };
}

function pattern(
  id: string,
  aspectRatio: number,
  slots: [number, number, number, number][],
): MosaicPattern {
  return {
    id,
    columns: 12,
    rows: 12,
    aspectRatio,
    slots: slots.map(([col, row, colSpan, rowSpan]) => ({
      col,
      row,
      colSpan,
      rowSpan,
    })),
  };
}

const wideFull = [
  pattern('wide-8-a', 1.65, [
    [1, 1, 3, 8],
    [4, 1, 6, 4],
    [10, 1, 3, 8],
    [4, 5, 3, 4],
    [7, 5, 3, 4],
    [1, 9, 4, 4],
    [5, 9, 4, 4],
    [9, 9, 4, 4],
  ]),
  pattern('wide-8-b', 1.65, [
    [1, 1, 3, 5],
    [1, 6, 3, 7],
    [4, 1, 6, 4],
    [4, 5, 3, 4],
    [7, 5, 3, 4],
    [4, 9, 6, 4],
    [10, 1, 3, 7],
    [10, 8, 3, 5],
  ]),
  pattern('wide-8-c', 1.65, [
    [1, 1, 5, 4],
    [6, 1, 3, 4],
    [9, 1, 4, 4],
    [1, 5, 3, 8],
    [4, 5, 3, 4],
    [7, 5, 3, 4],
    [4, 9, 6, 4],
    [10, 5, 3, 8],
  ]),
];
const widePartial = [
  strips('wide-1', [12], [[12]], 2.4),
  strips('wide-2', [5, 7], [[12], [12]], 2.8),
  strips('wide-3', [5, 7], [[12], [5, 7]], 2),
  strips('wide-4', [3, 5, 4], [[12], [5, 7], [12]], 2.8),
  strips('wide-5', [4, 5, 3], [[12], [5, 7], [6, 6]], 2.2),
  strips(
    'wide-6',
    [4, 4, 4],
    [
      [8, 4],
      [5, 7],
      [7, 5],
    ],
    2,
  ),
  pattern('wide-7', 1.8, [
    [1, 1, 3, 8],
    [4, 1, 6, 4],
    [10, 1, 3, 8],
    [4, 5, 3, 4],
    [7, 5, 3, 4],
    [1, 9, 5, 4],
    [6, 9, 7, 4],
  ]),
];
const desktopFull = [
  strips(
    'desktop-8-a',
    [4, 4, 4],
    [
      [4, 3, 5],
      [7, 5],
      [5, 4, 3],
    ],
    1.35,
  ),
  strips(
    'desktop-8-b',
    [4, 4, 4],
    [
      [5, 7],
      [3, 5, 4],
      [4, 3, 5],
    ],
    1.35,
  ),
  strips(
    'desktop-8-c',
    [4, 4, 4],
    [
      [5, 4, 3],
      [3, 4, 5],
      [7, 5],
    ],
    1.35,
  ),
];

// Two-column compositions stay simple at touch sizes. Unequal row divisions
// retain the mixed silhouettes while both strips end on the same baseline.
const touchHeights = [
  [[12]],
  [[12], [12]],
  [[12], [5, 7]],
  [
    [5, 7],
    [7, 5],
  ],
  [
    [7, 5],
    [4, 4, 4],
  ],
  [
    [5, 3, 4],
    [4, 5, 3],
  ],
  [
    [4, 5, 3],
    [3, 3, 3, 3],
  ],
  [
    [3, 4, 2, 3],
    [4, 2, 3, 3],
  ],
];
const mobileRatios = [1.3, 1.65, 1.5, 0.9, 0.72, 0.65, 0.54, 0.5];
const tabletRatios = [1.8, 2.2, 1.75, 1.2, 0.95, 0.85, 0.72, 0.68];
const patterns: Record<MosaicBreakpoint, MosaicPattern[][]> = {
  wide: [...widePartial.map((item) => [item]), wideFull],
  desktop: [...widePartial.map((item) => [item]), desktopFull],
  tablet: [],
  mobile: [],
  small: [],
};
for (let count = 1; count <= MOSAIC_BLOCK_SIZE; count++) {
  for (const breakpoint of ['mobile', 'tablet'] as const) {
    patterns[breakpoint].push(
      Array.from({ length: count === 8 ? 3 : 1 }, (_, variant) => {
        const heights = touchHeights[count - 1].map((strip) => {
          const offset = variant % strip.length;
          return [...strip.slice(offset), ...strip.slice(0, offset)];
        });
        return strips(
          `${breakpoint}-${count}-${variant}`,
          count === 1 ? [2] : [1, 1],
          heights,
          (breakpoint === 'mobile' ? mobileRatios : tabletRatios)[count - 1],
        );
      }),
    );
  }
  const heights = Array.from(
    { length: count },
    (_, index) => [5, 3, 4, 3][index % 4],
  );
  patterns.small.push([
    strips(
      `small-${count}`,
      [1],
      [heights],
      4 / heights.reduce((a, b) => a + b, 0),
    ),
  ]);
}

export function getMosaicPattern(
  count: number,
  breakpoint: MosaicBreakpoint,
  blockIndex = 0,
): MosaicPattern {
  if (!Number.isInteger(count) || count < 1 || count > MOSAIC_BLOCK_SIZE) {
    throw new RangeError('A mosaic block needs between 1 and 8 items.');
  }
  const variants = patterns[breakpoint][count - 1];
  return variants[blockIndex % variants.length];
}

const layoutRatios = { portrait: 0.75, landscape: 1.5, square: 1, wide: 2 };
const referenceWidths: Record<MosaicBreakpoint, number> = {
  small: 284,
  mobile: 350,
  tablet: 720,
  desktop: 1120,
  wide: 1560,
};

export function getSlotRatio(
  slot: MosaicSlot,
  pattern: MosaicPattern,
  breakpoint: MosaicBreakpoint,
): number {
  const width = referenceWidths[breakpoint];
  const height = width / pattern.aspectRatio;
  return (
    (((width + 12) * slot.colSpan) / pattern.columns - 12) /
    (((height + 12) * slot.rowSpan) / pattern.rows - 12)
  );
}

/** Minimum total squared log-aspect error, not a greedy first-fit. At most 8×2⁸ states.
 * Return one slot index per source item; DOM, tab and Load More order stay intact. */
export function assignItemsToSlots(
  items: Pick<World, 'layout'>[],
  pattern: MosaicPattern,
  breakpoint: MosaicBreakpoint,
): number[] {
  if (items.length !== pattern.slots.length)
    throw new RangeError('Mosaic items and slots must match.');
  const ratios = pattern.slots.map((slot) =>
    getSlotRatio(slot, pattern, breakpoint),
  );
  const size = 1 << items.length;
  const costs = new Float64Array(size).fill(Infinity);
  const previous = new Int16Array(size);
  const chosen = new Int8Array(size);
  costs[0] = 0;
  for (let mask = 0; mask < size - 1; mask++) {
    let index = 0;
    for (let bits = mask; bits; bits &= bits - 1) index++;
    const target = layoutRatios[items[index].layout ?? 'landscape'];
    for (let slot = 0; slot < ratios.length; slot++) {
      if (mask & (1 << slot)) continue;
      const next = mask | (1 << slot);
      const cost = costs[mask] + Math.log(target / ratios[slot]) ** 2;
      if (cost < costs[next] - 1e-10) {
        costs[next] = cost;
        previous[next] = mask;
        chosen[next] = slot;
      }
    }
  }
  const assignment = Array.from<number>({ length: items.length });
  for (
    let mask = size - 1, index = items.length - 1;
    mask;
    mask = previous[mask], index--
  )
    assignment[index] = chosen[mask];
  return assignment;
}

export function groupMosaicItems<T>(items: T[]): T[][] {
  return Array.from(
    { length: Math.ceil(items.length / MOSAIC_BLOCK_SIZE) },
    (_, index) =>
      items.slice(index * MOSAIC_BLOCK_SIZE, (index + 1) * MOSAIC_BLOCK_SIZE),
  );
}
