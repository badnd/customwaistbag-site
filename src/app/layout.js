import './globals.css';
import './catalog.css';
import './mobile.css';
import Script from 'next/script';
import Link from 'next/link';
import { headers } from 'next/headers';
import { FloatingContactBall } from '../components/FloatingContactBall';
import { SiteNavigation } from '../components/SiteNavigation';

const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

export const metadata = {
  metadataBase: new URL('https://www.customwaistbag.com'),
  title: { default: 'Custom Waist Bag Manufacturer | Sampling Support', template: '%s | Custom Waist Bag' },
  description: 'Waist bag specialist for private-label buyers, with MOQ tiers from 50 pcs, 7-15 day sampling and OEM/ODM support.',
  icons: { icon: '/favicon-32.png', apple: '/favicon-192.png' },
  openGraph: { type: 'website', siteName: 'Custom Waist Bag', images: ['https://images.customwaistbag.com/assets/videos/posters/production-video-01-poster.jpg'] },
  twitter: { card: 'summary_large_image', images: ['https://images.customwaistbag.com/assets/videos/posters/production-video-01-poster.jpg'] },
  verification: {
    google: 'xAyodnH7oiV2NT_wQ7lDveoeLXTRAjffxoK5bzwXEJg',
    other: {
      'msvalidate.01': 'AD12B57AA450C181C4A8D6F90403CA06',
      'yandex-verification': 'a672f5d50f10147b'
    }
  }
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
  const pathname = requestHeaders.get('x-pathname') || '';
  const lang = pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'en';
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
        <header className="site-header"><SiteNavigation locale={lang} /></header>
        <main>{children}</main>
        <footer>
          <div className="shell footer-grid">
            <div><strong>Custom Waist Bag</strong><p>{lang === 'ru' ? 'Конструкция поясных сумок, разработка образцов и поддержка производства под частной торговой маркой.' : 'Waist bag structure, sampling and private-label production support.'}</p></div>
            <div><strong>Contact</strong><a href="mailto:annawei@nameerbag.com">annawei@nameerbag.com</a><a href="https://wa.me/8615102249548">WhatsApp 008615102249548</a></div>
            <div><strong>{lang === 'ru' ? 'Компания' : 'Company'}</strong><Link href={lang === 'ru' ? '/ru/about' : '/about'}>{lang === 'ru' ? 'О нас' : 'About'}</Link><Link href={lang === 'ru' ? '/ru/factory' : '/factory'}>{lang === 'ru' ? 'Производство' : 'Factory'}</Link><Link href={lang === 'ru' ? '/ru/privacy-policy' : '/privacy-policy'}>{lang === 'ru' ? 'Конфиденциальность' : 'Privacy'}</Link></div>
          </div>
        </footer>
        <FloatingContactBall siteName="customwaistbag.com" />
      </body>
    </html>
  );
}
