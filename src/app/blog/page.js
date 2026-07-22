import Link from 'next/link';
import { blogPosts } from '../../data/blog-posts';
import { blogCardImage } from '../../lib/card-images';

export const metadata = {
  title: 'Custom Waist Bag Manufacturing Guides',
  description: 'Practical sourcing guides for custom waist bags, materials, styles, branding and factory selection.',
  alternates: { canonical: '/blog' }
};

export default function BlogIndexPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Buyer Resources</p>
          <h1>Custom Waist Bag Manufacturing Guides</h1>
          <p className="lead">Clear, factory-side guidance for product teams, importers and private-label buyers.</p>
        </div>
      </section>
      <section className="section">
        <div className="shell blog-grid">
          {blogPosts.map((post, index) => (
            <article className="blog-card" key={post.slug}>
              <img src={blogCardImage(index)} alt={post.heroAlt || post.title} />
              <div className="blog-card-copy">
                <p className="eyebrow">{post.category} · {post.date}</p>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
                <Link className="button secondary" href={`/blog/${post.slug}`}>Read Guide</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

