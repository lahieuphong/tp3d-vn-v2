/* oxlint-disable next/no-img-element -- Optimized responsive alpha cloth; decorative and scoped to the opening. */
export function BreezeRibbon() {
  return (
    <div className="sh-ribbon" aria-hidden="true">
      <div data-hero-parallax>
        <img
          className="sh-ribbon-cloth"
          src="/images/spatial-breeze-ribbon.webp"
          srcSet="/images/spatial-breeze-ribbon-720.webp 720w, /images/spatial-breeze-ribbon-1280.webp 1280w, /images/spatial-breeze-ribbon.webp 1448w"
          sizes="(max-width: 639px) 200vw, 100vw"
          width={1448}
          height={1086}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </div>
    </div>
  );
}

/** This broad fold momentarily fills the frame. Scene-image changes happen only
 * while its opaque mineral-coloured core covers the architectural background. */
export function BreezeVeil() {
  return (
    <div className="sh-veil" aria-hidden="true">
      <svg
        viewBox="0 0 1440 1000"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="sh-veil-silk" x1="0" y1="0" x2="1" y2=".75">
            <stop stopColor="#d4c3a5" />
            <stop offset=".2" stopColor="#eee3ce" />
            <stop offset=".43" stopColor="#f7eddb" />
            <stop offset=".57" stopColor="#e3d5ba" />
            <stop offset=".73" stopColor="#f4ead7" />
            <stop offset="1" stopColor="#d5c2a1" />
          </linearGradient>
        </defs>
        <path
          d="M-190 -180C302 -218 539 -81 857 -142C1198 -209 1422 -90 1614 -140L1665 1169C1263 1226 1041 1087 731 1165C405 1237 172 1088 -194 1163Z"
          fill="url(#sh-veil-silk)"
        />
        <g fill="none" stroke="#fff8eb" strokeLinecap="round">
          {Array.from({ length: 35 }, (_, index) => (
            <path
              key={index}
              d={`M${-440 + index * 54} -190C${360 + index * 20} 99 ${203 + index * 40} 214 ${542 + index * 29} 476S${1190 + index * 24} 787 ${679 + index * 33} 1180`}
              opacity={index % 4 === 0 ? 0.42 : 0.2}
              strokeWidth={index % 4 === 0 ? 2 : 0.8}
            />
          ))}
        </g>
        <path
          d="M-200 60C277 3 423 337 768 385S1125 805 1644 629"
          fill="none"
          stroke="#b6a180"
          strokeOpacity=".16"
          strokeWidth="40"
        />
      </svg>
    </div>
  );
}

export function HeroLeaves() {
  return (
    <div className="sh-leaves" aria-hidden="true">
      <div data-hero-parallax>
        <svg
          viewBox="0 0 1440 1000"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          focusable="false"
        >
          <defs>
            <linearGradient id="sh-leaf-mineral" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#b39a6d" />
              <stop offset=".46" stopColor="#79603f" />
              <stop offset="1" stopColor="#493a28" />
            </linearGradient>
          </defs>
          {[
            [550, 137, 21, 0.96],
            [617, 299, -34, 0.82],
            [579, 373, -67, 0.7],
            [689, 556, 13, 0.65],
          ].map(([x, y, angle, size], index) => (
            <g
              key={index}
              transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}
              opacity=".9"
            >
              <path
                d="M-17 17C-16-4-4-13 16-20C17-2 8 13-17 17Z"
                fill="url(#sh-leaf-mineral)"
              />
              <path
                d="M-17 17C-6 8 5-4 16-20"
                fill="none"
                stroke="#d2b989"
                strokeWidth=".6"
                strokeOpacity=".66"
              />
              <path
                d="M-6 7L-9-2M2-3L0-9M-5 5L5 4"
                fill="none"
                stroke="#4c3c27"
                strokeWidth=".5"
                strokeOpacity=".45"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
