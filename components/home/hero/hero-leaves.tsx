export function HeroLeaves() {
  return (
    <div className="sh-leaves" aria-hidden="true">
      <div data-hero-surface>
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
