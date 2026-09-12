import { HomeHero } from '@/components/sections/home-hero';
import {
  Introduction,
  ExploreSpaces,
  FeaturedProjects,
  CollectionsPreview,
  JournalPreview,
} from '@/components/sections/home-sections';
import { ExperienceBanner } from '@/components/sections/experience-banner';
import { MaterialSelection } from '@/components/sections/material-selection';
import { ObjectSelection } from '@/components/sections/object-selection';
export default function Home() {
  return (
    <main id="main">
      <HomeHero />
      <Introduction />
      <ExploreSpaces />
      <FeaturedProjects />
      <ExperienceBanner />
      <CollectionsPreview />
      <MaterialSelection />
      <ObjectSelection />
      <JournalPreview />
    </main>
  );
}
