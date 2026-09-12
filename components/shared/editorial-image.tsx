/* oxlint-disable next/no-img-element -- Images are pre-optimized into local WebP srcsets; no runtime image service is needed. */
import type { CSSProperties } from 'react';
import { imageDimensions } from '@/data/images';

export function EditorialImage({
  src,
  alt,
  priority = false,
  className = '',
  position,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  position?: string;
  sizes?: string;
}) {
  const responsive = src.startsWith('/images/') && src.endsWith('.webp');
  const base = src.replace(/\.webp$/, '');
  const dimensions = imageDimensions[src];
  const responsiveWidths = [720, 1280].filter(
    (width) => !dimensions || width < dimensions.width,
  );
  const srcSet = responsive
    ? [
        ...responsiveWidths.map((width) => `${base}-${width}.webp ${width}w`),
        `${src} ${dimensions?.width ?? 1600}w`,
      ].join(', ')
    : undefined;

  return (
    <div className={`editorial-image ${className}`}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes ?? (priority ? '100vw' : '(max-width: 760px) 100vw, 66vw')}
        alt={alt}
        width={dimensions?.width ?? 1600}
        height={dimensions?.height ?? 1100}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={
          position ? ({ objectPosition: position } as CSSProperties) : undefined
        }
      />
    </div>
  );
}
