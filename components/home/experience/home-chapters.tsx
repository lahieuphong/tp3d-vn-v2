'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { mountHomeChapters } from './chapter-motion';
import { BreezeConnector } from './breeze-connector';
import './home-chapters.css';

export function HomeChapters({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return mountHomeChapters(root.current);
  }, []);
  return (
    <div className="home-chapters" ref={root}>
      {children}
      <BreezeConnector />
    </div>
  );
}
