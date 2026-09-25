import { HomeHero } from '@/components/sections/home-hero';
import { HomeChapters } from '@/components/home/experience/home-chapters';
import { WorldsChapter } from '@/components/home/experience/worlds-chapter';
import { SpacesChapter } from '@/components/home/experience/spaces-chapter';
import { MaterialsChapter } from '@/components/home/experience/materials-chapter';

export default function Home() {
  return (
    <main id="main" className="home-experience">
      <HomeHero />
      <HomeChapters>
        <WorldsChapter />
        <SpacesChapter />
        <MaterialsChapter />
      </HomeChapters>
    </main>
  );
}
