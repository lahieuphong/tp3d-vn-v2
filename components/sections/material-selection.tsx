import Link from 'next/link';
import { materials } from '@/data/materials';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
export function MaterialSelection({ ids }: { ids?: string[] }) {
  const selected = ids
    ? materials.filter((m) => ids.includes(m.slug)).slice(0, 3)
    : [materials[1], materials[2], materials[3]];
  return (
    <section className="material-section">
      <div className="container section material-layout">
        <div className="material-intro">
          <p className="eyebrow">MATERIALS & DETAILS</p>
          <h2>
            Materials define
            <br />
            the <em>atmosphere.</em>
          </h2>
          <p>
            The warmth of wood. The permanence of stone. The quiet touch of
            linen. A palette to be seen, and felt.
          </p>
          <TextLink href="/materials">Explore the material library</TextLink>
        </div>
        <div className="material-images">
          {selected.map((m) => (
            <Link
              href={`/materials/${m.slug}`}
              key={m.slug}
              className="image-link"
            >
              <EditorialImage src={m.image.src} alt={m.image.alt} />
              <p>
                {m.title}
                <span aria-hidden="true">↗</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
