import { storyBreezeGeometry } from './breeze-geometry';
const initial = storyBreezeGeometry(1440, 900);
/** One cloth definition. Its two approved depth projections transfer into one
 * unmasked near-camera projection; mobile keeps just its original front use. */
export function ContinuousBreeze() {
  return (
    <div
      className="continuous-breeze"
      aria-hidden="true"
      data-continuous-breeze
    >
      <svg
        className="cb-plane cb-back"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
        data-breeze-svg
      >
        <defs>
          <linearGradient id="cb-silk" x1="0" y1="0" x2="1" y2=".2">
            <stop stopColor="#a68e6b" stopOpacity=".12" />
            <stop offset=".3" stopColor="#fff9e9" stopOpacity=".52" />
            <stop offset=".52" stopColor="#b69f7a" stopOpacity=".26" />
            <stop offset=".78" stopColor="#fffdf1" stopOpacity=".66" />
            <stop offset="1" stopColor="#d1ba91" stopOpacity=".16" />
          </linearGradient>
          <linearGradient id="cb-luminous-silk" x1="0" y1=".15" x2="1" y2=".7">
            <stop stopColor="#dfcfb1" />
            <stop offset=".2" stopColor="#fff4dd" />
            <stop offset=".42" stopColor="#ccb794" />
            <stop offset=".57" stopColor="#fff8e8" />
            <stop offset=".78" stopColor="#dbc49f" />
            <stop offset="1" stopColor="#f9ecd4" />
          </linearGradient>
          <linearGradient
            id="cb-depth"
            data-breeze-depth="front"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop stopColor="white" />
            <stop offset=".14" stopColor="white" />
            <stop offset=".32" stopColor="black" />
            <stop offset=".54" stopColor="black" />
            <stop offset=".73" stopColor="white" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <linearGradient
            id="cb-depth-back"
            data-breeze-depth="back"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop stopColor="black" />
            <stop offset=".14" stopColor="black" />
            <stop offset=".32" stopColor="white" />
            <stop offset=".54" stopColor="white" />
            <stop offset=".73" stopColor="black" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask
            id="cb-front-mask"
            maskUnits="objectBoundingBox"
            maskContentUnits="objectBoundingBox"
          >
            <rect width="1" height="1" fill="url(#cb-depth)" />
          </mask>
          <mask
            id="cb-back-mask"
            maskUnits="objectBoundingBox"
            maskContentUnits="objectBoundingBox"
          >
            <rect width="1" height="1" fill="url(#cb-depth-back)" />
          </mask>
          <g id="cb-cloth">
            <path
              data-breeze-luminous
              d={initial.outline}
              fill="url(#cb-luminous-silk)"
              opacity="0"
            />
            <path
              data-breeze-outline
              d={initial.outline}
              fill="url(#cb-silk)"
            />
            {initial.folds.map((d, i) => (
              <path
                key={i}
                data-breeze-fold
                d={d}
                fill={i % 3 === 0 ? '#a68c65' : '#fff9eb'}
                opacity={i % 3 === 0 ? 0.085 : 0.07 + (i % 4) * 0.025}
              />
            ))}
            {initial.threads.map((d, i) => (
              <path
                key={i}
                data-breeze-thread
                d={d}
                fill="none"
                stroke={i % 5 === 0 ? '#927956' : '#fffbee'}
                strokeWidth={i % 4 === 0 ? 1.1 : 0.55}
                strokeOpacity={i % 5 === 0 ? 0.19 : 0.26}
              />
            ))}
          </g>
        </defs>
        <g mask="url(#cb-back-mask)">
          <use
            href="#cb-cloth"
            data-breeze-pose="back"
            transform="translate(0 990)"
          />
        </g>
      </svg>
      <svg
        className="cb-plane cb-front"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
        data-breeze-svg
      >
        <g mask="url(#cb-front-mask)">
          <use
            href="#cb-cloth"
            data-breeze-pose="front"
            transform="translate(0 990)"
          />
        </g>
        <g className="cb-near-projection" opacity="0" data-breeze-transfer>
          <use
            href="#cb-cloth"
            data-breeze-pose="near"
            transform="translate(0 990)"
          />
        </g>
      </svg>
    </div>
  );
}
