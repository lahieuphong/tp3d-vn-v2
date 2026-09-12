import Link from 'next/link';
import type { Project } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
export function ProjectPreview({
  project,
  index = 0,
  compact = false,
}: {
  project: Project;
  index?: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`project-preview ${compact ? 'compact' : ''} ${index % 2 ? 'reversed' : ''}`}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="image-link"
        aria-label={`Explore ${project.title}`}
      >
        <EditorialImage
          src={project.coverImage.src}
          alt={project.coverImage.alt}
        />
      </Link>
      <div className="project-caption">
        <span className="project-number">0{index + 1}</span>
        <p className="eyebrow">
          {project.style.toUpperCase()} / {project.year}
        </p>
        <h3>
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="project-location">{project.location}, Vietnam</p>
        {!compact && (
          <p className="project-description">{project.description}</p>
        )}
        <TextLink href={`/projects/${project.slug}`}>Explore interior</TextLink>
      </div>
    </article>
  );
}
