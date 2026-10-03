'use client';

import { useSyncExternalStore } from 'react';
import {
  readMotionCapability,
  subscribeMotionCapability,
  type MotionCapability,
} from '@/lib/motion/capability';

const serverCapability = () => null;

/** `null` during server rendering and hydration: render the static
 * composition first and start motion only once the capability is known. */
export function useMotionCapability(): MotionCapability | null {
  return useSyncExternalStore(
    subscribeMotionCapability,
    readMotionCapability,
    serverCapability,
  );
}

/** Conservative: treated as reduced until the client preference is known. */
export function useReducedMotion() {
  return useMotionCapability()?.reduced ?? true;
}
