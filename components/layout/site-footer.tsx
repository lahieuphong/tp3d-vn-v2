import Link from 'next/link';
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="wordmark" href="/">
            tân phong
          </Link>
          <p>
            Considered spaces.
            <br />
            Objects with a sense of place.
          </p>
          <Link className="text-link" href="/contact">
            Start a conversation <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="footer-links">
          <div>
            <p className="eyebrow">EXPLORE</p>
            {['Spaces', 'Projects', 'Collections', 'Products', 'Materials'].map(
              (x) => (
                <Link href={`/${x.toLowerCase()}`} key={x}>
                  {x}
                </Link>
              ),
            )}
          </div>
          <div>
            <p className="eyebrow">STUDIO</p>
            {['Journal', 'About', 'Contact'].map((x) => (
              <Link href={`/${x.toLowerCase()}`} key={x}>
                {x}
              </Link>
            ))}
          </div>
          <div>
            <p className="eyebrow">FOLLOW</p>
            <Link href="/contact#follow">Instagram ↗</Link>
            <Link href="/contact#follow">Pinterest ↗</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Tân Phong</span>
        <span>An independent collection of interior studies.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
