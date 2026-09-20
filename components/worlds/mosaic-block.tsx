import { useMemo, type CSSProperties } from 'react';
import type { World } from '@/data/types';
import {
  assignItemsToSlots,
  getMosaicPattern,
  mosaicBreakpoints,
} from '@/lib/world-mosaic';
import { WorldCard } from './world-card';

export function MosaicBlock({
  worlds,
  blockIndex,
  indices,
}: {
  worlds: World[];
  blockIndex: number;
  indices: Map<string, number>;
}) {
  const layout = useMemo(() => {
    const blockStyle: Record<string, string | number> = {};
    const tileStyles = worlds.map(() => ({}) as Record<string, string>);
    const imageWidths = worlds.map(() => ({}) as Record<string, number>);
    for (const breakpoint of mosaicBreakpoints) {
      const pattern = getMosaicPattern(worlds.length, breakpoint, blockIndex);
      blockStyle[`--${breakpoint}-columns`] = pattern.columns;
      blockStyle[`--${breakpoint}-rows`] = pattern.rows;
      blockStyle[`--${breakpoint}-ratio`] = pattern.aspectRatio;
      assignItemsToSlots(worlds, pattern, breakpoint).forEach(
        (slotIndex, index) => {
          const slot = pattern.slots[slotIndex];
          tileStyles[index][`--${breakpoint}-area`] =
            `${slot.row} / ${slot.col} / span ${slot.rowSpan} / span ${slot.colSpan}`;
          imageWidths[index][breakpoint] = slot.colSpan / pattern.columns;
        },
      );
    }
    const sizes = imageWidths.map(
      (width) =>
        `(max-width: 359px) 100vw, (max-width: 639px) ${Math.ceil(width.mobile * 100)}vw, (max-width: 1023px) ${Math.ceil(width.tablet * 100)}vw, (max-width: 1439px) ${Math.ceil(width.desktop * 100)}vw, (min-width: 1908px) ${Math.ceil(width.wide * 1780)}px, ${Math.ceil(width.wide * 100)}vw`,
    );
    return { blockStyle, tileStyles, sizes };
  }, [worlds, blockIndex]);

  return (
    <div
      className="mosaic-block"
      data-mosaic-count={worlds.length}
      data-mosaic-variant={blockIndex % 3}
      style={layout.blockStyle as CSSProperties}
    >
      {worlds.map((world, index) => (
        <div
          className="mosaic-tile"
          key={world.id}
          style={layout.tileStyles[index] as CSSProperties}
        >
          <WorldCard
            world={world}
            index={indices.get(world.id) ?? 0}
            sizes={layout.sizes[index]}
          />
        </div>
      ))}
    </div>
  );
}
