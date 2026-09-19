type NavigationItem = { title: string; href: string; shortTitle?: string };

export const mainNavigation: NavigationItem[] = [
  { title: 'Spaces', href: '/spaces' },
  { title: 'Projects', href: '/projects' },
  { title: 'Collections', href: '/collections' },
  { title: '3D Worlds', shortTitle: 'Worlds', href: '/worlds' },
  { title: 'Journal', href: '/journal' },
  { title: 'About', href: '/about' },
];
const catalogNavigation: NavigationItem[] = [
  { title: 'Products', href: '/products' },
  { title: 'Materials', href: '/materials' },
];
export const mobileNavigation = [
  ...mainNavigation,
  ...catalogNavigation,
  { title: 'Contact', href: '/contact' },
];
export const exploreNavigation = [
  ...mainNavigation.filter(
    ({ href }) => !['/journal', '/about'].includes(href),
  ),
  ...catalogNavigation,
];
