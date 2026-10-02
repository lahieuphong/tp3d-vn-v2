/* oxlint-disable next/no-img-element -- Local responsive, precompressed plates; no image service or canvas. */
import assets from '@/data/home-chapter-assets.json';

export function ChapterImage({
  asset,
  alt = '',
  className = '',
  sizes = '100vw',
  scenePlate = false,
  deferred = false,
}: {
  asset: keyof typeof assets;
  alt?: string;
  className?: string;
  sizes?: string;
  scenePlate?: boolean;
  deferred?: boolean;
}) {
  const metadata = assets[asset];
  const image = (
    <img
      className={className}
      src={deferred ? undefined : metadata.src}
      srcSet={deferred || scenePlate ? undefined : metadata.srcSet}
      data-src={deferred ? metadata.src : undefined}
      data-srcset={deferred && !scenePlate ? metadata.srcSet : undefined}
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
        media="(max-width: 1199px)"
        srcSet={
          deferred ? undefined : `/images/home-chapters/${asset}-1280.webp`
        }
        data-srcset={
          deferred ? `/images/home-chapters/${asset}-1280.webp` : undefined
        }
      />
      {image}
    </picture>
  ) : (
    image
  );
}
