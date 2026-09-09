import fs from 'node:fs';
import path from 'node:path';

const root='public';
const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))files.push(p)}};
walk(root);

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

const affiliateIssues=[];
const volatile=[];
const seen=new Set();
const volatileRe=/(?:[$€₽]\s*\d|\d[\d\s.,]*\s*(?:[$€₽]|USD|EUR|руб\.?|%)|минимальн(?:ая|ый)\s+(?:выплата|депозит)|холд\s+\d|депозитор(?:ов|а)?\s*\d)/i;

for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>/gi)){
    let u;try{u=new URL(m[1])}catch{continue}
    const host=u.hostname.replace(/^www\./,'');
    const key=Object.keys(referrals).find(h=>host===h||host.endsWith('.'+h));
    if(key && m[1]!==referrals[key]) affiliateIssues.push(`${file}: ${m[1]} -> expected ${referrals[key]}`);
  }
  const bodyStart=html.indexOf('<!-- TL-CMS:ARTICLE_BODY_START -->');
  const bodyEnd=html.indexOf('<!-- TL-CMS:ARTICLE_BODY_END -->');
  const body=bodyStart>=0&&bodyEnd>bodyStart?html.slice(bodyStart,bodyEnd):html;
  const text=body.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&[a-zA-Z#0-9]+;/g,' ').replace(/\s+/g,' ').trim();
  for(const sentence of text.split(/(?<=[.!?])\s+/)){
    if(!volatileRe.test(sentence)) continue;
    const clean=sentence.slice(0,360);
    const k=`${file}|${clean}`; if(seen.has(k))continue; seen.add(k); volatile.push(`${file}: ${clean}`);
  }
}

console.log(`HTML pages scanned: ${files.length}`);
console.log(`Affiliate link mismatches: ${affiliateIssues.length}`);
for(const x of affiliateIssues) console.log('AFFILIATE',x);
console.log(`Potential volatile numeric claims: ${volatile.length}`);
for(const x of volatile.slice(0,120)) console.log('VOLATILE',x);
if(volatile.length>120) console.log(`VOLATILE ... ${volatile.length-120} more omitted`);
