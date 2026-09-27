'use client';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { claimHomeIntro, type HomeIntroDecision } from './intro-runtime';
import { mountHomeIntro } from './intro-controller';
import type { CriticalAssetProgress } from './critical-assets';
import { IntroMonogram } from './intro-monogram';
import { IntroProgress } from './intro-progress';
import { IntroHeader } from './intro-header';
import { IntroBreeze } from './intro-breeze';

/** SSR includes both this presentation overlay and the complete Home. The head
 * decision controls visibility before paint; no client-only replacement page. */
export function HomeIntroLoader() {
  const [visible, setVisible] = useState(true);
  const complete = useCallback(() => setVisible(false), []);
  return visible ? <IntroPresentation onComplete={complete} /> : null;
}

/** Unmount the controller-owning child as well as its DOM, so the retained
 * page gate cannot keep detached overlay nodes through an effect closure. */
function IntroPresentation({ onComplete }: { onComplete: () => void }) {
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
      onComplete();
      return;
    }
    return mountHomeIntro(decision.current, {
      onProgress: setProgress,
      onComplete,
    });
  }, [onComplete]);
  return (
    <div className="home-intro-loader" data-home-intro-overlay>
      <div className="hi-panel hi-panel-top" aria-hidden="true" />
      <div className="hi-panel hi-panel-bottom" aria-hidden="true" />
      <div className="hi-object-shadow" aria-hidden="true" />
      <IntroBreeze />
      <div className="hi-monogram-position">
        <div className="hi-monogram-motion">
          <div className="hi-monogram-handoff">
            <div className="hi-monogram-pointer">
              <div className="hi-monogram-arrival">
                <IntroMonogram />
              </div>
            </div>
          </div>
        </div>
      </div>
      <IntroBreeze front />
      <div className="hi-tagline-position">
        <p className="hi-intro-slogan">
          <span>A new breeze</span> <em>for living</em>
        </p>
      </div>
      <IntroProgress progress={progress} />
      <p className="hi-bottom-brand">INTERIORS &amp; OBJECTS</p>
      <IntroHeader />
    </div>
  );
}
