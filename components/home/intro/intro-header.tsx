import { Menu, Search } from 'lucide-react';
import { mainNavigation } from '@/data/navigation';

/** A visual prelude, not a second interactive navigation. The real SiteHeader
 * remains inert beneath the gate and takes over at the end of the reveal. */
export function IntroHeader() {
  return (
    <div className="hi-header" aria-hidden="true" inert>
      <div className="hi-wordmark">
        tân phong<span>INTERIORS &amp; OBJECTS</span>
      </div>
      <div className="hi-navigation">
        {mainNavigation.map(({ title, href }) => (
          <span key={href}>{title}</span>
        ))}
      </div>
      <div className="hi-utilities">
        <Search className="hi-search" size={21} strokeWidth={1.2} />
        <span className="hi-header-rule" />
        <span className="hi-edition">EST. 2026</span>
        <Menu className="hi-menu" size={23} strokeWidth={1.2} />
      </div>
    </div>
  );
}
