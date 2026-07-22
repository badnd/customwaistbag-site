import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { resourceHub, resourcePages } from '../data/resources';

const origin = 'https://www.customwaistbag.com';

function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) return <Link key={index} href={match[2]}>{match[1]}</Link>;
    return part;
  });
}

function bodyFromMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const title = lines.find((line) => line.startsWith('# '))?.slice(2).trim() || '';
  const dividers = lines.map((line, index) => line.trim() === '---' ? index : -1).filter((index) => index >= 0);
  const introEnd = dividers[0] ?? 2;
  const intro = lines.slice(1, introEnd).find((line) => line.trim())?.replace(/^\*|\*$/g, '') || '';
  return { title, intro, lines: lines.slice((dividers[1] ?? dividers[0] ?? 1) + 1) };
}

function blocks(lines) {
  const result = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line || line === '---') { i += 1; continue; }
    if (/^#{2,3} /.test(line)) { const level = line.startsWith('### ') ? 3 : 2; result.push({ type: 'heading', level, text: line.slice(level + 1) }); i += 1; continue; }
    if (line.startsWith('|') && lines[i + 1]?.trim().match(/^\|?\s*:?-+/)) {
      const rows = [];
      const split = (value) => value.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      rows.push(split(line)); i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(split(lines[i])); i += 1; }
      result.push({ type: 'table', rows }); continue;
    }
    if (/^(?:- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line); const items = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i].trim()) : /^- /.test(lines[i].trim()))) { items.push(lines[i].trim().replace(ordered ? /^\d+\. / : /^- /, '')); i += 1; }
      result.push({ type: ordered ? 'ol' : 'ul', items }); continue;
    }
    if (line.startsWith('> ')) { result.push({ type: 'quote', text: line.slice(2) }); i += 1; continue; }
    const paragraph = [line]; i += 1;
    while (i < lines.length && lines[i].trim() && !/^(?:#{2,3} |\||- |\d+\. |> |---$)/.test(lines[i].trim())) { paragraph.push(lines[i].trim()); i += 1; }
    result.push({ type: 'p', text: paragraph.join(' ') });
  }
  return result;
}

function faqs(markdown) {
  const section = markdown.split(/\n## FAQ\s*\n/i)[1] || '';
  const matches = [...section.matchAll(/\*\*([^*]+\?)\*\*\s*\n([^\n]+)/g)];
  return matches.map((match) => ({ question: match[1].trim(), answer: match[2].trim() }));
}

function load(page, locale) {
  const file = path.join(process.cwd(), 'src/content/resources', page.files[locale]);
  const markdown = fs.readFileSync(file, 'utf8');
  return { ...bodyFromMarkdown(markdown), markdown };
}

export function ResourceHub({ locale = 'en' }) {
  const copy = resourceHub[locale];
  const prefix = locale === 'ru' ? '/ru' : '';
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: copy.title, url: `${origin}${prefix}/resources`, mainEntity: { '@type': 'ItemList', itemListElement: resourcePages.map((page, index) => ({ '@type': 'ListItem', position: index + 1, name: page.meta[locale].title, url: `${origin}${prefix}/resources/${page.slug}` })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><section className="page-hero"><div className="shell"><div className="eyebrow">{copy.badge}</div><h1>{copy.title}</h1><p className="lead">{copy.intro}</p></div></section><section className="section"><div className="shell resource-grid">{resourcePages.map((page) => <article className="resource-card" key={page.slug}><h2>{page.meta[locale].title}</h2><p>{page.meta[locale].description}</p><Link className="button" href={`${prefix}/resources/${page.slug}`}>{copy.open}</Link></article>)}</div></section></>;
}

export function ResourceArticle({ page, locale = 'en' }) {
  const content = load(page, locale);
  const prefix = locale === 'ru' ? '/ru' : '';
  const url = `${origin}${prefix}/resources/${page.slug}`;
  const faq = faqs(content.markdown);
  const schemas = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: content.title, description: page.meta[locale].description, datePublished: '2026-07-22', dateModified: '2026-07-22', author: { '@type': 'Organization', name: 'Custom Waist Bag' }, publisher: { '@type': 'Organization', name: 'Custom Waist Bag' }, mainEntityOfPage: url },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
  ];
  return <>{schemas.map((schema) => <script key={schema['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />)}<article><section className="page-hero"><div className="shell rich"><Link className="eyebrow" href={`${prefix}/resources`}>{resourceHub[locale].title}</Link><h1>{content.title}</h1><p className="lead">{content.intro}</p></div></section><section className="section"><div className="shell resource-article">{blocks(content.lines).map((block, index) => { if (block.type === 'heading') return block.level === 2 ? <h2 key={index}>{inline(block.text)}</h2> : <h3 key={index}>{inline(block.text)}</h3>; if (block.type === 'table') return <div className="resource-table-wrap" key={index}><table><thead><tr>{block.rows[0].map((cell) => <th key={cell}>{inline(cell)}</th>)}</tr></thead><tbody>{block.rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>; if (block.type === 'ul' || block.type === 'ol') { const Tag = block.type; return <Tag key={index}>{block.items.map((item) => <li key={item}>{inline(item)}</li>)}</Tag>; } if (block.type === 'quote') return <blockquote key={index}>{inline(block.text)}</blockquote>; return <p key={index}>{inline(block.text)}</p>; })}<aside className="related-resources"><h2>{locale === 'ru' ? 'Связанные материалы и товары' : 'Related resources and products'}</h2>{page.related[locale].map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</aside></div></section></article></>;
}
