import fs from 'node:fs';
import path from 'node:path';

const root = 'public';
const htmlFiles = [];
function walk(dir){
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(p);
  }
}
walk(root);

const toUrl = file => {
  let rel=file.slice(root.length).replace(/\\/g,'/');
  if(rel==='/index.html') return '/';
  if(rel.endsWith('/index.html')) return rel.slice(0,-'index.html'.length);
  return rel;
};
const fileByUrl = new Map(htmlFiles.map(f=>[toUrl(f),f]));

function resolvePath(url){
  if(fileByUrl.has(url)) return fileByUrl.get(url);
  if(!url.endsWith('/') && fileByUrl.has(url+'/')) return fileByUrl.get(url+'/');
  if(url.endsWith('/') && fileByUrl.has(url.slice(0,-1))) return fileByUrl.get(url.slice(0,-1));
  return null;
}
function anchorExists(html, rawHash){
  if(!rawHash) return true;
  let hash=rawHash;
  try{hash=decodeURIComponent(hash)}catch{}
  const esc = hash.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?:id|name)=["']${esc}["']`,'i').test(html);
}

const broken=[];
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const sourceUrl=toUrl(file);
  const re=/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  for(const m of html.matchAll(re)){
    const href=m[1].trim();
    if(!href || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    if(href.startsWith('/assets/') || href.startsWith('/favicon') || href.startsWith('/go/')) continue;
    if(href.startsWith('?')) continue;
    let pathname, hash='';
    if(href.startsWith('#')) { pathname=sourceUrl; hash=href.slice(1); }
    else if(href.startsWith('/')) {
      const cut=href.split('#'); pathname=cut[0].split('?')[0] || '/'; hash=cut[1] || '';
    } else continue;
    const target=resolvePath(pathname);
    if(!target){broken.push({source:sourceUrl,href,reason:'missing-page'});continue;}
    if(hash){
      const targetHtml=target===file?html:fs.readFileSync(target,'utf8');
      if(!anchorExists(targetHtml,hash)) broken.push({source:sourceUrl,href,reason:'missing-anchor'});
    }
  }
}

console.log(`HTML pages scanned: ${htmlFiles.length}`);
console.log(`Broken internal links/anchors: ${broken.length}`);
for(const x of broken) console.log(`${x.reason}\t${x.source}\t${x.href}`);
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/internal-links.json',JSON.stringify(broken,null,2));
if(broken.length) process.exitCode=2;
