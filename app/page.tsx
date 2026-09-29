import { HomeExperience } from '@/components/home/experience/home-experience';
import { HomeIntroLoader } from '@/components/home/intro/home-intro-loader';
import { HomeHero } from '@/components/sections/home-hero';
import { WorldsChapter } from '@/components/home/experience/worlds-chapter';
import { SkyPortalTrack } from '@/components/home/experience/sky-portal-track';

export default function Home() {
  return (
    <>
      <HomeIntroLoader />
      <HomeExperience>
        <HomeHero />
        <SkyPortalTrack>
          <WorldsChapter />
        </SkyPortalTrack>
      </HomeExperience>
    </>
  );
}
