import { getProject } from '@/data/projects';

// Project facts and photography retain one source of truth in the content model.
const walnut = getProject('the-walnut-residence')!;
const quiet = getProject('quiet-house')!;

export const heroScenes = {
  identity: {
    words: ['SPACES', 'SHAPED', 'for living.'],
    eyebrow: 'A STUDY IN LIVING',
    caption: 'Interiors, objects and the spaces between.',
  },
  first: {
    project: walnut,
    index: '01',
    titleLines: ['The Walnut', 'Residence'],
    theme: 'light',
  },
  second: {
    project: quiet,
    index: '02',
    titleLines: ['Quiet', 'space.'],
    theme: 'light',
  },
  material: { name: 'WALNUT', words: ['Material.', 'Light.', 'Form.'] },
} as const;
