'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { WorldsChapterOption } from '@/data/home-chapters';
import { EditorialImage } from '@/components/shared/editorial-image';

export function WorldSelector({ options }: { options: WorldsChapterOption[] }) {
  const [active, setActive] = useState(options[0]?.id);
  const selected = options.find((option) => option.id === active) ?? options[0];
  if (!selected) return null;
  return (
    <div className="hc-world-selector" data-chapter-reveal>
      <nav aria-label="Explore a 3D world">
        {options.map((option, index) => (
          <Link
            key={option.id}
            href={option.href}
            prefetch={false}
            className={`hc-world-option${selected.id === option.id ? ' is-active' : ''}`}
            data-callout-index={index}
            onMouseEnter={() => setActive(option.id)}
            onFocus={() => setActive(option.id)}
          >
            <small>{String(index + 1).padStart(2, '0')}</small>
            <span>{option.title}</span>
            <i aria-hidden="true" />
          </Link>
        ))}
      </nav>
      <div className="hc-world-preview">
        <Link
          href={selected.href}
          prefetch={false}
          aria-label={`Explore ${selected.title} in 3D`}
          className="hc-world-preview-image"
        >
          <EditorialImage
            src={selected.previewImage}
            alt={selected.previewAlt}
            sizes="96px"
          />
        </Link>
        <Link href="/worlds" className="hc-link" prefetch={false}>
          VIEW WORLD <span aria-hidden="true">⟶</span>
        </Link>
      </div>
    </div>
  );
}
