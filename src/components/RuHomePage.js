import Link from 'next/link';
import { productCategories, productsForCategory } from '../data/catalogData';

const media = 'https://images.customwaistbag.com/assets';
const capabilities = ['Шелкография','Вышивка','Резиновая нашивка','Тканая этикетка','Частная торговая марка','Термотрансфер','Кожаная нашивка','Металлический шильд','Индивидуальный пуллер молнии','Окрашивание по Pantone'];
const featuredCategories = productCategories.map((category) => ({ ...category, representative: productsForCategory(category)[0] }));
const metrics = [['20+ лет','Производство сумок'],['3 000 м²','Швейный цех'],['50 человек','35 производство + 15 поддержка'],['200 000+','Изделий в год'],['10+ рынков','Опыт экспорта'],['От 50 шт.*','Начальный уровень MOQ']];
const faqs = [
  ['Какой у вас минимальный объем заказа?', 'Уровни MOQ начинаются от 50 шт.: 50, 100, 300, 500, 1 000 и 3 000+ шт. Итоговый MOQ зависит от модели, материала и способа нанесения логотипа.'],
  ['Сколько времени занимает изготовление образца?', 'Индивидуальный образец обычно изготавливается за 7–15 дней после подтверждения технического задания и макета.'],
  ['Каков срок серийного производства?', 'Серийное производство обычно занимает 15–30 дней после утверждения образца и деталей заказа.'],
  ['Возвращается ли стоимость образца?', 'Для заказов от 1 000 шт. стоимость образца возвращается. Для 500–1 000 шт. условия можно обсудить с Анной.'],
  ['Какие способы нанесения логотипа доступны?', 'Доступны шелкография, вышивка, резиновые нашивки, тканые этикетки, частная торговая марка, термотрансфер, кожаные нашивки и металлические шильды.'],
  ['Можно ли подобрать цвет по Pantone?', 'Окрашивание по Pantone можно обсудить для подходящих материалов и объемов заказа.']
];

const schema = [
  {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Custom Waist Bag', url: 'https://www.customwaistbag.com/ru',
    email: 'annawei@nameerbag.com', telephone: '+8615102249548',
    parentOrganization: [{ '@type': 'Organization', name: 'Tianjin Nameer International Trade Co., Ltd.' }, { '@type': 'Organization', name: 'Tianjin Junyi Premium Trading Co., Ltd.' }]
  },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) }
];

export function RuHomePage() {
  return <>
    {schema.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}
    <section className="hero">
      <video autoPlay muted loop playsInline poster={`${media}/videos/posters/production-video-01-poster.jpg`}><source src={`${media}/videos/production-video-01.mp4`} type="video/mp4" /></video>
      <div className="shell hero-inner">
        <div className="eyebrow">Специалист по поясным сумкам и образцам</div>
        <h1>Дорабатываем образец, пока поясная сумка не станет действительно удобной</h1>
        <p className="lead">Цвет, стропа, пуллер молнии и размещение логотипа рассматриваются как единое изделие, а не как отдельные пункты.</p>
        <div className="proof"><span>MOQ от 50 шт.*</span><span>Бесплатный макет логотипа</span><span>Образец за 7–15 дней</span><span>20+ лет производства сумок</span><span>Специализация на поясных сумках</span></div>
        <p className="hero-note"><small>* Итоговый MOQ зависит от модели, материала и способа нанесения логотипа. Анна подтвердит его в предложении.</small></p>
        <div className="actions"><Link className="button" href="/ru/contact">Запросить расчет</Link><Link className="button secondary" href="/ru/about">История работы над образцом</Link></div>
      </div>
    </section>
    <section className="section home-catalog"><div className="shell"><div className="section-head"><div className="eyebrow">Категории продукции</div><h2>Выберите конструкцию поясной сумки под вашу задачу</h2><p>Семь актуальных моделей распределены по способу ношения. На каждой странице доступны характеристики и расчет только по запросу.</p></div><div className="home-category-grid">{featuredCategories.map((category) => <article className="home-category-card" key={category.slug}><Link className="home-category-media" href={`/ru/${category.slug}`}><img src={category.representative.gallery[0]} alt={`${category.ruTitle}, модель ${category.representative.model}`} loading="lazy" width="1122" height="1402" /></Link><div className="home-category-copy"><p className="product-model">{category.representative.model}</p><h3><Link href={`/ru/${category.slug}`}>{category.ruTitle}</Link></h3><p>{category.ruDescription}</p><Link className="button secondary" href={`/ru/${category.slug}`}>Открыть категорию</Link></div></article>)}</div></div></section>
    <section className="section"><div className="shell"><div className="metrics">{metrics.map(([value,label]) => <div className="metric" key={value}><strong>{value}</strong><span>{label}</span></div>)}</div></div></section>
    <section className="section alt"><div className="shell"><div className="section-head"><div className="eyebrow">Индивидуальные детали</div><h2>Десять способов адаптировать поясную сумку под ваш бренд</h2><p>Эти возможности кастомизации подтверждены для нашей производственной команды.</p></div><div className="grid four">{capabilities.map((item) => <div className="card" key={item}><h3>{item}</h3><p>Проверяется с учетом вашего референса, макета и назначения до изготовления образца.</p></div>)}</div></div></section>
    <section className="section"><div className="shell story"><div><div className="eyebrow">Реальные кадры производства</div><h2>Три этапа работы</h2><p>Раскладка материала, пошив малых деталей и обработка края показаны на реальных видеозаписях цеха.</p><Link className="button" href="/ru/factory">Производственные возможности</Link></div><div className="grid three"><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/factory-video-01-poster.jpg`}><source src={`${media}/videos/factory-video-01.mp4`} /></video><div className="copy"><strong>Раскладка материала</strong></div></div><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/manufacturing-video-01-poster.jpg`}><source src={`${media}/videos/manufacturing-video-01.mp4`} /></video><div className="copy"><strong>Пошив малых деталей</strong></div></div><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/production-video-01-poster.jpg`}><source src={`${media}/videos/production-video-01.mp4`} /></video><div className="copy"><strong>Обработка края поясной сумки</strong></div></div></div></div></section>
    <section className="section alt"><div className="shell story"><img src={`${media}/images/customization/pantone-color-guide.webp`} alt="Веер Pantone для согласования цвета поясной сумки" /><div><div className="eyebrow">Бесплатный макет логотипа</div><h2>Проверьте размещение до оформления заказа</h2><p>Отправьте логотип и выбранную модель. Анна подготовит визуальный макет для согласования до оформления заказа.</p><p>Экспортируем покупателям в США, Россию, Великобританию, Канаду, Мексику, Перу, Японию, Сингапур, Малайзию, Бангладеш и Джибути.</p><Link className="button" href="/ru/contact">Отправить техническое задание</Link></div></div></section>
    <section className="section"><div className="shell"><div className="section-head"><div className="eyebrow">Вопросы покупателей</div><h2>Данные, на которые можно опираться при планировании</h2></div><div className="faq">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
  </>;
}
