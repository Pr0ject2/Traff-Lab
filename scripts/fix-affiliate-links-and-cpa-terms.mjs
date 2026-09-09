import fs from 'node:fs';
import path from 'node:path';

const root='public';
const dateIso='2026-09-09';
const dateRu='09.09.2026';
const referrals={
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

const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))files.push(p)}};
walk(root);
let hrefChanges=0, relChanges=0, touched=0;

for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  html=html.replace(/<a\b[^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*>/gi, tag=>{
    const m=tag.match(/\bhref=["'](https?:\/\/[^"']+)["']/i); if(!m)return tag;
    let u;try{u=new URL(m[1])}catch{return tag}
    const host=u.hostname.replace(/^www\./,'');
    const key=Object.keys(referrals).find(h=>host===h||host.endsWith('.'+h));
    if(!key)return tag;
    let out=tag;
    if(m[1]!==referrals[key]){out=out.replace(m[0],`href="${referrals[key]}"`);hrefChanges++}
    const required=['sponsored','nofollow','noopener','noreferrer'];
    const rel=out.match(/\brel=["']([^"']*)["']/i);
    if(rel){
      const tokens=new Set(rel[1].split(/\s+/).filter(Boolean));
      let changed=false; for(const x of required)if(!tokens.has(x)){tokens.add(x);changed=true}
      if(changed){out=out.replace(rel[0],`rel="${[...tokens].join(' ')}"`);relChanges++}
    }else{
      out=out.replace(/>$/,` rel="${required.join(' ')}">`);relChanges++;
    }
    return out;
  });
  if(html!==before){fs.writeFileSync(file,html);touched++}
}

const cpaFile=`${root}/guides/cpa-vs-revshare/index.html`;
let cpa=fs.readFileSync(cpaFile,'utf8');
const stale='В программе из рабочих примеров базовый RS начинается с 50% GGR. CPA согласуется индивидуально до запуска кампании. У моделей различаются и условия первой выплаты, поэтому сравнивать только процент RS и ставку CPA без остальных правил бессмысленно.';
const fresh='В конкретной программе сначала зафиксируйте текущую ставку RevShare или CPA, расчётную базу, квалификацию FTD, правила отрицательного баланса, холд и условия выплаты. Затем сравнивайте модели на данных одного и того же источника и GEO. Рекламная ставка без даты проверки и остальных условий не годится как основание для выбора.';
if(!cpa.includes(stale))throw new Error('Expected stale CPA/RevShare example not found');
cpa=cpa.replace(stale,fresh)
  .replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g,`"dateModified":"${dateIso}"`)
  .replace(/(<meta\s+property="article:modified_time"\s+content=")\d{4}-\d{2}-\d{2}("\s*\/?>)/g,`$1${dateIso}$2`)
  .replace(/(<meta\s+content=")\d{4}-\d{2}-\d{2}("\s+property="article:modified_time"\s*\/?>)/g,`$1${dateIso}$2`);
if(/базовый RS начинается с 50% GGR/i.test(cpa))throw new Error('Stale program-specific RS rate remains');
fs.writeFileSync(cpaFile,cpa);

const body=cpa.slice(cpa.indexOf('<!-- TL-CMS:ARTICLE_BODY_START -->'),cpa.indexOf('<!-- TL-CMS:ARTICLE_BODY_END -->'));
const words=body.replace(/<[^>]+>/g,' ').replace(/&[a-zA-Z#0-9]+;/g,' ').trim().split(/\s+/).filter(Boolean).length;
const catalogPath=`${root}/content/articles.json`;
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const item=catalog.articles.find(x=>x.id==='guides--cpa-vs-revshare');
if(!item)throw new Error('CPA catalog item missing');
item.readTime=`${Math.max(3,Math.ceil(words/190))} мин`; item.date=dateRu;
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');

const sitemapPath=`${root}/sitemap.xml`;
let sitemap=fs.readFileSync(sitemapPath,'utf8');
const url='https://traff-lab.com/guides/cpa-vs-revshare/';
const esc=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
sitemap=sitemap.replace(new RegExp(`(<loc>${esc}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`),`$1${dateIso}$2`);
fs.writeFileSync(sitemapPath,sitemap);

console.log(`Affiliate href changes: ${hrefChanges}`);
console.log(`Affiliate rel changes: ${relChanges}`);
console.log(`HTML files touched by affiliate normalization: ${touched}`);
console.log('CPA/RevShare volatile program-specific rate removed');
