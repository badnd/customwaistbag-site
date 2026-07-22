import { notFound } from 'next/navigation';
import { ResourceArticle, ResourceHub } from '../../../../components/ResourcePages';
import { resourcePages } from '../../../../data/resources';

const origin = 'https://www.customwaistbag.com';

export function generateStaticParams() { return [{ slug: [] }, ...resourcePages.map((page) => ({ slug: [page.slug] }))]; }
function find(slug) { return resourcePages.find((page) => page.slug === (slug || []).join('/')); }

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const page = find(slug);
  const enPath = slug.length ? `/resources/${slug.join('/')}` : '/resources';
  const path = slug.length ? `/ru/resources/${slug.join('/')}` : '/ru/resources';
  const meta = page?.meta.ru || { title: 'Ресурсы для покупателей', description: 'Материалы по MOQ, размерам, брендингу, образцам и производству поясных сумок.' };
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `${origin}${path}`, languages: { en: `${origin}${enPath}`, ru: `${origin}${path}`, 'x-default': `${origin}${enPath}` } } };
}

export default async function RussianResourcesPage({ params }) {
  const { slug = [] } = await params;
  if (!slug.length) return <ResourceHub locale="ru" />;
  const page = find(slug);
  if (!page) notFound();
  return <ResourceArticle page={page} locale="ru" />;
}
