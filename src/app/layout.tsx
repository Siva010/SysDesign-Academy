import type { Metadata, Viewport } from 'next';
import './globals.css';
import './components.css';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ProgressProvider } from '@/lib/progress';

export const metadata: Metadata = {
  title: {
    default: 'System Design Academy',
    template: '%s — System Design Academy',
  },
  description:
    'A production-grade system design curriculum: mental models, trade-offs, failure modes and interview judgment, built from primary sources.',
  /* The icon and apple-icon files next to this one are picked up automatically. This is only
     the manifest, which has no file convention that survives a static export. */
  manifest: '/site.webmanifest',
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
 * Applied before paint so the theme never flashes. Kept deliberately tiny and
 * defensive: any storage error falls through to the system preference.
 */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('sda.theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ProgressProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <div className="shell">
            <Sidebar />
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
