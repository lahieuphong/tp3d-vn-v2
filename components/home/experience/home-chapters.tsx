import type { ReactNode } from 'react';
import './home-chapters.css';
export function HomeChapters({ children }: { children: ReactNode }) {
  return <div className="home-chapters">{children}</div>;
}
