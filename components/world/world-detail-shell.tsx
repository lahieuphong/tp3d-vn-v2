import type { ReactNode } from 'react';
import { WorldChrome } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './world-detail-shell.css';

/** TP3D PASS 08 — a Gallery exhibit's viewing chamber. The detail route
 * renders this only for a server-validated Gallery context
 * (`resolveWorldDetailContext(...).kind === 'gallery'`), so the marker below
 * is the single source of truth for the World shell: the World chrome on
 * top, the World ground from the first paint, and the editorial header and
 * footer out of sight and out of the tab order (world-detail-shell.css).
 * The detail content inside is exactly the catalogue's; only the shell
 * changes with the visitor's context. */
export function WorldDetailShell({ children }: { children: ReactNode }) {
  return (
    <div className="world-chamber" data-world-detail-shell="gallery">
      <WorldChrome currentRoom="gallery" />
      {children}
    </div>
  );
}
