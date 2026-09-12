import type { Metadata } from 'next';
import { PageIntro } from '@/components/shared/page-intro';
import { SpacePreview } from '@/components/space/space-preview';
import { spaces } from '@/data/spaces';
export const metadata: Metadata = {
  title: 'Spaces',
  description:
    'Living, dining, kitchen, bedroom and workspace. Discover a considered approach to the rooms of everyday life.',
};
export default function SpacesPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="EXPLORE BY SPACE"
        title="Room for living."
        description="From the first coffee to the last page of a book. Discover spaces shaped around the moments that make a home."
      />
      <section className="container section listing-content all-spaces">
        {spaces.map((s, i) => (
          <SpacePreview space={s} index={i} key={s.slug} />
        ))}
      </section>
    </main>
  );
}
