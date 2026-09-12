'use client';
import Link from 'next/link';
import type { Project } from '@/data/types';
export function ExperienceUI({ project }: { project: Project }) {
  return (
    <div className="experience-ui">
      <Link href={`/projects/${project.slug}`} className="experience-back">
        ← Back to project
      </Link>
      <div>
        <p>{project.title}</p>
        <span>
          {project.location} · {project.style}
        </span>
      </div>
      <span className="viewer-state">INTERIOR PREVIEW</span>
    </div>
  );
}
