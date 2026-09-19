export function LoadMore({
  shown,
  total,
  onLoad,
}: {
  shown: number;
  total: number;
  onLoad: () => void;
}) {
  if (!total) return null;
  return (
    <div className="worlds-load-more">
      {shown < total ? (
        <button
          className="text-link"
          type="button"
          onClick={onLoad}
          aria-controls="worlds-results"
        >
          LOAD MORE <span aria-hidden="true">↓</span>
        </button>
      ) : (
        <p className="eyebrow">THE COLLECTION, FOR NOW.</p>
      )}
      <p className="worlds-pagination-count">
        {shown} / {total}
      </p>
    </div>
  );
}
