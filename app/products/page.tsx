import type { Metadata } from 'next';
import { PageIntro } from '@/components/shared/page-intro';
import { ObjectSelection } from '@/components/sections/object-selection';
export const metadata: Metadata = {
  title: 'Furniture & objects',
  description:
    'Considered seating, tables and lighting. Discover the objects within our interior studies.',
};
export default function ProductsPage() {
  return (
    <main id="main" className="product-listing">
      <PageIntro
        eyebrow="FURNITURE & OBJECTS"
        title="Objects, considered."
        description="A chair with an inviting curve. A table that anchors a room. A light that changes the atmosphere. Discover the objects within our interiors."
      />
      <ObjectSelection title="The object collection." />
    </main>
  );
}
