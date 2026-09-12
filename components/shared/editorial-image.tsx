/* oxlint-disable next/no-img-element -- Images are pre-optimized into local WebP srcsets; no runtime image service is needed. */
import type { CSSProperties } from 'react';
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
  return (
    <div className={`editorial-image ${className}`}>
      <img
        src={src}
        srcSet={
          responsive
            ? `${base}-720.webp 720w, ${base}-1280.webp 1280w, ${src} ${base.endsWith('hero') ? 2400 : 1600}w`
            : undefined
        }
        sizes={sizes ?? (priority ? '100vw' : '(max-width: 760px) 100vw, 66vw')}
        alt={alt}
        width="1600"
        height="1100"
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
