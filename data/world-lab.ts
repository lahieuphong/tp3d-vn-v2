/** TP3D PASS 14 — Room 04, Lab: the deliberate curation. Four studies, each
 * a system TP3D already runs in production. The Lab adapts these systems; it
 * never forks them. A live study consumes the production module; a reference
 * study describes the real system and leaves it where it works.
 *
 * `sourceModules` is engineering provenance: the production files each study
 * shows or reuses, kept for tests and documentation and never rendered to
 * visitors. `yarn check:lab` verifies every path exists.
 *
 * Experiment numbers come from the order below (EX–01…), like the Archive's
 * accessions. A fifth study needs a fifth production system first. */

export type LabExperimentId = 'atmosphere' | 'breeze' | 'depth' | 'threshold';

/** `live`: the visitor can run the production system here. `reference`: the
 * system is shown and explained, and runs only where it belongs. */
export type LabMode = 'live' | 'reference';

export type LabExperiment = {
  /** Also the study's fragment: /world/lab#<id>. */
  id: LabExperimentId;
  number: string;
  title: string;
  question: string;
  medium: string;
  productionContext: string;
  mode: LabMode;
  sourceModules: readonly string[];
};

type CuratedExperiment = Omit<LabExperiment, 'number'>;

const curation = [
  {
    id: 'atmosphere',
    title: 'Atmosphere',
    question: 'How can air become a spatial transition?',
    medium: 'WebGL / Shader / Controlled progress',
    productionContext: 'Homepage / Atmosphere → World',
    mode: 'live',
    sourceModules: [
      'components/home/experience/atmospheric-sky-bridge.tsx',
      'components/home/experience/atmospheric-sky-renderer.ts',
      'components/home/experience/atmospheric-sky-frame.ts',
      'components/home/experience/atmospheric-sky-shaders.ts',
      'components/home/experience/atmospheric-bridge-frame.ts',
    ],
  },
  {
    id: 'breeze',
    title: 'Breeze',
    question: 'How can one surface carry depth without becoming an effect?',
    medium: 'SVG / Geometry / Scroll-driven pose',
    productionContext: 'Homepage / Spatial bridge',
    mode: 'reference',
    sourceModules: [
      'components/home/experience/continuous-breeze.tsx',
      'components/home/experience/breeze-renderer.ts',
      'components/home/experience/breeze-geometry.ts',
      'components/home/experience/breeze-bridge-pose.ts',
    ],
  },
  {
    id: 'depth',
    title: 'Depth',
    question:
      'How little movement is enough to make a surface feel dimensional?',
    medium: 'Pointer / Transform / On-demand frame',
    productionContext: 'Homepage / Gallery / Objects',
    mode: 'live',
    sourceModules: [
      'lib/motion/pointer.ts',
      'components/world/gallery-depth.tsx',
      'components/home/experience/hero-depth.ts',
    ],
  },
  {
    id: 'threshold',
    title: 'Threshold',
    question: 'How should crossing into another spatial mode feel intentional?',
    medium: 'WAAPI / Semantic navigation / Route transition',
    productionContext: 'Home → World',
    mode: 'reference',
    sourceModules: [
      'components/world/world-portal.ts',
      'components/world/world-gateway-link.tsx',
    ],
  },
] as const satisfies readonly CuratedExperiment[];

export const experimentNumber = (index: number) =>
  `EX–${String(index + 1).padStart(2, '0')}`;

export const labExperiments: readonly LabExperiment[] = curation.map(
  (experiment, index) => ({ ...experiment, number: experimentNumber(index) }),
);

export const LAB_MODE_LABEL: Record<LabMode, string> = {
  live: 'Live study',
  reference: 'Reference study',
};
