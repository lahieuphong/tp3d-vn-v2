import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tân Phong — Interiors for living',
    template: '%s — Tân Phong',
  },
  description:
    'A considered collection of contemporary interiors, natural materials and furniture. Explore spaces shaped for everyday living.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body id="top">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
