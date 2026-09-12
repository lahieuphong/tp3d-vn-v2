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
        {failed ? 'A MOMENT OF PAUSE' : '3D EXPERIENCE'}
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
            This spatial experience
            <br />
            is <em>being prepared.</em>
          </>
        )}
      </h2>
      <p>
        {failed
          ? 'This experience could not be opened on your device. You can still explore the complete project.'
          : 'The interior will soon be available to explore in real time.'}
      </p>
      {failed && onRetry && (
        <button className="text-link" onClick={onRetry}>
          Try again <span aria-hidden="true">↗</span>
        </button>
      )}
      <Link href={`/projects/${slug}`} className="text-link">
        Return to project <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
