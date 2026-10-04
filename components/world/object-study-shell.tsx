import type { ReactNode } from 'react';
import { WorldChrome } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './object-study-shell.css';

/** TP3D PASS 11 — an object study inside Room 02. The product route renders
 * this only for a server-validated Room 02 context
 * (`resolveProductDetailContext(...).kind === 'objects'`), so the marker
 * below is the single source of truth for the World shell: the World chrome
 * on top, the World ground from the first paint, and the editorial header
 * and footer out of sight and out of the tab order (object-study-shell.css).
 * The study inside is the editorial `ProductDetail`; only the shell, the way
 * back and the related studies' URLs change with the visitor's context. */
export function ObjectStudyShell({ children }: { children: ReactNode }) {
  return (
    <div className="world-object-study" data-product-detail-shell="objects">
      <WorldChrome currentRoom="objects" />
      {children}
    </div>
  );
}
