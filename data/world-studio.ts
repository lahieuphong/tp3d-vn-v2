import type { Project } from './types';
import { projects } from './projects';

/** TP3D PASS 15 — Room 05, Studio: the project table. What belongs to the
 * Studio itself lives here — the areas of conversation, how a project can
 * begin, the starting-brief prompts and the one enquiry status. Concept
 * studies are referenced by slug only and resolved against
 * `data/projects.ts`, which stays the single source of every project fact.
 *
 * Truthfulness: these are areas of conversation, not service packages (no
 * prices, deliverables or timelines), and the beginning is how a project
 * can begin, not a proven client process. Project enquiries are not yet
 * operational: the status says so, matching `/contact`. */

export type StudioArea = {
  title: string;
  question: string;
  /** What the conversation covers, in a few words. */
  terms: readonly string[];
};

export const studioAreas = [
  {
    title: 'Space',
    question: 'What should the space make possible?',
    terms: ['Proportion', 'Sequence', 'Use', 'Atmosphere'],
  },
  {
    title: 'Material',
    question: 'What should it feel like to live with?',
    terms: ['Surface', 'Tone', 'Texture', 'Objects'],
  },
  {
    title: 'Visualization',
    question: 'How can an idea become clear before it is built?',
    terms: ['Spatial studies', '3D worlds', 'Interactive communication'],
  },
] as const satisfies readonly StudioArea[];

export type StudioStep = { title: string; prompts: readonly string[] };

export const studioBeginning = [
  {
    title: 'Context',
    prompts: ['What kind of space is it?', 'Where is it?', 'Who will use it?'],
  },
  {
    title: 'Direction',
    prompts: [
      'What should change?',
      'What should remain?',
      'How should it feel?',
    ],
  },
  {
    title: 'Study',
    prompts: ['Space', 'Material', 'Objects', 'Relationships'],
  },
  {
    title: 'Visualize',
    prompts: [
      'Images',
      'Spatial studies',
      '3D or interactive work, where it helps',
    ],
  },
] as const satisfies readonly StudioStep[];

export type StudioBriefPrompt = { label: string; prompt: string };

/** Guidance for a first conversation. Read, never filled in: there is no
 * form, input or submission anywhere in the Studio. */
export const studioBriefPrompts = [
  {
    label: 'Type of space',
    prompt: 'A home, a single room, a workplace — and how it is used today.',
  },
  {
    label: 'Location',
    prompt: 'The city, and whether the building already exists.',
  },
  {
    label: 'Scale',
    prompt: 'An approximate area, if it is known.',
  },
  {
    label: 'Stage',
    prompt: 'An idea, a site, a plan, or work already under way.',
  },
  {
    label: 'What should change',
    prompt: 'What no longer works, and what should stay as it is.',
  },
  {
    label: 'Priorities',
    prompt: 'The two or three things that matter most.',
  },
  {
    label: 'References',
    prompt: 'Places, materials or images you respond to, and why.',
  },
] as const satisfies readonly StudioBriefPrompt[];

/** The one truthful status of project enquiries on the site. It matches the
 * Contact page ("will open here soon") and is never inferred from a date or
 * environment. */
export type ProjectEnquiryStatus = 'opening-soon';
export const PROJECT_ENQUIRY_STATUS: ProjectEnquiryStatus = 'opening-soon';
export const PROJECT_ENQUIRY_STATUS_LABEL: Record<
  ProjectEnquiryStatus,
  string
> = { 'opening-soon': 'Opening soon' };

/** Concept studies shown at the table, by slug, in this order. */
export const studioStudySlugs = [
  'the-walnut-residence',
  'quiet-house',
  'courtyard-residence',
] as const;

/** Every curated slug resolves, or the build fails: a concept study is
 * never silently dropped from the table. */
export function resolveStudioStudies(
  slugs: readonly string[],
  source: readonly Project[],
): readonly Project[] {
  return slugs.map((slug) => {
    const project = source.find((p) => p.slug === slug);
    if (!project)
      throw new Error(`Studio: ${slug} has no project in data/projects.ts`);
    return project;
  });
}

export const studioStudies = resolveStudioStudies(studioStudySlugs, projects);
