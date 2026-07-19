'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const productLinks = [
  ['Running & Slim', '/running-waist-bags'],
  ['Everyday', '/everyday-waist-bags'],
  ['Crossbody & Anti-Theft', '/crossbody-waist-bags'],
];

const navLinks = [
  ['Home', '/'],
  ['Capabilities', '/custom-logo'],
  ['Full Print', '/full-print'],
  ['OEM/ODM', '/oem-odm'],
  ['Factory', '/factory'],
  ['About', '/about'],
  ['FAQ', '/faq'],
];

function localized(path, locale) {
  if (locale !== 'ru') return path;
  return path === '/' ? '/ru' : `/ru${path}`;
}

export function SiteNavigation({ locale = 'en' }) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const delayClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setProductsOpen(false), 180);
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setProductsOpen(false);
        setMobileOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      const hadProducts = productsOpen;
      setProductsOpen(false);
      setMobileOpen(false);
      if (hadProducts) triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelClose();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [productsOpen]);

  return (
    <div className="shell nav-row" ref={rootRef}>
      <Link className="wordmark" href={localized('/', locale)}>Custom Waist Bag</Link>
      <nav aria-label="Primary navigation">
        <Link href={localized('/', locale)}>Home</Link>
        <div className={`product-nav${productsOpen ? ' open' : ''}`} onMouseEnter={cancelClose} onMouseLeave={delayClose}>
          <button ref={triggerRef} type="button" aria-haspopup="true" aria-expanded={productsOpen} onClick={() => setProductsOpen((open) => !open)}>Products</button>
          <div className="product-nav-menu">{productLinks.map(([label, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setProductsOpen(false)}>{label}</Link>)}</div>
        </div>
        {navLinks.slice(1).map(([label, href]) => <Link key={href} href={localized(href, locale)}>{label}</Link>)}
      </nav>
      <div className="nav-actions"><Link href={locale === 'ru' ? '/' : '/ru'}>{locale === 'ru' ? 'EN' : 'RU'}</Link><Link className="button small" href={localized('/contact', locale)}>{locale === 'ru' ? 'Запросить цену' : 'Get a Quote'}</Link></div>
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button type="button" className="mobile-menu-trigger" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? '×' : '☰'}</button>
        <div className="mobile-menu-panel">
          {navLinks.map(([label, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setMobileOpen(false)}>{label}</Link>)}
          <span className="mobile-menu-label">Products</span>
          {productLinks.map(([label, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setMobileOpen(false)}>{label}</Link>)}
          <Link href={localized('/contact', locale)} onClick={() => setMobileOpen(false)}>{locale === 'ru' ? 'Запросить цену' : 'Get a Quote'}</Link>
        </div>
      </div>
    </div>
  );
}
