'use client';
import { Component, type ReactNode } from 'react';
import { SceneFallback } from './scene-fallback';
export class ExperienceBoundary extends Component<
  { slug: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <SceneFallback
        slug={this.props.slug}
        failed
        onRetry={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
