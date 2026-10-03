'use client';
import { useEffect } from 'react';
import { releaseWorldPortal } from './world-portal';

/** The Lobby is complete without this: it only lifts a PORTAL cover that a
 * homepage crossing left in place. Direct visits, refreshes and new tabs
 * render the same Lobby with nothing to release. */
export function LobbyArrival() {
  useEffect(() => {
    releaseWorldPortal();
  }, []);
  return null;
}
