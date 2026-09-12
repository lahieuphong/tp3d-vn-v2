import type { Metadata } from 'next';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
import { images } from '@/data/images';
export const metadata: Metadata = {
  title: 'Our perspective',
  description:
    'An independent exploration of interiors, materials and objects. Discover the thinking behind Tân Phong.',
};
export default function AboutPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="OUR PERSPECTIVE"
        title="Interiors, considered."
        description="We are interested in the relationship between a room and the life within it. The materials we touch, the objects we keep, and the spaces that become our own."
      />
      <div className="container about-image">
        <EditorialImage
          src={images.living}
          alt="Warm daylight across a sculptural sofa and textured wall"
          priority
        />
      </div>
      <section className="container section about-manifesto">
        <p className="eyebrow">A QUIET POINT OF VIEW</p>
        <div>
          <h2>
            Good spaces make room
            <br />
            for <em>ordinary life.</em>
          </h2>
          <p>
            Our approach begins with attention. To the way light moves through a
            room. To the scale of a chair beside a table. To the difference
            between a space that looks complete and one that feels welcoming.
          </p>
          <p>
            Tân Phong is an independent collection of interior studies, material
            notes and considered objects. Rooted in a contemporary sensibility,
            it draws on the warmth of natural materials and the clarity of
            architectural thinking.
          </p>
          <TextLink href="/projects">Explore the interiors</TextLink>
        </div>
      </section>
      <section className="about-note">
        <div className="container section">
          <p className="eyebrow">ABOUT THE COLLECTION</p>
          <h2>A place to explore.</h2>
          <p>
            This website presents concept residences and illustrative object
            studies. The photography is a curated visual reference, not a
            portfolio of commissioned work. Project locations, areas and product
            specifications are sample content.
          </p>
          <p>
            Spatial experiences are being prepared. Each interior has a
            dedicated place for its future 3D scene, so the journey can continue
            beyond the photograph.
          </p>
          <TextLink href="/contact">Start a conversation</TextLink>
        </div>
      </section>
    </main>
  );
}
