import type { Article, ImageAsset, Material } from './types';
import { materials } from './materials';
import { journal } from './journal';

/** Room 03 — Archive: which records the room keeps, and in what order. Only
 * references live here. Every title, summary, image, alt text, family,
 * category and date comes from its source (`data/materials.ts`,
 * `data/journal.ts`), which stays the canonical owner. The Archive owns the
 * curation, the accession order, the source relationship and its own
 * presentation; nothing else. */
export type ArchiveRecordRef =
  | { kind: 'material'; slug: string }
  | { kind: 'journal'; slug: string };

/** The first collection, Studio Records: timber, stone, textile, light. */
export const archiveRecordRefs = [
  { kind: 'material', slug: 'natural-oak' },
  { kind: 'material', slug: 'travertine' },
  { kind: 'material', slug: 'linen' },
  { kind: 'journal', slug: 'light-texture-and-material' },
] as const satisfies readonly ArchiveRecordRef[];

/** Why a record may be published in the Archive. Today the only basis is
 * content the project already publishes; it is not a claim of copyright
 * ownership. An external cultural record needs its own basis — a named
 * source, a stable source URL or institution reference, a credit line, and
 * rights, licence, public-domain or permission evidence for the specific
 * reproduction — before it can enter (see docs/TP3D-PASS-13-ARCHIVE.md). No
 * such record exists yet, so no such basis is modelled yet. */
export type PublicationBasis = 'existing-project-content';
export const PUBLICATION_BASIS_LABEL: Record<PublicationBasis, string> = {
  'existing-project-content': 'Existing TP3D project content',
};

export type ArchiveSource = {
  /** The source collection, named on every record. */
  collection: 'Material Library' | 'Journal';
  /** The source record's own route; the Archive points to it, never copies it. */
  href: string;
  basis: PublicationBasis;
};

/** A read-only presentation of one source record. */
export type ArchiveRecord = {
  /** Collision-safe across source kinds; also the record's fragment id. */
  key: string;
  /** TP3D presentation identifier from curation order, not an inventory number. */
  accession: string;
  kind: ArchiveRecordRef['kind'];
  slug: string;
  recordType: 'Material study' | 'Editorial record';
  title: string;
  category: string;
  summary: string;
  /** The source's longer text, for a record read at the table. */
  excerpt: string;
  image: ImageAsset;
  source: ArchiveSource;
  /** Only a date the source itself records; a material study has none. */
  date: { iso: string; label: string } | null;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
/** `2026-06-12` → `12 Jun 2026`, read from the string, never shifted by a time zone. */
export const archiveDateLabel = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
};
export const accessionNumber = (index: number) =>
  `AR–${String(index + 1).padStart(3, '0')}`;
export const archiveRecordKey = (ref: ArchiveRecordRef) =>
  `${ref.kind}-${ref.slug}`;

const fromMaterial = (m: Material) => ({
  recordType: 'Material study' as const,
  title: m.title,
  category: m.family,
  summary: m.description,
  excerpt: m.detail,
  image: m.image,
  source: {
    collection: 'Material Library' as const,
    href: `/materials/${m.slug}`,
    basis: 'existing-project-content' as const,
  },
  date: null,
});
const fromArticle = (a: Article) => ({
  recordType: 'Editorial record' as const,
  title: a.title,
  category: a.category,
  summary: a.description,
  excerpt: a.sections[0]?.body ?? a.description,
  image: a.image,
  source: {
    collection: 'Journal' as const,
    href: `/journal/${a.slug}`,
    basis: 'existing-project-content' as const,
  },
  date: { iso: a.date, label: archiveDateLabel(a.date) },
});

/** Resolves the curation against its sources, in curation order. The
 * curation is deliberate: a reference to a missing source record is an
 * error, never a silently dropped accession. */
export function resolveArchiveRecords(
  refs: readonly ArchiveRecordRef[],
  sources: {
    materials: readonly Material[];
    journal: readonly Article[];
  },
): ArchiveRecord[] {
  return refs.map((ref, index) => {
    const source =
      ref.kind === 'material'
        ? sources.materials.find(({ slug }) => slug === ref.slug)
        : sources.journal.find(({ slug }) => slug === ref.slug);
    if (!source)
      throw new Error(
        `Archive: ${archiveRecordKey(ref)} has no source record in data/${ref.kind === 'material' ? 'materials' : 'journal'}.ts`,
      );
    return {
      key: archiveRecordKey(ref),
      accession: accessionNumber(index),
      kind: ref.kind,
      slug: ref.slug,
      ...(ref.kind === 'material'
        ? fromMaterial(source as Material)
        : fromArticle(source as Article)),
    };
  });
}

export const archiveRecords = resolveArchiveRecords(archiveRecordRefs, {
  materials,
  journal,
});
