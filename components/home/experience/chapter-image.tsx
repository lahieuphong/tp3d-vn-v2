/* oxlint-disable next/no-img-element -- Local responsive, precompressed plates; no image service or canvas. */
import assets from '@/data/home-chapter-assets.json';

export function ChapterImage({
  asset,
  alt = '',
  className = '',
  sizes = '100vw',
  scenePlate = false,
}: {
  asset: keyof typeof assets;
  alt?: string;
  className?: string;
  sizes?: string;
  scenePlate?: boolean;
}) {
  const metadata = assets[asset];
  const image = (
    <img
      className={className}
      src={`/images/home-chapters/${asset}.webp`}
      srcSet={metadata.srcSet}
      sizes={sizes}
      width={metadata.width}
      height={metadata.height}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
  return scenePlate ? (
    <picture className="hc-scene-picture">
      <source
        media="(max-width: 767px)"
        srcSet={`/images/home-chapters/${asset}-720.webp`}
      />
      <source
        media="(max-width: 1199px)"
        srcSet={`/images/home-chapters/${asset}-1280.webp`}
      />
      {image}
    </picture>
  ) : (
    image
  );
}
