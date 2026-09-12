import type { ReactNode } from 'react';
import type { Project } from '@/data/types';
import { SectionHeading } from '@/components/shared/section-heading';
import { ProjectPreview } from './project-preview';

/** Content and heading share one guard, so unresolved relationships cannot leave empty sections. */
export function ProjectSelection({
  projects,
  eyebrow,
  title,
  href,
  link,
  editorial = false,
  className = '',
  children,
}: {
  projects: Project[];
  eyebrow: string;
  title: string;
  href?: string;
  link?: string;
  editorial?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  if (!projects.length) return null;
  const useEditorialLayout = editorial || projects.length === 1;
  return (
    <section className={`container section ${className}`} data-project-context>
      <SectionHeading eyebrow={eyebrow} title={title} href={href} link={link} />
      <div
        className={useEditorialLayout ? 'listing-projects' : 'related-projects'}
      >
        {projects.map((project, index) => (
          <ProjectPreview
            project={project}
            index={index}
            compact={!useEditorialLayout}
            key={project.slug}
          />
        ))}
      </div>
      {children}
    </section>
  );
}
