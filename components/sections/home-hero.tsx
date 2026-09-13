import { HeroMotion } from '@/components/hero/hero-motion';
import { HeroStage } from '@/components/hero/hero-stage';

export function HomeHero() {
  return (
    <HeroMotion>
      <HeroStage />
    </HeroMotion>
  );
}
