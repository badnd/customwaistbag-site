import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-hero">
      <div className="shell">
        <div className="eyebrow">Custom Waist Bag</div>
        <h1>Page Not Found</h1>
        <p className="lead">The page you requested is not available. Browse waist bag categories or contact us for help with your project.</p>
        <p className="actions"><Link className="button" href="/running-waist-bags">Browse Products</Link><Link className="button secondary" href="/contact">Contact Us</Link></p>
      </div>
    </section>
  );
}
