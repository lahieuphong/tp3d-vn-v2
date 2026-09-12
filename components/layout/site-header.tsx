'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Menu } from 'lucide-react';
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
const navigation = ['Spaces', 'Projects', 'Collections', 'Journal', 'About'];
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
    const update = () => setScrolled(window.scrollY > 48);
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
            navigation.map((title) => ({
              title,
              category: 'Explore',
              href: `/${title.toLowerCase()}`,
            })),
          ),
        );
  }, [search]);
  const close = () => {
    setMenu(false);
    setSearch(false);
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
      className={`site-header ${pathname === '/' && !scrolled ? 'over-hero' : 'solid'}`}
    >
      <Link
        className="wordmark"
        href="/"
        aria-label="Tân Phong home"
        onClick={close}
      >
        tân phong<span>INTERIORS & OBJECTS</span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {navigation.map((label) => (
          <Link
            key={label}
            href={`/${label.toLowerCase()}`}
            aria-current={
              pathname.startsWith(`/${label.toLowerCase()}`)
                ? 'page'
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Dialog open={search} onOpenChange={setSearch}>
          <DialogTrigger
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
              Search spaces, projects, materials and objects.
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
                results.slice(0, 12).map((item) => (
                  <Link key={item.href} href={item.href} onClick={close}>
                    <span>{item.title}</span>
                    <small>{item.category} ↗</small>
                  </Link>
                ))
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
            className="icon-button mobile-menu"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.2} />
          </SheetTrigger>
          <SheetContent className="mobile-sheet">
            <SheetTitle className="wordmark">tân phong</SheetTitle>
            <SheetDescription>Interiors, considered.</SheetDescription>
            <nav aria-label="Mobile navigation">
              {[...navigation, 'Products', 'Materials', 'Contact'].map(
                (label, i) => (
                  <Link
                    key={label}
                    href={`/${label.toLowerCase()}`}
                    onClick={close}
                  >
                    <small>0{i + 1}</small>
                    {label}
                  </Link>
                ),
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
