import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { journal } from '@/data/journal';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
export const generateStaticParams = () =>
  journal.map((a) => ({ slug: a.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = journal.find((x) => x.slug === slug);
  return { title: a?.title ?? 'Story not found', description: a?.description };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = journal.find((x) => x.slug === slug);
  if (!a) notFound();
  const next = journal[(journal.indexOf(a) + 1) % journal.length];
  return (
    <main id="main">
      <article>
        <header className="container article-heading">
          <Link className="back-link" href="/journal">
            ← The journal
          </Link>
          <p className="eyebrow">
            {a.category} /{' '}
            <time dateTime={a.date}>
              {new Date(a.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </p>
          <h1>{a.title}</h1>
          <p>{a.description}</p>
        </header>
        <div className="container article-image">
          <EditorialImage src={a.image.src} alt={a.image.alt} priority />
        </div>
        <div className="article-body">
          {a.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
          <p className="article-byline">
            Words by Tân Phong Journal · An editorial study
          </p>
          <div className="next-story">
            <p className="eyebrow">CONTINUE READING</p>
            <h3>{next.title}</h3>
            <TextLink href={`/journal/${next.slug}`}>
              Read the next story
            </TextLink>
          </div>
        </div>
      </article>
    </main>
  );
}
