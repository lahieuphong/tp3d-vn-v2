'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="container not-found">
      <p className="eyebrow">A MOMENT OF PAUSE</p>
      <h1>Let’s try that again.</h1>
      <p>This page couldn’t be opened. Please try again.</p>
      <button className="text-link" onClick={reset}>
        Reload this page <span aria-hidden="true">↗</span>
      </button>
    </main>
  );
}
