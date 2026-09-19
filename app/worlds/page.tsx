import type { Metadata } from 'next';
import { worlds, worldsEdition } from '@/data/worlds';
import { WorldsHero } from '@/components/worlds/worlds-hero';
import { WorldEntry } from '@/components/worlds/world-entry';
import { TextLink } from '@/components/shared/text-link';
import '@/components/worlds/worlds.css';

export const metadata: Metadata = {
  title: '3D Worlds',
  description:
    'A curated gallery of digital interiors. Discover four spatial studies and step inside each world on Sketchfab.',
};

export default function WorldsPage() {
  return (
    <main id="main" className="worlds-page">
      <WorldsHero
        featured={worlds[2] ?? worlds[0]}
        count={worlds.length}
        edition={worldsEdition}
      />
      <section
        className="container section worlds-introduction"
        aria-labelledby="worlds-intro-title"
      >
        <div>
          <p className="eyebrow">DIGITAL INTERIORS</p>
          <h2 id="worlds-intro-title">
            Rooms beyond
            <br />
            <em>the still image.</em>
          </h2>
        </div>
        <div className="worlds-introduction-copy">
          <p>
            These spatial studies extend the collection into an interactive
            medium — places to move through, observe and experience in three
            dimensions.
          </p>
          <p className="worlds-external-note">
            Each world opens on Sketchfab in a new tab.
          </p>
        </div>
      </section>
      <section
        className="container worlds-catalogue"
        id="world-index"
        aria-label="The 3D Worlds collection"
      >
        {worlds.map((world, index) => (
          <WorldEntry world={world} index={index} key={world.id} />
        ))}
        <p className="worlds-source-note">
          Selected for the {worldsEdition} collection. Scene previews are
          cropped and resized from the original renders; credits accompany each
          study.
        </p>
      </section>
      <section
        className="container section worlds-closing"
        aria-labelledby="worlds-closing-title"
      >
        <p className="eyebrow">MORE SPACES TO COME</p>
        <h2 id="worlds-closing-title">
          A growing collection
          <br />
          of <em>digital interiors.</em>
        </h2>
        <TextLink href="/spaces">Explore our interiors</TextLink>
      </section>
    </main>
  );
}
