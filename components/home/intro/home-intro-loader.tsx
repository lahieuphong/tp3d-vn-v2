'use client';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { claimHomeIntro, type HomeIntroDecision } from './intro-session';
import { mountHomeIntro } from './intro-controller';
import type { CriticalAssetProgress } from './critical-assets';
import { IntroMonogram } from './intro-monogram';
import { IntroBreeze } from './intro-breeze';

/** SSR includes both this presentation overlay and the complete Home. The head
 * decision controls visibility before paint; no client-only replacement page. */
export function HomeIntroLoader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState<CriticalAssetProgress>({
    completed: 0,
    total: 0,
    failed: 0,
    progress: 0,
  });
  const decision = useRef<HomeIntroDecision | null>(null);
  useLayoutEffect(() => {
    decision.current ??= claimHomeIntro();
    if (!decision.current.play) {
      setVisible(false);
      return;
    }
    return mountHomeIntro(decision.current, {
      onProgress: setProgress,
      onComplete: () => setVisible(false),
    });
  }, []);
  if (!visible) return null;
  return (
    <div className="home-intro-loader" data-home-intro-overlay>
      <div className="hi-panel hi-panel-top" aria-hidden="true" />
      <div className="hi-panel hi-panel-bottom" aria-hidden="true" />
      <div className="hi-horizon" aria-hidden="true" />
      <IntroBreeze />
      <div className="hi-monogram-position">
        <div className="hi-monogram-handoff">
          <div className="hi-monogram-arrival">
            <IntroMonogram />
          </div>
        </div>
      </div>
      <IntroBreeze front />
      <p className="hi-intro-slogan">
        A new breeze <em>for living</em>
      </p>
      <div className="hi-loading">
        <output className="hi-status" aria-live="polite">
          LOADING THE SPACE...
        </output>
        <progress
          className="sr-only"
          aria-label="Essential homepage resources"
          max={progress.total || 1}
          value={progress.completed}
          aria-valuetext={`${progress.completed} of ${progress.total} essential resources checked`}
        />
        <div className="hi-progress" aria-hidden="true">
          <span
            style={{ '--hi-progress': progress.progress } as CSSProperties}
          />
        </div>
        {progress.total > 0 && (
          <span className="hi-percentage" aria-hidden="true">
            {Math.round(progress.progress * 100)}%
          </span>
        )}
      </div>
      <p className="hi-signature">INTERIORS &amp; OBJECTS</p>
    </div>
  );
}
