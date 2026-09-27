/* oxlint-disable next/no-img-element -- Responsive, local transparent cloth. */
import { useLayoutEffect, useRef } from 'react';

function showFallback(image: HTMLImageElement) {
  image
    .closest('.hi-breeze-drift')
    ?.setAttribute('data-breeze-unavailable', '');
}

export function IntroBreeze({ front = false }: { front?: boolean }) {
  const image = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    // A cached/early failure can precede hydration and its React error handler.
    if (image.current?.complete && image.current.naturalWidth === 0)
      showFallback(image.current);
  }, []);
  return (
    <div
      className={`hi-intro-breeze ${front ? 'hi-breeze-front' : 'hi-breeze-rear'}`}
      aria-hidden="true"
    >
      <div className="hi-breeze-handoff">
        <div className="hi-breeze-pointer">
          <div className="hi-breeze-drift">
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet="/images/intro-breeze-720.webp"
              />
              <img
                ref={image}
                src="/images/intro-breeze-1280.webp"
                srcSet="/images/intro-breeze-720.webp 720w, /images/intro-breeze-1280.webp 1280w"
                sizes="(max-width: 767px) 100vw, 112vw"
                width={1280}
                height={853}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
                draggable={false}
                onError={(event) => {
                  showFallback(event.currentTarget);
                }}
              />
            </picture>
            <svg
              className="hi-breeze-fallback"
              viewBox="0 0 1280 853"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path
                d="M-40 590C240 788 412 424 686 423S1103 265 1320 6L1320 235C1101 170 1042 568 721 598S198 785-40 838Z"
                fill="#fffaf0"
                fillOpacity=".45"
              />
              <path
                d="M-40 692C253 819 410 375 738 457S1125 150 1320 98M-40 741C226 731 415 535 704 505S1111 356 1320 148M-40 795C333 662 376 605 707 547S1110 293 1320 209"
                fill="none"
                stroke="#fffdf6"
                strokeOpacity=".6"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
