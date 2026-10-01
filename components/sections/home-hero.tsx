import { SpatialHero } from '@/components/home/hero/spatial-hero';
import { HeroArchitecture } from '@/components/home/hero/hero-architecture';
import { SharedTP } from '@/components/home/hero/hero-monogram';
import { HeroLeaves } from '@/components/home/hero/hero-leaves';
import { HeroSceneA, HeroSceneB } from '@/components/home/hero/hero-scenes';
import { HeroPortals } from '@/components/home/hero/hero-portals';

export function HomeHero() {
  return (
    <SpatialHero
      architecture={<HeroArchitecture />}
      objects={
        <>
          <SharedTP />
          <HeroLeaves />
        </>
      }
    >
      <HeroPortals />
      <HeroSceneA />
      <HeroSceneB />
    </SpatialHero>
  );
}
