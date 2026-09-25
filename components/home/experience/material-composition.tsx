/* oxlint-disable next/no-img-element -- Shared responsive alpha sprite with six lightweight CSS viewports. */
import type { CSSProperties } from 'react';
import artwork from '@/data/home-material-groups.json';

const depth = ['rear', 'mid', 'stone', 'ceramic', 'textile', 'metal'];

/** The source is fetched once through normal browser caching. Separate windows
 * let the six objects settle independently without canvas or image processing. */
export function MaterialComposition() {
  return (
    <figure className="hc-material-tableau">
      <div className="hc-material-composition" aria-hidden="true">
        {artwork.groups.map((group, index) => (
          <div
            className={`hc-material-group hc-material-${group.id}`}
            key={group.id}
            data-chapter-depth="foreground"
            data-material-depth={depth[index]}
            data-material-order={index}
          >
            <div className="hc-material-sprite-window">
              <img
                src={artwork.src}
                srcSet={artwork.srcSet}
                sizes="(max-width: 639px) 100vw, 110vw"
                width={artwork.width}
                height={artwork.height}
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                draggable={false}
                style={
                  {
                    '--sprite-column': group.column,
                    '--sprite-row': group.row,
                  } as CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        A composition of walnut, layered natural stone, rough stone, a ceramic
        vase, woven linen and a dark metal vessel.
      </figcaption>
    </figure>
  );
}
