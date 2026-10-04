'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { bindWorldMapEscape } from './world-map-escape';

/** TP3D PASS 09 — the World map stays a native `<details>`, its summary and
 * rooms server-rendered by `WorldChrome`. This island adds one behaviour:
 * Escape closes the open map before anything else (world-map-escape.ts). */
export function WorldMapDisclosure({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current) return bindWorldMapEscape(ref.current);
  }, []);
  return <details ref={ref}>{children}</details>;
}
