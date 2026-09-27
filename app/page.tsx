import { HomeExperience } from '@/components/home/experience/home-experience';
import { HomeIntroLoader } from '@/components/home/intro/home-intro-loader';
import { HomeHero } from '@/components/sections/home-hero';
import { WorldsChapter } from '@/components/home/experience/worlds-chapter';

export default function Home() {
  return (
    <>
      <HomeIntroLoader />
      <HomeExperience>
        <HomeHero />
        <WorldsChapter />
      </HomeExperience>
    </>
  );
}
