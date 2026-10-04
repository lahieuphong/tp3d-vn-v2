'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isWorldPath } from '@/data/world-building';

/** The editorial header and footer step aside inside the World, which brings
 * its own reduced chrome (identity, World map, Exit to website). Everywhere
 * else they render exactly as before. A Gallery exhibit on
 * `/worlds/[slug]?from=gallery` is not a World path: there they stay mounted
 * but are hidden from the first paint by the server-rendered World shell
 * marker (components/world/world-detail-shell.css), never by a client effect. */
export function EditorialChrome({ children }: { children: ReactNode }) {
  return isWorldPath(usePathname()) ? null : children;
}
