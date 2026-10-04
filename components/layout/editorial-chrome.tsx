'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isWorldPath } from '@/data/world-building';

/** The editorial header and footer step aside inside the World, which brings
 * its own reduced chrome (identity, World map, Exit to website). Everywhere
 * else they render exactly as before. A Gallery exhibit on
 * `/worlds/[slug]?from=gallery` and an object study on
 * `/products/[slug]?from=objects` are not World paths: there they stay mounted
 * but are hidden from the first paint by the server-rendered shell markers
 * (components/world/world-detail-shell.css, object-study-shell.css), never
 * by a client effect. */
export function EditorialChrome({ children }: { children: ReactNode }) {
  return isWorldPath(usePathname()) ? null : children;
}
