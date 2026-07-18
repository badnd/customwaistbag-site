import './globals.css';
import './mobile.css';
import Script from 'next/script';
import Link from 'next/link';
import { headers } from 'next/headers';

const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

export const metadata = {
  metadataBase: new URL('https://www.customwaistbag.com'),
  title: { default: 'Custom Waist Bag Manufacturer | Sampling Support', template: '%s | Custom Waist Bag' },
  description: 'Waist bag specialist for private-label buyers, with MOQ tiers from 50 pcs, 7-15 day sampling and OEM/ODM support.',
  icons: { icon: '/favicon-32.png', apple: '/favicon-192.png' },
  openGraph: { type: 'website', siteName: 'Custom Waist Bag', images: ['https://images.customwaistbag.com/assets/videos/posters/production-video-01-poster.jpg'] },
  twitter: { card: 'summary_large_image', images: ['https://images.customwaistbag.com/assets/videos/posters/production-video-01-poster.jpg'] }
};

const nav = [
  ['Capabilities', '/custom-logo'],
  ['Full Print', '/full-print'],
  ['OEM/ODM', '/oem-odm'],
  ['Factory', '/factory'],
  ['About', '/about'],
  ['FAQ', '/faq']
];

export default async function RootLayout({ children }) {
  const requestHeaders = await headers();
  const lang = (requestHeaders.get('x-pathname') || '').startsWith('/ru') ? 'ru' : 'en';
  return (
    <html lang={lang}>
      <body>
        {GA4 ? <Script id="ga4-delayed" strategy="afterInteractive">{`
          window.setTimeout(function(){
            window.dataLayer=window.dataLayer||[];
            window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
            window.gtag('js',new Date());window.gtag('config','${GA4}');
            var s=document.createElement('script');s.async=true;
            s.src='https://www.googletagmanager.com/gtag/js?id=${GA4}';document.head.appendChild(s);
          },1200);
        `}</Script> : null}
        <header className="site-header">
          <div className="shell nav-row">
            <Link className="wordmark" href="/">Custom Waist Bag</Link>
            <nav aria-label="Primary navigation">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
            <div className="nav-actions"><Link href="/ru">RU</Link><Link className="button small" href="/contact">Get a Quote</Link></div>
            <details className="mobile-menu"><summary aria-label="Open navigation">&#9776;</summary><div>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<Link href="/contact">Get a Quote</Link></div></details>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="shell footer-grid">
            <div><strong>Custom Waist Bag</strong><p>Waist bag structure, sampling and private-label production support.</p></div>
            <div><strong>Contact</strong><a href="mailto:annawei@nameerbag.com">annawei@nameerbag.com</a><a href="https://wa.me/8615102249548">WhatsApp 008615102249548</a></div>
            <div><strong>Company</strong><Link href="/about">About</Link><Link href="/factory">Factory</Link><Link href="/privacy-policy">Privacy</Link></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
