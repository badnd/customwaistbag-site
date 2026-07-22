'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const productLinks = [
  ['Running & Slim', 'Беговые и тонкие', '/running-waist-bags'],
  ['Everyday', 'Повседневные', '/everyday-waist-bags'],
  ['Crossbody & Anti-Theft', 'Кросс-боди и антикража', '/crossbody-waist-bags'],
];

const navLinks = [
  ['Home', 'Главная', '/'],
  ['Capabilities', 'Нанесение логотипа', '/custom-logo'],
  ['Full Print', 'Полная запечатка', '/full-print'],
  ['OEM/ODM', 'OEM/ODM', '/oem-odm'],
  ['Factory', 'Производство', '/factory'],
  ['About', 'О нас', '/about'],
  ['Resources', 'Ресурсы', '/resources'],
  ['FAQ', 'Вопросы', '/faq'],
];

function localized(path, locale) {
  if (locale !== 'ru') return path;
  return path === '/' ? '/ru' : `/ru${path}`;
}

export function SiteNavigation({ locale = 'en' }) {
  const pathname = usePathname() || '/';
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
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const englishPath = normalizedPath === '/ru' ? '/' : normalizedPath.startsWith('/ru/') ? normalizedPath.slice(3) : normalizedPath;
  const isEnglishOnlyBlog = englishPath === '/blog' || englishPath.startsWith('/blog/');
  const russianPath = isEnglishOnlyBlog ? '/ru' : normalizedPath === '/' ? '/ru' : normalizedPath === '/ru' || normalizedPath.startsWith('/ru/') ? normalizedPath : `/ru${normalizedPath}`;

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
        <Link href={localized('/', locale)}>{locale === 'ru' ? 'Главная' : 'Home'}</Link>
        <div className={`product-nav${productsOpen ? ' open' : ''}`} onMouseEnter={cancelClose} onMouseLeave={delayClose}>
          <button ref={triggerRef} type="button" aria-haspopup="true" aria-expanded={productsOpen} onClick={() => setProductsOpen((open) => !open)}>{locale === 'ru' ? 'Продукция' : 'Products'}</button>
          <div className="product-nav-menu">{productLinks.map(([en, ru, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setProductsOpen(false)}>{locale === 'ru' ? ru : en}</Link>)}</div>
        </div>
        {navLinks.slice(1).map(([en, ru, href]) => <Link key={href} href={localized(href, locale)}>{locale === 'ru' ? ru : en}</Link>)}
      </nav>
      <div className="nav-actions"><div className="language-switcher" aria-label="Language switcher"><Link className={locale === 'en' ? 'active' : ''} href={englishPath}>EN</Link><span aria-hidden="true">|</span><Link className={locale === 'ru' ? 'active' : ''} href={russianPath}>RU</Link></div><Link className="button small" href={localized('/contact', locale)}>{locale === 'ru' ? 'Запросить цену' : 'Get a Quote'}</Link></div>
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button type="button" className="mobile-menu-trigger" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? '×' : '☰'}</button>
        <div className="mobile-menu-panel">
          {navLinks.map(([en, ru, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setMobileOpen(false)}>{locale === 'ru' ? ru : en}</Link>)}
          <span className="mobile-menu-label">{locale === 'ru' ? 'Продукция' : 'Products'}</span>
          {productLinks.map(([en, ru, href]) => <Link key={href} href={localized(href, locale)} onClick={() => setMobileOpen(false)}>{locale === 'ru' ? ru : en}</Link>)}
          <Link href={localized('/contact', locale)} onClick={() => setMobileOpen(false)}>{locale === 'ru' ? 'Запросить цену' : 'Get a Quote'}</Link>
        </div>
      </div>
    </div>
  );
}
