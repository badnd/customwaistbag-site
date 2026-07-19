import Link from 'next/link';
import { productUrl, productsForCategory } from '../data/catalogData';

const origin = 'https://www.customwaistbag.com';

function text(item, locale) {
  return locale === 'ru' ? item.ru : item.en;
}

function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function ProductCard({ product, locale }) {
  const ru = locale === 'ru';
  return (
    <article className="product-card">
      <Link href={productUrl(product, locale)}>
        <img src={product.gallery[0]} alt={`${product.model} ${ru ? product.ruType : product.type}`} loading="lazy" width="1122" height="1402" />
      </Link>
      <div className="product-card-copy">
        <p className="product-model">{product.model}</p>
        <h2><Link href={productUrl(product, locale)}>{ru ? product.ruType : product.type}</Link></h2>
        <ul className="product-facts">
          <li>{ru ? 'MOQ: от 50 шт.*' : 'MOQ: from 50 pcs*'}</li>
          <li>{ru ? 'Срок: образец 7–15 дней · партия 15–30 дней' : 'Lead Time: Sample 7–15 days · Bulk 15–30 days'}</li>
          <li>{ru ? 'Логотип' : 'Logo'}: {product.logoMethods.map((item) => text(item, locale)).join(' / ')}</li>
        </ul>
        <Link className="button" href={productUrl(product, locale)}>{ru ? 'Подробнее' : 'View Product'}</Link>
      </div>
    </article>
  );
}

export function CategoryPage({ category, locale = 'en' }) {
  const ru = locale === 'ru';
  const items = productsForCategory(category);
  const path = `${ru ? '/ru' : ''}/${category.slug}`;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: ru ? category.ruTitle : category.title,
      description: ru ? category.ruDescription : category.description,
      url: `${origin}${path}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: ru ? product.ruTitle : product.title,
        url: `${origin}${productUrl(product, locale)}`,
      })),
    },
  ];
  return (
    <>
      {schemas.map((schema, index) => <JsonLd key={index} data={schema} />)}
      <section className="page-hero catalog-hero"><div className="shell"><div className="eyebrow">{ru ? 'Категория поясных сумок' : 'Waist Bag Collection'}</div><h1>{ru ? category.ruTitle : category.title}</h1><p className="lead">{ru ? category.ruDescription : category.description}</p><Link className="button secondary" href={ru ? `/${category.slug}` : `/ru/${category.slug}`}>{ru ? 'English' : 'Русский'}</Link></div></section>
      <section className="section"><div className="shell"><div className="product-card-grid">{items.map((product) => <ProductCard key={product.model} product={product} locale={locale} />)}</div><p className="moq-note">{ru ? '* Итоговый MOQ зависит от модели, материала и способа нанесения логотипа. Анна подтвердит его в предложении.' : '* Final MOQ depends on style, fabric and logo method. Anna will confirm in your quotation.'}</p></div></section>
    </>
  );
}

function InquiryPanel({ product, locale }) {
  const ru = locale === 'ru';
  const logoMethods = product.logoMethods.map((item) => text(item, locale)).join(' / ');
  const message = ru
    ? `Здравствуйте! Я пришел с сайта customwaistbag.com. Меня интересует ${product.ruTitle}. Пришлите, пожалуйста, уровни MOQ, стоимость образца и сроки.`
    : `Hi, I am contacting you from customwaistbag.com about ${product.title}. Please send MOQ tiers, sample cost and lead time.`;
  const whatsapp = `https://wa.me/8615102249548?text=${encodeURIComponent(message)}`;
  const subject = encodeURIComponent(`customwaistbag.com inquiry - ${product.model}`);
  return (
    <section className="inquiry-panel">
      <h2>{ru ? 'Запросить предложение' : 'Request a Project Quotation'}</h2>
      <div className="inquiry-lines">
        <p><strong>{ru ? 'Минимальный заказ' : 'Minimum Order Quantity'}:</strong> {ru ? 'от 50 шт.*' : 'from 50 pcs*'}</p>
        <p><strong>{ru ? 'Образец' : 'Sampling'}:</strong> 7–15 {ru ? 'дней' : 'days'} &nbsp; · &nbsp; <strong>{ru ? 'Серийное производство' : 'Bulk production'}:</strong> 15–30 {ru ? 'дней' : 'days'}</p>
        <p><strong>{ru ? 'Оплата образца' : 'Sample fee'}:</strong> {ru ? 'для 1 000+ шт. возвращается · для 500–1 000 шт. обсуждается' : '1,000+ refundable · 500–1,000 negotiable'}</p>
        <p><strong>{ru ? 'Методы нанесения логотипа' : 'Logo methods'}:</strong> {logoMethods}</p>
        <p><strong>{ru ? 'Цена' : 'Pricing'}:</strong> {ru ? 'Свяжитесь с нами для расчета — только по запросу, без фиксированного прайс-листа.' : 'Contact us for best price — inquiry only, no fixed list price.'}</p>
        <p>OEM / ODM &nbsp; / &nbsp; Private Label &nbsp; / &nbsp; Wholesale welcome.</p>
      </div>
      <p className="moq-note">{ru ? '* Итоговый MOQ зависит от модели, материала и способа нанесения логотипа. Анна подтвердит его в предложении.' : '* Final MOQ depends on style, fabric and logo method. Anna will confirm in your quotation.'}</p>
      <div className="contact-anna"><strong>{ru ? 'Связаться с Анной Вэй' : 'Contact Anna Wei'}:</strong><a href="mailto:annawei@nameerbag.com">annawei@nameerbag.com</a><a href={whatsapp} target="_blank" rel="noopener">WhatsApp: +86 151 0224 9548</a><span>WeChat: 15102249548</span></div>
      <div className="actions"><a className="button" href={whatsapp} target="_blank" rel="noopener">{ru ? 'Написать в WhatsApp' : 'WhatsApp Anna'}</a><a className="button secondary" href={`mailto:annawei@nameerbag.com?subject=${subject}`}>{ru ? 'Отправить email' : 'Email Anna'}</a></div>
    </section>
  );
}

export function ProductPage({ product, locale = 'en' }) {
  const ru = locale === 'ru';
  const url = `${origin}${productUrl(product, locale)}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ru ? product.ruTitle : product.title,
    description: ru ? product.ruIntro : product.intro,
    image: product.gallery,
    brand: { '@type': 'Brand', name: 'Custom Waist Bag' },
    sku: product.model,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: '0.00',
      availability: 'https://schema.org/InStock',
      description: ru ? 'Индивидуальный расчет по запросу.' : 'Custom quotation upon request.',
    },
  };
  return (
    <>
      <JsonLd data={schema} />
      <section className="product-intro"><div className="shell product-intro-grid"><div><div className="eyebrow">{product.model}</div><h1>{ru ? product.ruTitle : product.title}</h1><p className="product-tagline">{ru ? product.ruTagline : product.tagline}</p><p className="lead">{ru ? product.ruIntro : product.intro}</p><div className="actions"><a className="button" href="#quote">{ru ? 'Запросить расчет' : 'Request a Quote'}</a><Link className="button secondary" href={ru ? productUrl(product, 'en') : productUrl(product, 'ru')}>{ru ? 'English' : 'Русский'}</Link></div></div><img src={product.gallery[0]} alt={`${product.model} ${ru ? product.ruType : product.type} - ${text(product.subjects[0], locale)}`} width="1122" height="1402" /></div></section>
      <section className="section"><div className="shell product-copy-grid"><div><h2>{ru ? 'Характеристики' : 'Specifications'}</h2><div className="spec-table-wrap"><table className="spec-table"><tbody>{product.specs.map((item) => <tr key={item.label}><th>{ru ? item.ruLabel : item.label}</th><td>{ru ? item.ruValue : item.value}</td></tr>)}</tbody></table></div></div><div><h2>{ru ? 'Ключевые особенности' : 'Key Features'}</h2><ul className="feature-list">{product.features.map((item) => <li key={item.en}>{text(item, locale)}</li>)}</ul><h2>{ru ? 'Цвета' : 'Colors'}</h2><div className="chip-list">{product.colors.map((item) => <span key={item.en}>{text(item, locale)}</span>)}</div></div></div></section>
      <section className="section alt"><div className="shell"><div className="section-head"><div className="eyebrow">{ru ? 'Галерея продукта' : 'Product Gallery'}</div><h2>{ru ? 'Детали, размеры и варианты брендирования' : 'Details, dimensions and branding options'}</h2></div><div className="poster-gallery">{product.gallery.slice(1).map((src, index) => <figure key={src}><img src={src} alt={`${product.model} ${ru ? product.ruType : product.type} - ${text(product.subjects[index + 1], locale)}`} loading="lazy" width="1122" height="1402" /></figure>)}</div></div></section>
      <section id="quote" className="section"><div className="shell"><InquiryPanel product={product} locale={locale} /></div></section>
    </>
  );
}

