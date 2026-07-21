import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts } from '../../../data/blog-posts';
import { RichBlogContent } from '../../../components/RichBlogContent';

const siteUrl = 'https://www.customwaistbag.com';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return {};
  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    title: { absolute: post.metaTitle ?? post.title },
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      images: [{ url: post.hero }]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.hero]
    }
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      image: post.hero,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Organization', name: 'Custom Waist Bag' },
      publisher: { '@type': 'Organization', name: 'Custom Waist Bag' },
      mainEntityOfPage: url
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    }
  ];

  return (
    <>
      {schemas.map((schema) => (
        <script key={schema['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <article>
        <section className="page-hero article-page-hero">
          <div className="shell rich">
            <Link className="eyebrow" href="/blog">Buyer Resources</Link>
            <h1>{post.title}</h1>
            <p className="lead">{post.subtitle || post.description}</p>
            <p>{post.category} · {post.date}</p>
          </div>
        </section>
        <section className="section">
          <div className="shell article-container">
            <img className="article-hero" src={post.hero} alt={post.heroAlt || post.title} />
            <RichBlogContent post={post} />
          </div>
        </section>
      </article>
    </>
  );
}
