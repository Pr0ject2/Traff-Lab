import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const sourcePath = 'scripts/improve-quality-batch-2.mjs';
const runtimePath = '/tmp/improve-quality-batch-2-runtime.mjs';
let source = fs.readFileSync(sourcePath, 'utf8');

const after = `function enrich(file, id, block, tocNeedle, tocItems){
  let html = read(file);
  must(!html.includes(\`id=\\"\${id}\\"\`), \`\${file}: \${id} already exists\`);
  const end = '<!-- TL-CMS:ARTICLE_BODY_END -->';
  must(html.includes(end), \`\${file}: body end marker missing\`);
  html = html.replace(end, \`\${block}\\n\${end}\`);

  // Insert new TOC entries before the existing final navigation item. This is
  // more robust than matching human-readable Cyrillic anchors exactly.
  const tocEnd = '</ol></nav><div class=\\"aside-block rail-feedback\\">';
  const tocEndPos = html.indexOf(tocEnd);
  must(tocEndPos >= 0, \`\${file}: TOC boundary missing\`);
  const olStart = html.lastIndexOf('<ol>', tocEndPos);
  const lastItem = html.lastIndexOf('<li>', tocEndPos);
  must(olStart >= 0 && lastItem > olStart, \`\${file}: TOC list missing\`);
  html = html.slice(0, lastItem) + tocItems + html.slice(lastItem);

  html = updateDates(html);
  write(file, html);
}`;

const pattern = /function enrich\(file, id, block, tocNeedle, tocItems\)\{[\s\S]*?\n\}/;
if (!pattern.test(source)) throw new Error('Expected enrich() implementation not found');
source = source.replace(pattern, after);
fs.writeFileSync(runtimePath, source);
await import(pathToFileURL(runtimePath).href + `?v=${Date.now()}`);
