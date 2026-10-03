'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type ComponentProps, type MouseEvent } from 'react';
import { WORLD_PATH } from '@/data/world-building';
import {
  enterWorld,
  gatewayState,
  isPlainPrimaryActivation,
} from './world-portal';

/** The Atrium's primary gateway. Without JavaScript, or for modifier and
 * middle clicks, it is an ordinary link to the Lobby. A plain primary
 * activation crosses through the PORTAL first. `/world` is prefetched only
 * after real intent (pointer, focus or touch), never on page load. */
export function WorldGatewayLink({
  children,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'>) {
  const router = useRouter();
  const prefetched = useRef(false);
  const intent = () => {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(WORLD_PATH);
  };
  const activate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isPlainPrimaryActivation(event)) return;
    event.preventDefault();
    // A crossing already in progress ignores repeated activation.
    if (gatewayState() !== 'idle') return;
    const preview = event.currentTarget.querySelector<HTMLElement>(
      '[data-world-origin]',
    );
    enterWorld({
      origin: preview?.getBoundingClientRect() ?? null,
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      navigate: () => router.push(WORLD_PATH),
    });
  };
  return (
    <Link
      {...props}
      href={WORLD_PATH}
      prefetch={false}
      data-world-gateway=""
      onClick={activate}
      onPointerEnter={intent}
      onFocus={intent}
      onTouchStart={intent}
    >
      {children}
    </Link>
  );
}
