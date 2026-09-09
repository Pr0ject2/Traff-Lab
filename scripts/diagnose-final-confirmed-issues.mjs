import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root='public';
const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))files.push(p)}};walk(root);
const refs={
  'multilogin.com':'https://multilogin.com?a_aid=Affiliate_Lab',
  'gologin.com':'https://gologin.com/join/TrafficLab-IQKLOHF',
  'adspower-ru.com':'https://www.adspower-ru.com/share/YyE22MlGFTGU5sX',
  'proxyline.net':'https://proxyline.net?line=287684',
  'proxy6.net':'https://proxy6.net/c/644669',
  'proxy-solutions.net':'https://proxy-solutions.net/?rc=mLToyhpFmc',
  'proxys.io':'https://proxys.io/?refid=432979',
  'onlinesim.io':'https://onlinesim.io/?bref=4472420',
  'grizzlysms.com':'https://grizzlysms.com/ru/?r=1811078',
  'sms-man.com':'https://sms-man.com/ru?ref=AETjb6uYtb1z',
  'accsmarket.com':'https://accsmarket.com/ru/mPnZBvxv',
  'dark.shopping':'https://dark.shopping/?p=211598',
  'spy.house':'https://spy.house?partner=FWLUV4PA',
  'partner.adsbridge.com':'https://partner.adsbridge.com/registration?hash=a5c1a89826c57dc7',
  'ruvds.com':'https://ruvds.com/pr105265',
  'aeza.net':'https://aeza.net/?ref=917380',
  'cp.binom.org':'https://cp.binom.org/aff/go/megafon'
};
const hostKey=s=>{let u;try{u=new URL(s)}catch{return null}const host=u.hostname.replace(/^www\./,'');return Object.keys(refs).find(h=>host===h||host.endsWith('.'+h))||null};
const cardIssues=[]; const profit=[];
for(const f of files){const html=fs.readFileSync(f,'utf8');
  for(const m of html.matchAll(/\bdata-card-link=["']([^"']+)["']/gi)){const key=hostKey(m[1]);if(key&&m[1]!==refs[key])cardIssues.push(`${f}: ${m[1]} -> ${refs[key]}`)}
  for(const m of html.matchAll(/.{0,180}ProfitAds.{0,240}/gi))profit.push(`${f}: ${m[0].replace(/\s+/g,' ')}`);
}
console.log(`Affiliate data-card-link mismatches: ${cardIssues.length}`);cardIssues.forEach(x=>console.log('CARD',x));
console.log(`ProfitAds snippets: ${profit.length}`);profit.forEach(x=>console.log('PROFITADS',x));

const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:320,height:760}});
const page=await ctx.newPage();await page.goto('http://127.0.0.1:4173/admin/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>{const vw=document.documentElement.clientWidth;return [...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName.toLowerCase(),id:el.id||'',cls:(el.className&&typeof el.className==='string')?el.className:'',text:(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,80),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}).filter(x=>x.width>0&&(x.left<-1||x.right>vw+1)).sort((a,b)=>b.right-a.right).slice(0,30)});
console.log(`Admin 320 overflowing elements: ${overflow.length}`);overflow.forEach(x=>console.log('OVERFLOW',JSON.stringify(x)));
for(const p of ['/guides/adsbridge-campaign/','/guides/clicks-no-registrations/','/traffic/sources/youtube/']){const pg=await ctx.newPage();await pg.goto('http://127.0.0.1:4173'+p,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(120);const bad=await pg.evaluate(()=>[...document.images].filter(img=>img.complete&&img.naturalWidth===0).map(img=>({src:img.getAttribute('src'),currentSrc:img.currentSrc,outerHTML:img.outerHTML.slice(0,700),display:getComputedStyle(img).display,visibility:getComputedStyle(img).visibility,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height})));console.log(`Broken-image candidates ${p}: ${bad.length}`);bad.forEach(x=>console.log('BADIMG',JSON.stringify(x)));await pg.close()}
await ctx.close();await browser.close();
