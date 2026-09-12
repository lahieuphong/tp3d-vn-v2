import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
import { journal } from '@/data/journal';
export const metadata: Metadata = {
  title: 'The journal',
  description:
    'Notes on interiors, natural materials and the small decisions that make a room feel at home.',
};
export default function JournalPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="THE JOURNAL"
        title="An ongoing conversation."
        description="Observations on space, material and the ways we live. Stories from within the interior, and a little beyond it."
      />
      <section className="container section listing-content journal-listing">
        {journal.map((a) => (
          <article key={a.slug}>
            <Link className="image-link" href={`/journal/${a.slug}`}>
              <EditorialImage src={a.image.src} alt={a.image.alt} />
              <p className="eyebrow">
                {a.category} /{' '}
                <time dateTime={a.date}>
                  {new Date(a.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </p>
              <h2>{a.title}</h2>
            </Link>
            <p>{a.description}</p>
            <TextLink href={`/journal/${a.slug}`}>Read story</TextLink>
          </article>
        ))}
      </section>
    </main>
  );
}
