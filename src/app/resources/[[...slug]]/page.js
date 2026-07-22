import { notFound } from 'next/navigation';
import { ResourceArticle, ResourceHub } from '../../../components/ResourcePages';
import { resourcePages } from '../../../data/resources';

const origin = 'https://www.customwaistbag.com';

export function generateStaticParams() { return [{ slug: [] }, ...resourcePages.map((page) => ({ slug: [page.slug] }))]; }

function find(slug) { return resourcePages.find((page) => page.slug === (slug || []).join('/')); }

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const page = find(slug);
  const path = slug.length ? `/resources/${slug.join('/')}` : '/resources';
  const ruPath = slug.length ? `/ru/resources/${slug.join('/')}` : '/ru/resources';
  const meta = page?.meta.en || { title: 'Buyer Resources', description: 'Planning tools for custom waist bag MOQ, sizing, customization, sampling and production.' };
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `${origin}${path}`, languages: { en: `${origin}${path}`, ru: `${origin}${ruPath}`, 'x-default': `${origin}${path}` } } };
}

export default async function ResourcesPage({ params }) {
  const { slug = [] } = await params;
  if (!slug.length) return <ResourceHub locale="en" />;
  const page = find(slug);
  if (!page) notFound();
  return <ResourceArticle page={page} locale="en" />;
}
