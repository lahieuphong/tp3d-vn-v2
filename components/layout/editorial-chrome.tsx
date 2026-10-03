'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isWorldPath } from '@/data/world-building';

/** The editorial header and footer step aside inside the World, which brings
 * its own reduced chrome (identity, World map, Exit to website). Everywhere
 * else they render exactly as before. */
export function EditorialChrome({ children }: { children: ReactNode }) {
  return isWorldPath(usePathname()) ? null : children;
}
