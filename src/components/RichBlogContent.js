import Link from 'next/link';

function renderLinkedText(text, links = []) {
  if (!links.length) return text;
  const terms = links.map(({ text: label }) => label).sort((a, b) => b.length - a.length);
  const pattern = new RegExp('(' + terms.map((term) => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')', 'gi');
  const lookup = new Map(links.map((link) => [link.text.toLowerCase(), link.href]));

  return text.split(pattern).map((part, index) => {
    const href = lookup.get(part.toLowerCase());
    return href ? <Link key={part + '-' + index} href={href}>{part}</Link> : part;
  });
}

function renderInline(text, links) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{renderLinkedText(part.slice(2, -2), links)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{renderLinkedText(part.slice(1, -1), links)}</em>;
    }
    return <span key={index}>{renderLinkedText(part, links)}</span>;
  });
}

export function RichBlogContent({ post, contactHref = '/contact' }) {
  return (
    <>
      <div className="article-content">
        {post.blocks.map((block, index) => {
          if (block.type === 'heading') {
            return <h2 key={'heading-' + index}>{renderInline(block.text, post.links)}</h2>;
          }
          if (block.type === 'list') {
            return <ul key={'list-' + index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, post.links)}</li>)}</ul>;
          }
          return <p key={'paragraph-' + index}>{renderInline(block.text, post.links)}</p>;
        })}
        <section className="article-faq">
          <h2>Frequently Asked Questions</h2>
          {post.faq.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{renderInline(item.answer, post.links)}</p>
            </div>
          ))}
        </section>
      </div>
      <div className="cta-banner article-cta">
        <p><em>{renderInline(post.cta, post.links)}</em></p>
        <Link className="btn btn-light button" href={contactHref}>Contact Us</Link>
      </div>
    </>
  );
}
