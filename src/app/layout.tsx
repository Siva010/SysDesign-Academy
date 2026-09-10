import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './components.css';
import { Sidebar } from '@/components/Sidebar';
import { lessonIndex } from '@/lib/content-node';
import { TopBar } from '@/components/TopBar';
import { ProgressProvider } from '@/lib/progress';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * Literata, the reading face. Drawn for long reading on screens, and self-hosted from files in
 * ./fonts so no reader's browser contacts a third party and no build depends on one.
 *
 * Latin only, regular and italic, weights 400-700: exactly what the text uses. The adjusted
 * fallback is a metric-matched Times New Roman, so text does not jump when Literata arrives.
 * See docs/11-reading-design.md; the licence is ./fonts/OFL.txt.
 */
const literata = localFont({
  src: [
    { path: './fonts/literata-latin.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/literata-latin-italic.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-literata',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  /* Makes every relative URL below absolute, which is what a crawler fetching a link preview
     needs - it has no page context to resolve against. */
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  /* The icon and apple-icon files next to this one are picked up automatically. This is only
     the manifest, which has no file convention that survives a static export. */
  manifest: '/site.webmanifest',
  /* Inherited by every page. Deliberately no title or description here: an explicit
     openGraph.title is inherited verbatim by every child route, so setting one gave all 400
     pages the same preview card. Left absent, each page's own title and description are used. */
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'en_GB',
    images: [
      {
        url: '/social-card.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — reason about real systems`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/social-card.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbf9' },
    { media: '(prefers-color-scheme: dark)', color: '#121316' },
  ],
};

/**
 * Applied before paint so neither the theme nor focus mode flashes. Kept deliberately tiny and
 * defensive: any storage error falls through to the system preference.
 */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('sda.theme');
    if (t === 'light' || t === 'dark' || t === 'paper') {
      document.documentElement.setAttribute('data-theme', t);
    }
    if (localStorage.getItem('sda.focus') === 'on') {
      document.documentElement.setAttribute('data-focus', 'on');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={literata.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ProgressProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <div className="shell">
            <Sidebar index={lessonIndex()} />
            <div className="shell-main">
              <TopBar />
              <main id="main" className="content">
                {children}
              </main>
            </div>
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
