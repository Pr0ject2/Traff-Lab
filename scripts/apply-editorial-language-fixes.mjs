import fs from 'node:fs';

const TODAY_ISO='2026-09-09';
const TODAY_RU='09.09.2026';
const touched=[];

function replaceExact(file, from, to, label){
  let s=fs.readFileSync(file,'utf8');
  if(!s.includes(from)) throw new Error(`Missing ${label} in ${file}`);
  s=s.replace(from,to);
  fs.writeFileSync(file,s);
  touched.push(file);
  console.log(`Fixed ${label}: ${file}`);
}

replaceExact('public/guides/partner-program-rules/index.html',
  'Во время проверки выплаты могут быть временно приостановлены, а спорные конверсии могут не попасть в расчёт до завершения проверки.',
  'Во время проверки выплаты могут быть приостановлены, а спорные конверсии могут не попасть в расчёт до завершения проверки.',
  'redundant wording');

replaceExact('public/guides/tracker-for-beginner/index.html',
  'Серверный Постбэк передаёт событие между системами без зависимости от браузерных куки.',
  'Серверный постбэк передаёт событие между системами и не зависит от cookie в браузере.',
  'postback/cookie wording');

replaceExact('public/traffic/sources/mailing/index.html',
  'Начни с стабильного умеренного ритма и следи за отписками и жалобами.',
  'Начни со стабильного умеренного ритма и следи за отписками и жалобами.',
  'mailing preposition');

{
  const file='public/traffic/sources/reddit/index.html';
  let s=fs.readFileSync(file,'utf8');
  const reps=[
    ['Если конкретное сообщество запрещает самореклама или gambling-ссылки,','Если конкретное сообщество запрещает саморекламу или gambling-ссылки,','reddit accusative'],
    ['правила внешних ссылок и отношение к самореклама.','правила внешних ссылок и отношение к саморекламе.','reddit dative'],
    ['Во многих сообществах самореклама ограничен или запрещён.','Во многих сообществах самореклама ограничена или запрещена.','reddit gender agreement']
  ];
  for(const [a,b,label] of reps){if(!s.includes(a))throw new Error(`Missing ${label}`);s=s.replace(a,b);console.log(`Fixed ${label}`)}
  fs.writeFileSync(file,s);touched.push(file);
}

replaceExact('public/guides/geo/index.html',
  'Для гемблинг платёжный путь особенно важен:',
  'В гемблинге платёжный путь особенно важен:',
  'geo wording');

const dateFiles=[...new Set(touched)];
const articlesFile='public/content/articles.json';
const data=JSON.parse(fs.readFileSync(articlesFile,'utf8'));

function urlForFile(file){
  let rel=file.replace(/^public/,'').replace(/index\.html$/,'');
  if(!rel.startsWith('/'))rel='/'+rel;
  return rel;
}
function updateHtmlDates(file){
  let s=fs.readFileSync(file,'utf8');
  s=s.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g,`"dateModified":"${TODAY_ISO}"`);
  s=s.replace(/(<meta\b[^>]*property=["']article:modified_time["'][^>]*content=["'])\d{4}-\d{2}-\d{2}(["'][^>]*>)/gi,`$1${TODAY_ISO}$2`);
  s=s.replace(/(<meta\b[^>]*content=["'])\d{4}-\d{2}-\d{2}(["'][^>]*property=["']article:modified_time["'][^>]*>)/gi,`$1${TODAY_ISO}$2`);
  s=s.replace(/(обновлено\s+)\d{2}\.\d{2}\.\d{4}/i,`$1${TODAY_RU}`);
  fs.writeFileSync(file,s);
}
for(const file of dateFiles){
  updateHtmlDates(file);
  const url=urlForFile(file);
  const art=data.articles.find(a=>a.url===url||a.path===file.replace(/^public\//,''));
  if(art) art.date=TODAY_RU;
}
fs.writeFileSync(articlesFile,JSON.stringify(data,null,2)+'\n');

let sitemap=fs.readFileSync('public/sitemap.xml','utf8');
for(const file of dateFiles){
  const url=urlForFile(file);
  const canonical='https://traff-lab.com'+url;
  const escaped=canonical.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const rx=new RegExp(`(<loc>${escaped}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  if(rx.test(sitemap)) sitemap=sitemap.replace(rx,`$1${TODAY_ISO}$2`);
}
fs.writeFileSync('public/sitemap.xml',sitemap);

console.log(`Editorial language fixes applied to ${dateFiles.length} pages`);
