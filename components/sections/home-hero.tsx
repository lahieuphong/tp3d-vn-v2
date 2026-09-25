import { SpatialHero } from '@/components/home/hero/spatial-hero';
import { HeroArchitecture } from '@/components/home/hero/hero-architecture';
import { HeroMonogram } from '@/components/home/hero/hero-monogram';
import {
  BreezeRibbon,
  BreezeVeil,
  HeroLeaves,
} from '@/components/home/hero/breeze-ribbon';
import { HeroSceneA, HeroSceneB } from '@/components/home/hero/hero-scenes';
import { HeroPortals } from '@/components/home/hero/hero-portals';

export function HomeHero() {
  return (
    <SpatialHero>
      <HeroArchitecture />
      <HeroMonogram />
      <HeroPortals />
      <BreezeRibbon />
      <HeroLeaves />
      <HeroSceneA />
      <HeroSceneB />
      <BreezeVeil />
    </SpatialHero>
  );
}
