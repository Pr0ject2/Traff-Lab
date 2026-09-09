import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root='public';
const htmlFiles=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))htmlFiles.push(p)}};
walk(root);
const toUrl=f=>{let r=f.slice(root.length).replace(/\\/g,'/');if(r==='/index.html')return '/';if(r.endsWith('/index.html'))return r.slice(0,-10);return r};

const hard=[];
const editorial=[];
const staticStats={duplicateIds:0,missingAlt:0,emptyAnchors:0,placeholderTerms:0};
const suspiciousTerms=[
  [/\b(?:TODO|FIXME|Lorem ipsum|placeholder)\b/i,'служебный placeholder/TODO'],
  [/\b(?:undefined|NaN)\b/i,'undefined/NaN в видимом тексте'],
  [/(?:^|[^\p{L}])1win(?:[^\p{L}]|$)/iu,'упоминание 1win'],
  [/ProfitAds/i,'упоминание ProfitAds'],
  [/\bmetrics\b/i,'английское metrics'],
  [/URL\s+трекер/i,'формулировка «URL трекер»'],
  [/\uFFFD/,'replacement character']
];

for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const url=toUrl(file);
  const idMatches=[...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const counts=new Map();for(const id of idMatches)counts.set(id,(counts.get(id)||0)+1);
  for(const [id,n] of counts){if(n>1){hard.push(`${url}: duplicate id #${id} x${n}`);staticStats.duplicateIds++}}
  for(const m of html.matchAll(/<img\b([^>]*)>/gi)){if(!/\balt\s*=\s*["'][^"']*["']/i.test(m[1])){hard.push(`${url}: img без alt`);staticStats.missingAlt++}}
  for(const m of html.matchAll(/<a\b([^>]*)>/gi)){const href=m[1].match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];if(href===''){hard.push(`${url}: пустой href`);staticStats.emptyAnchors++}}
  const bodyStart=html.indexOf('<!-- TL-CMS:ARTICLE_BODY_START -->');
  const bodyEnd=html.indexOf('<!-- TL-CMS:ARTICLE_BODY_END -->');
  const scope=bodyStart>=0&&bodyEnd>bodyStart?html.slice(bodyStart,bodyEnd):html;
  const text=scope.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&(?:amp|quot|lt|gt);/g,' ').replace(/\s+/g,' ').trim();
  for(const [rx,label] of suspiciousTerms){if(rx.test(text)){editorial.push(`${url}: ${label}`);staticStats.placeholderTerms++}}
  if(/\s+[,.!?;:](?:\s|$)/.test(text)) editorial.push(`${url}: пробел перед знаком препинания`);
  if(/(?:\.\.|,,|!!|\?\?)/.test(text)) editorial.push(`${url}: повторный знак препинания`);
}

const browser=await chromium.launch({headless:true});
const viewports=[
  {name:'320',width:320,height:760},
  {name:'390',width:390,height:844},
  {name:'768',width:768,height:900},
  {name:'1440',width:1440,height:900}
];
const runtime=[];
for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height}});
  for(const file of htmlFiles){
    const url=toUrl(file); const page=await context.newPage(); const pageErrors=[]; const failed=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    page.on('response',r=>{try{const u=new URL(r.url());if(u.origin==='http://127.0.0.1:4173'&&r.status()>=400)failed.push(`${r.status()} ${u.pathname}`)}catch{}});
    try{
      await page.goto('http://127.0.0.1:4173'+url,{waitUntil:'domcontentloaded',timeout:15000});
      await page.waitForTimeout(80);
      const info=await page.evaluate(()=>{
        const badImgs=[...document.images].filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.getAttribute('src')||'').slice(0,8);
        const vw=document.documentElement.clientWidth;
        const overflow=document.documentElement.scrollWidth>vw+2||document.body.scrollWidth>vw+2;
        const controls=[...document.querySelectorAll('[aria-controls]')].map(el=>el.getAttribute('aria-controls')).filter(Boolean);
        const missingControls=controls.filter(id=>!document.getElementById(id));
        const visibleButtons=[...document.querySelectorAll('button')].filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0});
        const unlabeledButtons=visibleButtons.filter(el=>!((el.getAttribute('aria-label')||'').trim()||(el.textContent||'').trim()||el.querySelector('img[alt],svg[aria-label]'))).length;
        const h1=document.querySelectorAll('h1').length;
        const main=document.querySelector('main');
        const footer=document.querySelector('footer');
        const mainRect=main?.getBoundingClientRect(); const footerRect=footer?.getBoundingClientRect();
        return {badImgs,overflow,missingControls:[...new Set(missingControls)],unlabeledButtons,h1,mainWidth:mainRect?.width||0,footerWidth:footerRect?.width||0};
      });
      if(pageErrors.length||failed.length||info.badImgs.length||info.overflow||info.missingControls.length||info.unlabeledButtons||info.h1>1){
        runtime.push(`${vp.name} ${url}: ${JSON.stringify({...info,pageErrors,failed})}`);
      }
    }catch(e){runtime.push(`${vp.name} ${url}: navigation failure ${String(e)}`)}
    await page.close();
  }
  await context.close();
}
await browser.close();

console.log(`HTML pages: ${htmlFiles.length}`);
console.log(`Static hard issues: ${hard.length}`); for(const x of hard.slice(0,100))console.log('HARD',x);
console.log(`Editorial candidates: ${editorial.length}`); for(const x of editorial.slice(0,160))console.log('EDITORIAL',x);
console.log(`Runtime/UX candidates: ${runtime.length}`); for(const x of runtime.slice(0,180))console.log('RUNTIME',x);
console.log('Static stats:',JSON.stringify(staticStats));
if(hard.length)process.exitCode=2;
