import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { EditorialChrome } from '@/components/layout/editorial-chrome';
import './globals.css';
import '@/components/home/intro/home-intro.css';
import {
  HOME_INTRO_BOOTSTRAP,
  HOME_INTRO_CRITICAL_CSS,
} from '@/components/home/intro/intro-runtime';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          data-home-intro-critical
          dangerouslySetInnerHTML={{ __html: HOME_INTRO_CRITICAL_CSS }}
        />
        <script dangerouslySetInnerHTML={{ __html: HOME_INTRO_BOOTSTRAP }} />
      </head>
      <body id="top">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <EditorialChrome>
          <SiteHeader />
        </EditorialChrome>
        {children}
        <EditorialChrome>
          <SiteFooter />
        </EditorialChrome>
      </body>
    </html>
  );
}
