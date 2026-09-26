/* oxlint-disable next/no-img-element -- Local alpha cloth, independent of the Home architecture. */
export function IntroBreeze({ front = false }: { front?: boolean }) {
  return (
    <div
      className={`hi-intro-breeze ${front ? 'hi-breeze-front' : 'hi-breeze-rear'}`}
      aria-hidden="true"
    >
      <div className="hi-breeze-drift">
        <img
          src="/images/intro-breeze-1280.webp"
          srcSet="/images/intro-breeze-720.webp 720w, /images/intro-breeze-1280.webp 1280w"
          sizes="(max-width: 639px) 150vw, 110vw"
          width={1280}
          height={853}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="low"
          draggable={false}
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />
      </div>
    </div>
  );
}
