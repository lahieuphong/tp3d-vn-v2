export function ChapterColophon({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`hc-colophon${dark ? ' hc-colophon-dark' : ''}`}
      aria-hidden="true"
    >
      <span>tân phong</span>
      <i />
      <small>A CONTINUING BREEZE</small>
      <i />
      <small>EST. 2026</small>
    </div>
  );
}
