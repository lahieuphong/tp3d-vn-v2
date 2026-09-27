/** Small, self-contained TP. Existing brand outlines, no image/font request. */
const tee =
  'M35 12H272C302 12 313 23 313 52L311 156H304C297 89 278 53 239 53H208V449C208 490 193 523 151 539L145 533C160 511 164 489 164 448V53H117C71 53 50 73 36 116H28L30 28C30 17 31 12 35 12Z';
const pee =
  'M126 192H225C306 192 340 227 340 285C340 350 292 389 213 389H191V404C191 425 207 434 231 436V444H110V436C140 433 151 425 151 402V231C151 210 144 202 126 200ZM191 206V375H211C265 375 292 345 292 287C292 230 267 206 220 206Z';

export function IntroMonogram() {
  return (
    <div className="hi-intro-monogram" aria-hidden="true">
      <svg
        viewBox="28 11 375 440"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <path d={tee} transform="translate(0 4) scale(1 .61)" fill="#8b795e" />
        <path
          d={pee}
          transform="translate(63 -74) scale(1 1.18)"
          fill="#514334"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}
