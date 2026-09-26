'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { Search, Menu } from 'lucide-react';
import { mainNavigation, mobileNavigation } from '@/data/navigation';
import './navigation.css';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<
    { title: string; category: string; href: string }[]
  >([]);
  useEffect(() => {
    let previous: boolean | null = null;
    const update = () => {
      const next = window.scrollY > 48;
      if (next !== previous) {
        previous = next;
        setScrolled(next);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (search)
      void import('@/data/search')
        .then((m) => setEntries(m.searchEntries))
        .catch(() =>
          setEntries(
            mainNavigation.map(({ title, href }) => ({
              title,
              category: 'Explore',
              href,
            })),
          ),
        );
  }, [search]);
  const close = () => {
    setMenu(false);
    setSearch(false);
  };
  const followSectionLink = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    close();
    // Closing the dialog detaches its link. Navigate explicitly so its fragment survives.
    window.location.assign(href);
  };
  const results = query.trim()
    ? entries.filter((i) =>
        `${i.title} ${i.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : entries.slice(0, 5);
  return (
    <header
      className={`site-header ${pathname === '/' ? 'spatial-home ' : ''}${pathname === '/' && !scrolled ? 'over-hero' : 'solid'}`}
    >
      <Link
        className="wordmark"
        href="/"
        prefetch={
          pathname === '/' || pathname === '/worlds' ? false : undefined
        }
        aria-label="Tân Phong home"
        onClick={close}
      >
        tân phong<span>INTERIORS & OBJECTS</span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {mainNavigation.map(({ title, href, shortTitle }) => (
          <Link
            key={href}
            href={href}
            prefetch={
              pathname === '/' || href === '/worlds' || pathname === '/worlds'
                ? false
                : undefined
            }
            aria-label={shortTitle ? title : undefined}
            aria-current={
              pathname === href || pathname.startsWith(`${href}/`)
                ? 'page'
                : undefined
            }
          >
            {shortTitle ? (
              <>
                <span className="nav-label-full">{title}</span>
                <span className="nav-label-short" aria-hidden="true">
                  {shortTitle}
                </span>
              </>
            ) : (
              title
            )}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Dialog open={search} onOpenChange={setSearch}>
          <DialogTrigger
            id="site-search-trigger"
            className="icon-button"
            aria-label="Search the collection"
          >
            <Search size={19} strokeWidth={1.3} />
          </DialogTrigger>
          <DialogContent className="search-dialog">
            <DialogTitle className="search-title">
              Find your inspiration.
            </DialogTitle>
            <DialogDescription>
              Search spaces, projects, worlds, materials and objects.
            </DialogDescription>
            <label className="sr-only" htmlFor="site-search">
              Search the collection
            </label>
            <input
              id="site-search"
              autoComplete="off"
              placeholder="Search the collection…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <div className="search-results" aria-live="polite">
              {entries.length === 0 ? (
                <p>Loading the collection…</p>
              ) : results.length ? (
                results.slice(0, 12).map((item) => {
                  // Native anchors preserve the section fragment for gallery results.
                  const ResultLink = item.href.includes('#') ? 'a' : Link;
                  return (
                    <ResultLink
                      key={item.href}
                      href={item.href}
                      onClick={
                        item.href.includes('#')
                          ? (event) => followSectionLink(event, item.href)
                          : close
                      }
                    >
                      <span>{item.title}</span>
                      <small>{item.category} ↗</small>
                    </ResultLink>
                  );
                })
              ) : (
                <p>No results for “{query}”. Try living, walnut or linen.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <span className="header-separator" />
        <span className="edition">EST. 2026</span>
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetTrigger
            id="site-menu-trigger"
            className="icon-button mobile-menu"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.2} />
          </SheetTrigger>
          <SheetContent className="mobile-sheet">
            <SheetTitle className="wordmark">tân phong</SheetTitle>
            <SheetDescription>Interiors, considered.</SheetDescription>
            <nav aria-label="Mobile navigation">
              {mobileNavigation.map(({ title, href }, i) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={
                    pathname === '/' ||
                    href === '/worlds' ||
                    pathname === '/worlds'
                      ? false
                      : undefined
                  }
                  aria-current={pathname === href ? 'page' : undefined}
                  onClick={close}
                >
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
