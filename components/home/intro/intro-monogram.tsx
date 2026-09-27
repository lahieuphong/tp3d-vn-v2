/** The entry TP is a separate object from Scene 1: a pale mineral T above a
 * walnut P. Both faces have inline fallbacks, so their optional local texture
 * samples never gate the first-view asset loader. No filters or canvas. */
const tee =
  'M35 12H272C302 12 313 23 313 52L311 156H304C297 89 278 53 239 53H208V449C208 490 193 523 151 539L145 533C160 511 164 489 164 448V53H117C71 53 50 73 36 116H28L30 28C30 17 31 12 35 12Z';
const pee =
  'M126 192H225C306 192 340 227 340 285C340 350 292 389 213 389H191V404C191 425 207 434 231 436V444H110V436C140 433 151 425 151 402V231C151 210 144 202 126 200ZM191 206V375H211C265 375 292 345 292 287C292 230 267 206 220 206Z';

export function IntroMonogram() {
  return (
    <div className="hi-intro-monogram" aria-hidden="true">
      <svg
        viewBox="26 9 386 445"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <defs>
          <linearGradient id="hi-entry-stone-edge" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ede3cd" />
            <stop offset=".38" stopColor="#b6a283" />
            <stop offset=".77" stopColor="#827058" />
            <stop offset="1" stopColor="#c4b193" />
          </linearGradient>
          <linearGradient
            id="hi-entry-stone-light"
            x1="0"
            y1="0"
            x2="1"
            y2=".6"
          >
            <stop stopColor="#fff7e4" stopOpacity=".56" />
            <stop offset=".4" stopColor="#fff7e4" stopOpacity=".08" />
            <stop offset=".72" stopColor="#5b4833" stopOpacity=".13" />
            <stop offset="1" stopColor="#fff8e7" stopOpacity=".34" />
          </linearGradient>
          <linearGradient
            id="hi-entry-walnut-edge"
            x1="0"
            y1="0"
            x2="1"
            y2=".8"
          >
            <stop stopColor="#ad8053" />
            <stop offset=".32" stopColor="#573b25" />
            <stop offset=".72" stopColor="#39271b" />
            <stop offset="1" stopColor="#775332" />
          </linearGradient>
          <linearGradient
            id="hi-entry-walnut-light"
            x1="0"
            y1="0"
            x2="1"
            y2=".5"
          >
            <stop stopColor="#dfb17c" stopOpacity=".24" />
            <stop offset=".36" stopColor="#dfb17c" stopOpacity="0" />
            <stop offset=".78" stopColor="#25180f" stopOpacity=".2" />
            <stop offset="1" stopColor="#e4ba8c" stopOpacity=".24" />
          </linearGradient>
          <pattern
            id="hi-entry-stone-face"
            width="360"
            height="550"
            patternUnits="userSpaceOnUse"
          >
            <rect width="360" height="550" fill="#e2d8c5" />
            <image
              href="/images/stone-720.webp"
              width="420"
              height="630"
              x="-30"
              y="-35"
              preserveAspectRatio="xMidYMid slice"
              opacity=".24"
            />
            <path
              d="M58-8C77 62 47 119 83 195S69 329 112 407S133 492 127 557M232-14C198 69 266 137 232 228S219 417 266 554"
              fill="none"
              stroke="#ad9677"
              strokeWidth=".9"
              opacity=".38"
            />
            <path
              d="M73-6C93 84 74 127 107 212S105 348 142 425M245 15C236 75 282 138 251 209S249 407 278 512"
              fill="none"
              stroke="#f4e8d1"
              strokeWidth="1.1"
              opacity=".68"
            />
          </pattern>
          <pattern
            id="hi-entry-walnut-face"
            width="360"
            height="550"
            patternUnits="userSpaceOnUse"
          >
            <rect width="360" height="550" fill="#78502f" />
            <image
              href="/images/intro-walnut-360.webp"
              width="360"
              height="550"
              preserveAspectRatio="xMidYMid slice"
              opacity=".48"
            />
            <rect width="360" height="550" fill="#714323" opacity=".2" />
            <path
              d="M127 150C147 226 122 277 140 360S146 427 140 493M173 159C160 231 191 272 173 346S167 416 181 487M218 163C238 229 209 265 227 331S239 421 225 487M268 152C251 240 282 287 264 355S283 450 272 495M318 168C296 247 325 290 307 361S330 429 315 482"
              fill="none"
              stroke="#372519"
              strokeWidth="1.2"
              opacity=".44"
            />
            <path
              d="M154 154C143 247 165 272 153 344S167 428 156 479M203 160C219 222 192 282 210 342S201 429 215 478M286 166C266 221 299 286 282 355S298 436 286 490"
              fill="none"
              stroke="#be9568"
              strokeWidth=".7"
              opacity=".55"
            />
          </pattern>
        </defs>
        <g className="hi-intro-stone" transform="translate(0 4) scale(1 .61)">
          <path
            d={tee}
            fill="url(#hi-entry-stone-edge)"
            transform="translate(7 7)"
          />
          <path d={tee} fill="url(#hi-entry-stone-face)" />
          <path
            d={tee}
            fill="url(#hi-entry-stone-light)"
            stroke="#b6a285"
            strokeWidth=".9"
          />
          <path
            d="M36 14H271C299 14 310 24 310 53M163 55V447C163 483 157 508 147 532M37 114C52 70 77 51 119 51H205"
            fill="none"
            stroke="#fff5df"
            strokeOpacity=".82"
            strokeWidth="1.3"
          />
        </g>
        <g
          className="hi-intro-walnut"
          transform="translate(63 -74) scale(1 1.18)"
        >
          <path
            d={pee}
            fill="url(#hi-entry-walnut-edge)"
            fillRule="evenodd"
            transform="translate(7 3)"
          />
          <path d={pee} fill="url(#hi-entry-walnut-face)" fillRule="evenodd" />
          <path
            d={pee}
            fill="url(#hi-entry-walnut-light)"
            fillRule="evenodd"
            stroke="#775335"
            strokeWidth=".8"
          />
          <path
            d="M128 193H225C291 193 331 219 337 268M193 207V374M212 387C268 387 304 369 324 335M111 443H230"
            fill="none"
            stroke="#c69b6a"
            strokeOpacity=".74"
            strokeWidth="1"
          />
          <path
            d="M211 207C262 207 290 232 290 287C290 342 265 372 213 375"
            fill="none"
            stroke="#35251a"
            strokeOpacity=".64"
            strokeWidth="1.7"
          />
        </g>
      </svg>
    </div>
  );
}
