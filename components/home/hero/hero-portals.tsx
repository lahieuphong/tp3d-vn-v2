import Link from 'next/link';
/* oxlint-disable next/no-img-element -- Shared optimized photo atlas; all copy and hit areas are real HTML. */
import type { CSSProperties } from 'react';
import { heroPortals } from './hero-content';
export function HeroPortals() {
  return (
    <nav className="sh-portals" aria-label="Discover Tân Phong">
      {heroPortals.map((portal) => (
        <Link
          className="sh-portal"
          href={portal.href}
          key={portal.href}
          prefetch={false}
        >
          <div className="sh-portal-arch">
            <div className="sh-portal-photo">
              <img
                src="/images/spatial-portals.webp"
                srcSet="/images/spatial-portals-720.webp 720w, /images/spatial-portals.webp 1254w"
                sizes="(max-width: 639px) 95vw, 48vw"
                width={1254}
                height={1254}
                alt=""
                loading="eager"
                decoding="async"
                style={
                  {
                    '--portal-x': `${(portal.image % 2) * -50}%`,
                    '--portal-y': `${Math.floor(portal.image / 2) * -50}%`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
          <div className="sh-portal-caption">
            <h2>{portal.title}</h2>
            <span aria-hidden="true">⟶</span>
          </div>
          <p>{portal.subtitle}</p>
        </Link>
      ))}
    </nav>
  );
}
