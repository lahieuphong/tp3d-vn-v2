'use client';

import { useRef, useEffect, useMemo } from 'react';
import type { World } from '@/data/types';
import { groupMosaicItems } from '@/lib/world-mosaic';
import { MosaicBlock } from './mosaic-block';
import { useCardTilt } from './use-card-tilt';
import { useWorldReveal } from './use-world-reveal';

export function WorldsGrid({
  worlds,
  indices,
  focusFrom,
}: {
  worlds: World[];
  indices: Map<string, number>;
  focusFrom: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const blocks = useMemo(() => groupMosaicItems(worlds), [worlds]);
  useCardTilt(ref);
  useWorldReveal(ref, worlds.map((world) => world.id).join(','));
  useEffect(() => {
    if (focusFrom === null) return;
    const card =
      ref.current?.querySelectorAll<HTMLElement>('.world-card')[focusFrom];
    const link = card?.querySelector<HTMLAnchorElement>('a');
    if (link) {
      link.focus({ preventScroll: true });
      link.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }, [focusFrom]);
  return (
    <div className="worlds-grid" ref={ref}>
      {blocks.map((block, blockIndex) => (
        <MosaicBlock
          key={block[0].id}
          worlds={block}
          blockIndex={blockIndex}
          indices={indices}
        />
      ))}
    </div>
  );
}
