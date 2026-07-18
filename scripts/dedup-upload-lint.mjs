import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const findings = [];
const forbidden = [
  [/images\.(?:nameerbag|junyibags|custombackpackfactory)\.com/i, 'CROSS_SITE_MEDIA'],
  [/nameer-logo|factory-exterior\.webp|customer-testimonials\.webp|custom-logo-methods\.webp|custom-bags-full-print\.webp|why-choose-us\.webp|faq-guide\.webp/i, 'REJECTED_MEDIA'],
  [/\b(?:BSCI|GRS|ISO|FSC|SGS|BRC|TUV|TÜV)\b|Alibaba Verified/i, 'UNAUTHORIZED_CERTIFICATION'],
  [/\$\s*\d|\bUSD\s*\d/i, 'PUBLIC_PRICE'],
  [/\bMOQ.{0,30}\d+\s*(?:-|to)\s*\d+\s*(?:pcs|pieces)/i, 'MOQ_RANGE'],
  [/Product slots are ready|supplied customer-feedback image|does not pretend that a message was sent/i, 'INTERNAL_META_COPY']
];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.next','.git'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(/\.(?:js|jsx|mjs|json|css|html|md)$/i.test(entry.name)){
      const text=fs.readFileSync(full,'utf8');
      for(const [pattern,id] of forbidden)if(pattern.test(text))findings.push(`${id}: ${path.relative(root,full)}`);
    }
  }
}

walk(path.join(root,'src'));
if(process.argv.includes('--self-test')){
  const fixture='MOQ 50-100 pcs $19.99 BSCI images.nameerbag.com';
  const caught=forbidden.filter(([pattern])=>pattern.test(fixture)).length;
  if(caught<4){console.error('Guard self-test failed');process.exit(1);}
  console.log(`Guard self-test passed (${caught} injected violations detected).`);
}
if(findings.length){console.error(findings.join('\n'));process.exit(1);}
console.log('CWB dedup/content guard passed: no rejected media, cross-site media, public prices, MOQ ranges, certifications or internal meta copy.');
