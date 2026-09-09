import fs from 'node:fs';
import path from 'node:path';

const root='public';
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/articles.json'),'utf8'));
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const articles=Array.isArray(catalog.articles)?catalog.articles:[];
const failures=[];
const warnings=[];
const rows=[];

const decode=s=>String(s||'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const strip=s=>decode(String(s||'').replace(/<[^>]*>/g,' '));
const one=(html,re,label,url)=>{const a=[...html.matchAll(re)];if(a.length!==1)failures.push(`${url}: ${label} count=${a.length}`);return a[0]?.[1]||''};
const slugFrom=item=>{
  if(item.url){try{return new URL(item.url,'https://traff-lab.com').pathname}catch{}}
  const id=String(item.id||'');
  if(id.startsWith('guides--'))return `/guides/${id.slice('guides--'.length)}/`;
  return '';
};
const normalizePath=p=>{if(!p)return '';p=p.split('?')[0].split('#')[0];if(!p.startsWith('/'))p='/'+p;if(!p.endsWith('/'))p+='/';return p};

for(const item of articles){
  const url=normalizePath(slugFrom(item));
  if(!url){failures.push(`catalog item without resolvable URL: ${item.id||item.title||'unknown'}`);continue}
  const file=path.join(root,url.replace(/^\//,'/'),'index.html');
  if(!fs.existsSync(file)){failures.push(`${url}: HTML file missing (${file})`);continue}
  const html=fs.readFileSync(file,'utf8');
  const title=strip(one(html,/<title>([\s\S]*?)<\/title>/gi,'title',url));
  const h1=strip(one(html,/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi,'h1',url));
  const canonical=one(html,/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>|<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi,'canonical',url);
  const canonicalValue=canonical||'';
  const descMatches=[...html.matchAll(/<meta\b[^>]*(?:name=["']description["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']description["'])[^>]*>/gi)];
  if(descMatches.length!==1)failures.push(`${url}: meta description count=${descMatches.length}`);
  const description=decode(descMatches[0]?.[1]||descMatches[0]?.[2]||'');
  const robotsMatches=[...html.matchAll(/<meta\b[^>]*(?:name=["']robots["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']robots["'])[^>]*>/gi)];
  if(robotsMatches.length!==1)failures.push(`${url}: robots count=${robotsMatches.length}`);
  const robots=decode(robotsMatches[0]?.[1]||robotsMatches[0]?.[2]||'').toLowerCase();
  if(!robots.includes('index')||robots.includes('noindex'))failures.push(`${url}: robots is not indexable (${robots})`);
  if(!title)failures.push(`${url}: empty title`);
  if(!h1)failures.push(`${url}: empty h1`);
  if(!description)failures.push(`${url}: empty meta description`);
  if(description.length<70)warnings.push(`${url}: short description ${description.length} chars`);
  if(description.length>190)warnings.push(`${url}: long description ${description.length} chars`);
  const expected=`https://traff-lab.com${url}`;
  const canonicalFull=canonicalValue.startsWith('http')?canonicalValue:`https://traff-lab.com${canonicalValue}`;
  if(canonicalFull!==expected)failures.push(`${url}: canonical=${canonicalValue}, expected=${expected}`);
  if(!sitemap.includes(`<loc>${expected}</loc>`))failures.push(`${url}: missing from sitemap`);
  const articleLdCount=(html.match(/"@type":"Article"/g)||[]).length;
  if(articleLdCount!==1)failures.push(`${url}: Article JSON-LD count=${articleLdCount}`);
  rows.push({url,title,h1,description,canonical:canonicalFull,catalogTitle:decode(item.title||''),catalogDescription:decode(item.description||'')});
}

const dup=(field,label)=>{
  const groups=new Map();
  for(const r of rows){const v=r[field].toLocaleLowerCase('ru-RU');if(!v)continue;const a=groups.get(v)||[];a.push(r.url);groups.set(v,a)}
  for(const [v,urls] of groups)if(urls.length>1)failures.push(`duplicate ${label}: ${urls.join(', ')} :: ${v.slice(0,180)}`);
};
dup('title','title');dup('h1','H1');dup('description','description');dup('canonical','canonical');

for(const r of rows){
  if(r.catalogTitle && r.h1 && r.catalogTitle!==r.h1)warnings.push(`${r.url}: catalog title differs from H1 :: catalog="${r.catalogTitle}" h1="${r.h1}"`);
  if(r.catalogDescription && r.description && r.catalogDescription!==r.description)warnings.push(`${r.url}: catalog description differs from meta description`);
}

console.log(`Catalog articles checked: ${articles.length}`);
console.log(`Resolved HTML articles: ${rows.length}`);
console.log(`SEO/content failures: ${failures.length}`);
for(const x of failures)console.log('FAIL',x);
console.log(`SEO/content warnings: ${warnings.length}`);
for(const x of warnings.slice(0,120))console.log('WARN',x);
if(warnings.length>120)console.log(`WARN ... ${warnings.length-120} more omitted`);
if(failures.length)process.exitCode=1;
