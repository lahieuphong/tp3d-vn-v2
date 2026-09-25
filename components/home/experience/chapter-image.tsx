/* oxlint-disable next/no-img-element -- Local responsive, precompressed plates; no image service or canvas. */
import assets from '@/data/home-chapter-assets.json';

export function ChapterImage({
  asset,
  alt = '',
  className = '',
  sizes = '100vw',
}: {
  asset: keyof typeof assets;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const metadata = assets[asset];
  return (
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
}
