/** An overlapping T and P drawn as an architectural object. The face and its
 * shallow extrusion share the same outline; no live text or font is rasterised. */
const tee =
  'M35 12H272C302 12 313 23 313 52L311 156H304C297 89 278 53 239 53H208V449C208 490 193 523 151 539L145 533C160 511 164 489 164 448V53H117C71 53 50 73 36 116H28L30 28C30 17 31 12 35 12Z';
const pee =
  'M126 192H225C306 192 340 227 340 285C340 350 292 389 213 389H191V404C191 425 207 434 231 436V444H110V436C140 433 151 425 151 402V231C151 210 144 202 126 200ZM191 206V375H211C265 375 292 345 292 287C292 230 267 206 220 206Z';

export function HeroMonogram() {
  return (
    <div className="sh-monogram" aria-hidden="true">
      <div data-hero-surface>
        <svg
          viewBox="0 0 360 550"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
        >
          <defs>
            <linearGradient id="sh-mineral-edge" x1="0" y1="0" x2="1" y2=".8">
              <stop stopColor="#77664d" />
              <stop offset=".32" stopColor="#332b20" />
              <stop offset=".57" stopColor="#79684d" />
              <stop offset="1" stopColor="#baa380" />
            </linearGradient>
            <linearGradient id="sh-mineral-light" x1="0" y1="0" x2="1" y2=".5">
              <stop stopColor="#241e16" stopOpacity=".55" />
              <stop offset=".3" stopColor="#877355" stopOpacity=".08" />
              <stop offset=".57" stopColor="#f4e5c7" stopOpacity=".27" />
              <stop offset=".7" stopColor="#211b13" stopOpacity=".26" />
              <stop offset="1" stopColor="#f1dfbd" stopOpacity=".16" />
            </linearGradient>
            <pattern
              id="sh-mineral-face"
              width="360"
              height="550"
              patternUnits="userSpaceOnUse"
            >
              <rect width="360" height="550" fill="#8c795a" />
              <image
                href="/images/stone-720.webp"
                width="560"
                height="720"
                x="-85"
                y="-45"
                preserveAspectRatio="xMidYMid slice"
                opacity=".4"
              />
              <rect width="360" height="550" fill="#695438" opacity=".34" />
              <path
                d="M74 -10C113 66 111 117 90 170S95 285 126 331S141 442 122 551M197 -15C176 112 236 157 207 272S183 451 234 562M277 -12C238 102 302 142 279 262S307 479 281 554"
                stroke="#30291e"
                strokeWidth=".75"
                fill="none"
                opacity=".3"
              />
              <path
                d="M88 -4C115 96 86 135 116 214S99 357 150 434M211 0C188 130 244 137 226 270S214 458 253 545"
                stroke="#f1e2c4"
                strokeWidth=".6"
                fill="none"
                opacity=".38"
              />
            </pattern>
          </defs>
          <g transform="translate(9 5)">
            <path d={tee} fill="url(#sh-mineral-edge)" />
          </g>
          <path d={tee} fill="url(#sh-mineral-face)" />
          <path
            d={tee}
            fill="url(#sh-mineral-light)"
            stroke="#a18c6d"
            strokeWidth=".8"
          />
          <path
            d="M36 14H271C299 14 310 24 310 53M163 55V447C163 483 157 508 147 532M37 114C52 70 77 51 119 51H205"
            fill="none"
            stroke="#e3d2af"
            strokeOpacity=".58"
            strokeWidth="1.1"
          />
          <path
            d={pee}
            fill="url(#sh-mineral-edge)"
            fillRule="evenodd"
            transform="translate(9 6)"
          />
          <path d={pee} fill="url(#sh-mineral-face)" fillRule="evenodd" />
          <path
            d={pee}
            fill="url(#sh-mineral-light)"
            fillRule="evenodd"
            stroke="#9c8769"
            strokeWidth=".8"
          />
          <path
            d="M128 193H225C291 193 331 219 337 268M193 207V374M212 387C268 387 304 369 324 335M111 443H230"
            fill="none"
            stroke="#e2d0aa"
            strokeOpacity=".64"
            strokeWidth="1"
          />
          <path
            d="M211 207C262 207 290 232 290 287C290 342 265 372 213 375"
            fill="none"
            stroke="#32291d"
            strokeOpacity=".62"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
