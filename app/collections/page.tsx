import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
import { collections } from '@/data/collections';
export const metadata: Metadata = {
  title: 'The collections',
  description:
    'Contemporary, Japandi, minimal, modern and classic. Explore five expressions of considered living.',
};
export default function CollectionsPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="THE COLLECTIONS"
        title="A shared sensibility."
        description="Five expressions of the interior. Each with its own language, all grounded in the relationship between space, material and everyday life."
      />
      <section className="container section listing-content all-collections">
        {collections.map((c) => (
          <article key={c.slug}>
            <Link className="image-link" href={`/collections/${c.slug}`}>
              <EditorialImage src={c.image.src} alt={c.image.alt} />
              <h2>{c.title}</h2>
            </Link>
            <p>{c.description}</p>
            <TextLink href={`/collections/${c.slug}`}>
              Explore collection
            </TextLink>
          </article>
        ))}
      </section>
    </main>
  );
}
