import fs from 'node:fs';
import path from 'node:path';

const root = 'public';
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8')).articles;

const decode = s => String(s || '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const strip = html => decode(String(html || '')
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
  .replace(/data:image\/[^"']+/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim());

const bodyOf = html => {
  const start = html.indexOf('<!-- TL-CMS:ARTICLE_BODY_START -->');
  const end = html.indexOf('<!-- TL-CMS:ARTICLE_BODY_END -->');
  if (start >= 0 && end > start) return html.slice(start, end);
  const m = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  return m ? m[1] : html;
};

const textWords = text => (String(text).toLowerCase().match(/[a-zа-яё0-9]{2,}/giu) || []);
const shingles = (words, n = 4) => {
  const set = new Set();
  for (let i = 0; i <= words.length - n; i++) set.add(words.slice(i, i + n).join(' '));
  return set;
};
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

const pages = [];
for (const item of catalog) {
  if (!item.path || item.system) continue;
  const file = path.join(root, item.path);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const bodyText = strip(bodyOf(html));
  const words = textWords(bodyText);
  const h1 = strip((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [,''])[1]);
  const title = strip((html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1]);
  const description = decode((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) || [,''])[1]);
  const canonicalCount = (html.match(/rel=["']canonical["']/gi) || []).length;
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const visibleRead = strip((html.match(/Чтение:\s*<b>([^<]+)<\/b>/i) || [,''])[1]);
  const visibleDate = strip((html.match(/Обновлено:\s*<b>([^<]+)<\/b>/i) || [,''])[1]);
  const modified = (html.match(/article:modified_time["'][^>]*content=["']([^"']+)/i) || html.match(/content=["']([^"']+)["'][^>]*article:modified_time/i) || [,''])[1];
  pages.push({
    ...item,
    file,
    h1,
    title,
    description,
    canonicalCount,
    h1Count,
    visibleRead,
    visibleDate,
    modified,
    wordCount: words.length,
    shingleSet: shingles(words)
  });
}

const pairRisks = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const a = pages[i], b = pages[j];
    const sim = jaccard(a.shingleSet, b.shingleSet);
    if (sim >= 0.12) pairRisks.push({ a: a.url, b: b.url, sim });
  }
}
pairRisks.sort((a,b) => b.sim - a.sim);

for (const p of pages) {
  p.maxSimilarity = 0;
  p.similarTo = '';
  for (const pair of pairRisks) {
    if (pair.a === p.url && pair.sim > p.maxSimilarity) { p.maxSimilarity = pair.sim; p.similarTo = pair.b; }
    if (pair.b === p.url && pair.sim > p.maxSimilarity) { p.maxSimilarity = pair.sim; p.similarTo = pair.a; }
  }
  let score = 0;
  if (p.wordCount < 250) score += 5;
  else if (p.wordCount < 400) score += 3;
  else if (p.wordCount < 550) score += 1;
  if (p.maxSimilarity >= 0.32) score += 5;
  else if (p.maxSimilarity >= 0.22) score += 3;
  else if (p.maxSimilarity >= 0.14) score += 1;
  if (p.h1 && p.title && !p.title.includes(p.h1.slice(0, Math.min(28, p.h1.length)))) score += 1;
  if (p.h1 !== p.title.replace(/\s*\|\s*TrafficLab\s*$/i, '').trim()) score += 1;
  if (p.h1Count !== 1 || p.canonicalCount !== 1) score += 4;
  if (p.visibleRead && p.readTime && p.visibleRead !== p.readTime) score += 2;
  p.riskScore = score;
}

const ranked = [...pages].sort((a,b) => b.riskScore - a.riskScore || a.wordCount - b.wordCount);
const mismatches = pages.filter(p =>
  p.h1Count !== 1 || p.canonicalCount !== 1 ||
  (p.visibleRead && p.readTime && p.visibleRead !== p.readTime) ||
  (p.description && p.description !== p.description.trim())
);

const lines = [];
lines.push('# TrafficLab content quality audit');
lines.push('');
lines.push(`Pages scanned: ${pages.length}`);
lines.push(`Potential duplicate pairs (Jaccard >= 0.12): ${pairRisks.length}`);
lines.push(`Metadata/structure mismatches: ${mismatches.length}`);
lines.push('');
lines.push('## Highest-risk pages');
lines.push('');
lines.push('| Score | Words | Similarity | URL | Closest page | Catalog read | Visible read |');
lines.push('|---:|---:|---:|---|---|---|---|');
for (const p of ranked.slice(0, 25)) {
  lines.push(`| ${p.riskScore} | ${p.wordCount} | ${p.maxSimilarity.toFixed(3)} | ${p.url} | ${p.similarTo || ''} | ${p.readTime || ''} | ${p.visibleRead || ''} |`);
}
lines.push('');
lines.push('## Most similar pairs');
lines.push('');
lines.push('| Similarity | A | B |');
lines.push('|---:|---|---|');
for (const p of pairRisks.slice(0, 30)) lines.push(`| ${p.sim.toFixed(3)} | ${p.a} | ${p.b} |`);
lines.push('');
lines.push('## Metadata / structure mismatches');
lines.push('');
for (const p of mismatches) {
  lines.push(`- ${p.url}: H1=${p.h1Count}, canonical=${p.canonicalCount}, catalog read=${p.readTime || '-'}, visible read=${p.visibleRead || '-'}`);
}

fs.mkdirSync('audit-output', { recursive: true });
fs.writeFileSync('audit-output/content-quality.md', lines.join('\n'));
fs.writeFileSync('audit-output/content-quality.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  pages: ranked.map(({shingleSet, ...p}) => p),
  similarPairs: pairRisks
}, null, 2));

console.log(lines.join('\n'));
