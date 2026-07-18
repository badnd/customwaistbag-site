import Link from 'next/link';

const media = 'https://images.customwaistbag.com/assets';
const faqs = [
  ['What is your minimum order quantity?', 'MOQ tiers start from 50 pcs. Available tiers are 50, 100, 300, 500, 1,000 and 3,000+ pcs. Final MOQ depends on style, fabric and logo method.'],
  ['How long does sampling take?', 'A custom sample normally takes 7-15 days after the specification and artwork are confirmed.'],
  ['How long does bulk production take?', 'Bulk production normally takes 15-30 days after the sample and order details are approved.'],
  ['Can the sample fee be refunded?', 'For orders of 1,000+ pcs, the sample fee is refundable. For 500-1,000 pcs, the refund can be discussed with Anna.'],
  ['Which logo methods can you support?', 'Available methods include screen printing, embroidery, rubber patches, woven labels, private labels, heat transfer, leather patches and metal badges.'],
  ['Can you match a Pantone colour?', 'Pantone-based custom dyeing can be discussed for suitable materials and order quantities.']
];

const schema = [
  {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Custom Waist Bag', url: 'https://www.customwaistbag.com/',
    email: 'annawei@nameerbag.com', telephone: '+8615102249548',
    parentOrganization: [{ '@type': 'Organization', name: 'Tianjin Nameer International Trade Co., Ltd.' }, { '@type': 'Organization', name: 'Tianjin Junyi Premium Trading Co., Ltd.' }]
  },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) }
];

const capabilities = ['Screen printing','Embroidery','Rubber patch','Woven label','Private label','Heat transfer','Leather patch','Metal badge','Custom zipper pull','Pantone custom dyeing'];
const metrics = [['20+ Years','Bag manufacturing'],['3,000 sqm','Sewing workshop'],['50 People','35 production + 15 support'],['200,000+','Units produced annually'],['10+ Markets','Export experience'],['50 pcs','MOQ entry tier']];

export default function HomePage() {
  return <>
    {schema.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}
    <section className="hero">
      <video autoPlay muted loop playsInline poster={`${media}/videos/posters/production-video-01-poster.jpg`}><source src={`${media}/videos/production-video-01.mp4`} type="video/mp4" /></video>
      <div className="shell hero-inner">
        <div className="eyebrow">Waist bag specialist and sampling partner</div>
        <h1>We Keep Refining the Sample Until the Waist Bag Feels Right</h1>
        <p className="lead">Colour, webbing, zipper pull and logo placement are reviewed as one product, not separate checkboxes.</p>
        <div className="actions"><Link className="button" href="/contact">Request a Quote</Link><Link className="button secondary" href="/about">Read Our Sampling Story</Link></div>
        <div className="proof"><span>MOQ from 50 pcs*</span><span>Free Logo Mockup</span><span>Samples in 7-15 Days</span><span>20+ Years Making Bags</span><span>Waist Bags Only - All We Do</span></div>
        <p><small>* Final MOQ depends on style, fabric and logo method. Anna will confirm in your quotation.</small></p>
      </div>
    </section>
    <section className="section"><div className="shell"><div className="metrics">{metrics.map(([a,b]) => <div className="metric" key={a}><strong>{a}</strong><span>{b}</span></div>)}</div></div></section>
    <section className="section alt"><div className="shell"><div className="section-head"><div className="eyebrow">Custom details</div><h2>One waist bag, ten ways to make it yours</h2><p>These are the customization capabilities confirmed for this production team.</p></div><div className="grid four">{capabilities.map(x => <div className="card" key={x}><h3>{x}</h3><p>Reviewed against your reference, artwork and target use before sampling.</p></div>)}</div></div></section>
    <section className="section"><div className="shell story"><div><div className="eyebrow">Real production footage</div><h2>Three views of the work</h2><p>Material laying, small-panel sewing and edge stitching show the actual steps available in the approved workshop footage.</p><Link className="button" href="/factory">See Factory Capability</Link></div><div className="grid three"><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/factory-video-01-poster.jpg`}><source src={`${media}/videos/factory-video-01.mp4`} /></video><div className="copy"><strong>Material laying</strong></div></div><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/manufacturing-video-01-poster.jpg`}><source src={`${media}/videos/manufacturing-video-01.mp4`} /></video><div className="copy"><strong>Small-panel sewing</strong></div></div><div className="card media-card"><video controls preload="metadata" poster={`${media}/videos/posters/production-video-01-poster.jpg`}><source src={`${media}/videos/production-video-01.mp4`} /></video><div className="copy"><strong>Waist bag edge stitching</strong></div></div></div></div></section>
    <section className="section alt"><div className="shell story"><img src={`${media}/images/customization/pantone-color-guide.webp`} alt="Pantone colour guide used to discuss custom waist bag colours" /><div><div className="eyebrow">Free logo mockup</div><h2>Review placement before you commit</h2><p>Send your logo and target style. Anna will prepare a visual mockup for review before you commit to an order.</p><p>Exporting to buyers in USA, Russia, UK, Canada, Mexico, Peru, Japan, Singapore, Malaysia, Bangladesh and Djibouti.</p><Link className="button" href="/contact">Send Your Brief</Link></div></div></section>
    <section className="section"><div className="shell"><div className="section-head"><div className="eyebrow">Buyer questions</div><h2>Numbers you can plan around</h2></div><div className="faq">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
  </>;
}
