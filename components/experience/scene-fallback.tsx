import Link from 'next/link';
export function SceneFallback({
  slug,
  failed = false,
  onRetry,
}: {
  slug: string;
  failed?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="scene-message" role={failed ? 'alert' : 'status'}>
      <p className="eyebrow">
        {failed ? 'A MOMENT OF PAUSE' : 'SPATIAL STUDY / COMING SOON'}
      </p>
      <h2>
        {failed ? (
          <>
            Let’s try
            <br />
            <em>another view.</em>
          </>
        ) : (
          <>
            A new perspective
            <br />
            is <em>taking shape.</em>
          </>
        )}
      </h2>
      <p>
        {failed
          ? 'This experience could not be opened on your device. You can still explore the complete project.'
          : 'The 3D experience for this interior is being prepared. Explore its spaces, materials and objects in the project story.'}
      </p>
      {failed && onRetry && (
        <button className="text-link" onClick={onRetry}>
          Try again <span aria-hidden="true">↗</span>
        </button>
      )}
      <Link href={`/projects/${slug}`} className="text-link">
        Explore the project <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
