import type { World } from '@/data/types';

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="world-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function WorldDetailInfo({ world }: { world: World }) {
  const hasInformation = Boolean(
    world.formats?.length ||
      world.software?.length ||
      world.textures ||
      world.polygonCount ||
      world.fileSize ||
      world.realWorldScale !== undefined,
  );

  return (
    <aside className="world-detail-info" aria-labelledby="world-detail-title">
      <p className="world-detail-kind eyebrow">
        {world.category} / {world.type}
      </p>
      <h1 id="world-detail-title">{world.title}</h1>
      <p className="world-detail-description">{world.description}</p>
      <p className="world-detail-year eyebrow">CURATED / {world.year}</p>

      {hasInformation && (
        <section className="world-model-information" aria-labelledby="world-model-information-title">
          <p className="eyebrow" id="world-model-information-title">
            MODEL INFORMATION
          </p>
          <dl>
            <DetailRow label="FORMAT" value={world.formats?.join(' / ')} />
            <DetailRow label="TEXTURES" value={world.textures} />
            <DetailRow label="SOFTWARE" value={world.software?.join(' / ')} />
            <DetailRow label="POLYGONS" value={world.polygonCount} />
            <DetailRow label="FILE SIZE" value={world.fileSize} />
            <DetailRow
              label="REAL SCALE"
              value={world.realWorldScale === undefined ? undefined : world.realWorldScale ? 'Yes' : 'No'}
            />
          </dl>
        </section>
      )}

      <div className="world-detail-actions">
        {world.purchaseUrl && (
          <a href={world.purchaseUrl} target="_blank" rel="noopener noreferrer" className="world-detail-cta">
            GET THIS MODEL <span aria-hidden="true">↗</span>
          </a>
        )}
        {world.available && (
          <a href={world.externalUrl} target="_blank" rel="noopener noreferrer" className="world-detail-cta">
            VIEW ON SKETCHFAB <span aria-hidden="true">↗</span>
          </a>
        )}
        <p>External viewing, licensing and downloads are handled by the linked platform.</p>
      </div>
    </aside>
  );
}
