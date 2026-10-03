import type { CSSProperties } from 'react';
import type { CriticalAssetProgress } from './critical-assets';

export function IntroProgress({
  progress,
}: {
  progress: CriticalAssetProgress;
}) {
  return (
    <div className="hi-loading">
      <div className="hi-loading-exit">
        <output className="hi-status" aria-live="polite">
          PREPARING THE SPACE
        </output>
        <progress
          className="sr-only"
          aria-label="Essential homepage resources"
          max={progress.total || 1}
          value={progress.completed}
          aria-valuetext={`${progress.completed} of ${progress.total} essential resources checked`}
        />
        {/* The hairline is the only visible measure: real asset completion. */}
        <div className="hi-progress-row">
          <div className="hi-progress" aria-hidden="true">
            <span
              style={{ '--hi-progress': progress.progress } as CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
