import fs from 'node:fs';

const mustReplace=(file,from,to,label)=>{
  let s=fs.readFileSync(file,'utf8');
  if(!s.includes(from)) throw new Error(`Missing ${label} in ${file}`);
  s=s.replace(from,to);fs.writeFileSync(file,s);console.log(`Updated ${label}: ${file}`);
};

// 1. Whole-card clicks must preserve the same referral URL as the visible anchor.
mustReplace('public/services/index.html','data-card-link="https://dark.shopping/"','data-card-link="https://dark.shopping/?p=211598"','Dark.Shopping card referral');
mustReplace('public/services/index.html','data-card-link="https://ruvds.com/"','data-card-link="https://ruvds.com/pr105265"','RUVDS card referral');

// 2. Replace ProfitAds with two crypto-friendly payment paths that solve different jobs.
{
  const file='public/services/index.html'; let s=fs.readFileSync(file,'utf8');
  const start=s.indexOf('<section class="wrap service-workflow compact-block-v103" id="ads">');
  const end=s.indexOf('<section class="wrap service-start-kit compact-block-v103">',start);
  if(start<0||end<0) throw new Error('Services ads section not found');
  const replacement=`<section class="wrap service-workflow compact-block-v103" id="ads"><div class="service-workflow-head"><span>04</span><div><h2>Оплата и доступ к рекламным кабинетам</h2><p>Здесь два разных сценария: агентский Google Ads-аккаунт с пополнением из криптовалюты или отдельная виртуальная карта для оплаты поддерживаемого рекламного кабинета. Это не способы обходить правила рекламной системы.</p></div></div><div class="service-tool-grid">
<article aria-label="YeezyPay: открыть сайт сервиса" class="service-tool" data-card-link="https://yeezypay.io/" role="link" tabindex="0"><div class="service-tool-head"><span aria-hidden="true" class="service-mark tool-logo-inline"><svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><rect fill="#173b34" height="64" rx="14" width="64"></rect><path d="M17 21h30v22H17z" fill="#e5f1ec"></path><path d="M22 27h20M22 33h13M22 39h8" stroke="#173b34" stroke-linecap="round" stroke-width="3"></path><circle cx="45" cy="42" r="9" fill="#53d79c"></circle><path d="m41 42 2.5 2.5L49 39" fill="none" stroke="#173b34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.7"></path></svg></span><div><div class="service-kicker">Google Ads · агентский аккаунт</div><h3>YeezyPay</h3></div></div><p>Сервис предоставляет доступ к агентским Google Ads-субаккаунтам и принимает пополнение в USDT. По текущей информации самого провайдера, он работает в том числе с affiliate- и gambling-вертикалями.</p><dl><div><dt>Когда нужен</dt><dd>Когда проблема именно в доступе и оплате Google Ads из страны, где обычный биллинг неудобен или недоступен.</dd></div><div><dt>Что проверить</dt><dd>Текущую комиссию, минимальный депозит, поддерживаемый GEO и правила конкретного оффера до пополнения.</dd></div><div><dt>Важно</dt><dd>Агентский аккаунт не делает кампанию «неуязвимой» для блокировок и не отменяет сертификацию, лицензирование и правила Google.</dd></div></dl><a class="service-open-link" href="https://yeezypay.io/" rel="nofollow noopener noreferrer" target="_blank">Перейти на сайт</a></article>
<article aria-label="Libermall Card: открыть сайт сервиса" class="service-tool" data-card-link="https://card.libermall.com/en/cards/ads" role="link" tabindex="0"><div class="service-tool-head"><span aria-hidden="true" class="service-mark tool-logo-inline"><svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><rect fill="#fff" height="64" rx="14" width="64"></rect><rect x="10" y="17" width="44" height="30" rx="6" fill="#173b34"></rect><path d="M10 26h44" stroke="#53d79c" stroke-width="5"></path><rect x="17" y="35" width="12" height="4" rx="2" fill="#e5f1ec"></rect></svg></span><div><div class="service-kicker">Виртуальные карты · USDT</div><h3>Libermall Card</h3></div></div><p>Виртуальные Visa/Mastercard с пополнением криптовалютой. Сервис отдельно заявляет карты для оплаты Meta, Google Ads и TikTok Ads.</p><dl><div><dt>Когда нужен</dt><dd>Когда рекламный кабинет уже есть и нужна международная карта, которую можно пополнять из USDT.</dd></div><div><dt>Чем отличается</dt><dd>Это платёжный инструмент, а не агентский рекламный аккаунт. Карта не меняет правила и статус самого кабинета.</dd></div><div><dt>Перед выпуском</dt><dd>Проверь актуальную стоимость карты, комиссии, лимиты и поддержку нужной рекламной системы.</dd></div></dl><a class="service-open-link" href="https://card.libermall.com/en/cards/ads" rel="nofollow noopener noreferrer" target="_blank">Перейти на сайт</a></article>
</div></section>
`;
  s=s.slice(0,start)+replacement+s.slice(end);
  s=s.replace('Spy.House для исследования, AdsBridge для измерения, ProfitAds для оплаты поддерживаемых кабинетов.','Spy.House для исследования, AdsBridge для измерения. Для оплаты: YeezyPay, если нужен агентский Google Ads-аккаунт с USDT, или Libermall Card, если нужен отдельный карточный платёжный инструмент.');
  fs.writeFileSync(file,s);
}

// 3. Update the paid-traffic guide: remove stale ProfitAds recommendation and explain the two payment models.
{
  const file='public/guides/paid-traffic/index.html';let s=fs.readFileSync(file,'utf8');
  const old='<div class="service-inline"><b>Исследование, трекинг и оплата</b><p>Для поиска рекламных подходов используй <a class="service-name-link" href="https://spy.house?partner=FWLUV4PA" rel="sponsored nofollow noopener noreferrer" target="_blank"><strong>Spy.House</strong></a>, для измерения кампаний — <a class="service-name-link" href="https://partner.adsbridge.com/registration?hash=a5c1a89826c57dc7" rel="sponsored nofollow noopener noreferrer" target="_blank"><strong>AdsBridge</strong></a>, для пополнения поддерживаемых рекламных кабинетов — <a class="service-name-link" href="https://profitads.ru/" rel="noopener noreferrer" target="_blank"><strong>ProfitAds</strong></a>. Условия пополнения проверяй перед переводом бюджета.</p><div class="service-inline-actions"><a class="service-inline-more service-inline-secondary" href="/services/">Открыть набор сервисов</a></div></div>';
  const neu='<div class="service-inline"><b>Исследование, трекинг и оплата</b><p>Для поиска рекламных подходов используй <a class="service-name-link" href="https://spy.house?partner=FWLUV4PA" rel="sponsored nofollow noopener noreferrer" target="_blank"><strong>Spy.House</strong></a>, для измерения кампаний — <a class="service-name-link" href="https://partner.adsbridge.com/registration?hash=a5c1a89826c57dc7" rel="sponsored nofollow noopener noreferrer" target="_blank"><strong>AdsBridge</strong></a>. Если нужен агентский Google Ads-аккаунт с пополнением из USDT, отдельно проверь <a class="service-name-link" href="https://yeezypay.io/" rel="nofollow noopener noreferrer" target="_blank"><strong>YeezyPay</strong></a>. Если кабинет уже есть и нужна международная карта из криптобаланса, один из вариантов — <a class="service-name-link" href="https://card.libermall.com/en/cards/ads" rel="nofollow noopener noreferrer" target="_blank"><strong>Libermall Card</strong></a>. Условия, комиссии и правила площадки проверяй перед переводом бюджета.</p><div class="service-inline-actions"><a class="service-inline-more service-inline-secondary" href="/services/">Открыть набор сервисов</a></div></div>';
  if(!s.includes(old))throw new Error('ProfitAds block in paid guide not found');s=s.replace(old,neu);
  s=s.replaceAll('2026-08-16','2026-09-09');
  fs.writeFileSync(file,s);
}

// 4. Update the full paid-source playbook in all three places: setup copy, tool grid and right rail.
{
  const file='public/traffic/sources/paid/index.html';let s=fs.readFileSync(file,'utf8');
  const oldP='<p class="inline-tool-explainer">Если нужная рекламная система поддерживается <a class="inline-service-link" href="https://profitads.ru/" rel="noopener noreferrer" target="_blank">ProfitAds</a>, через него можно пополнять кабинет из одного места. До запуска посчитай комиссию и курс пополнения, потому что эти расходы входят в реальную стоимость трафика.</p>';
  const newP='<p class="inline-tool-explainer">Для оплаты сначала раздели две задачи. Если нужен агентский Google Ads-субаккаунт с пополнением из USDT, проверь <a class="inline-service-link" href="https://yeezypay.io/" rel="nofollow noopener noreferrer" target="_blank">YeezyPay</a>: по текущей информации провайдера он работает и с affiliate/gambling-вертикалями, но требования Google и GEO всё равно действуют. Если рекламный кабинет уже есть и нужен карточный способ оплаты из криптобаланса, отдельно рассмотри <a class="inline-service-link" href="https://card.libermall.com/en/cards/ads" rel="nofollow noopener noreferrer" target="_blank">Libermall Card</a>. Комиссии, лимиты и совместимость проверяй до перевода бюджета.</p>';
  if(!s.includes(oldP))throw new Error('ProfitAds setup paragraph not found');s=s.replace(oldP,newP);
  const oldCard='<a class="source-tool-card" href="https://profitads.ru/" rel="noopener noreferrer" target="_blank"><span class="source-tool-card-top">Оплата рекламы</span><b>ProfitAds</b><span class="source-tool-card-copy">Пригодится для пополнения поддерживаемых рекламных кабинетов через единый сервис. Перед платежом проверь комиссию и доступность нужной площадки.</span><span class="source-tool-card-action">Открыть сервис</span></a>';
  const newCards='<a class="source-tool-card" href="https://yeezypay.io/" rel="nofollow noopener noreferrer" target="_blank"><span class="source-tool-card-top">Google Ads · агентский аккаунт</span><b>YeezyPay</b><span class="source-tool-card-copy">Агентские Google Ads-субаккаунты с пополнением в USDT. Перед депозитом проверь текущий GEO, вертикаль, комиссию и требования Google к рекламе азартных продуктов.</span><span class="source-tool-card-action">Открыть сервис</span></a><a class="source-tool-card" href="https://card.libermall.com/en/cards/ads" rel="nofollow noopener noreferrer" target="_blank"><span class="source-tool-card-top">Виртуальная карта</span><b>Libermall Card</b><span class="source-tool-card-copy">Отдельный карточный способ оплаты для уже существующего кабинета: виртуальные Visa/Mastercard с пополнением из USDT и заявленной поддержкой Google, Meta и TikTok Ads.</span><span class="source-tool-card-action">Открыть сервис</span></a>';
  if(!s.includes(oldCard))throw new Error('ProfitAds source card not found');s=s.replace(oldCard,newCards);
  const railRx=/<a href="https:\/\/profitads\.ru\/" rel="sponsored nofollow noopener noreferrer" target="_blank"><span class="rail-tool-mark"><img[^>]*src="\/assets\/tool-logos\/profitads\.svg"[^>]*><\/span><span><b>ProfitAds<\/b><small>Пополнение рекламных кабинетов<\/small><\/span><\/a>/;
  if(!railRx.test(s))throw new Error('ProfitAds rail card not found');
  s=s.replace(railRx,'<a href="https://yeezypay.io/" rel="nofollow noopener noreferrer" target="_blank"><span class="rail-tool-mark"><svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><rect fill="#173b34" height="64" rx="14" width="64"></rect><path d="M17 21h30v22H17z" fill="#e5f1ec"></path><path d="M22 27h20M22 33h13M22 39h8" stroke="#173b34" stroke-linecap="round" stroke-width="3"></path><circle cx="45" cy="42" r="9" fill="#53d79c"></circle><path d="m41 42 2.5 2.5L49 39" fill="none" stroke="#173b34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.7"></path></svg></span><span><b>YeezyPay</b><small>Google Ads + USDT</small></span></a>');
  fs.writeFileSync(file,s);
}

// 5. Real editorial typo found in the catalog metadata.
{
  const file='public/content/articles.json';const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const cpa=data.articles.find(a=>a.id==='guides--cpa-vs-revshare');
  if(!cpa)throw new Error('CPA vs RevShare catalog entry missing');
  cpa.lead=cpa.lead.replace('правилах конкретного оффер.','правилах конкретного оффера.');
  const paid=data.articles.find(a=>a.id==='guides--paid-traffic');
  if(!paid)throw new Error('Paid traffic catalog entry missing');paid.date='09.09.2026';
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}

// 6. Synchronize sitemap lastmod for the changed catalog guide.
{
  const file='public/sitemap.xml';let s=fs.readFileSync(file,'utf8');
  const rx=/(<loc>https:\/\/traff-lab\.com\/guides\/paid-traffic\/<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/;
  if(!rx.test(s))throw new Error('Paid traffic sitemap entry not found');s=s.replace(rx,'$12026-09-09$2');fs.writeFileSync(file,s);
}

// 7. Fix real document-level overflow in the protected admin at 320px. The nav remains intentionally horizontally scrollable.
{
  const file='public/admin/admin.css';let s=fs.readFileSync(file,'utf8');
  const css=`\n/* v544 — compact admin header for 320px devices */\n@media(max-width:360px){\n  .adm-top{padding:0 8px;gap:6px}\n  .adm-brand{gap:7px;min-width:0;flex:0 1 auto}\n  .adm-brand img{width:34px;height:34px;padding:4px;border-radius:9px}\n  .adm-brand span{display:none}\n  .adm-top-actions{gap:5px;min-width:0;flex:0 0 auto}\n  .adm-top-actions #openSettings,.adm-top-actions .admin-logout-form .ghost{min-height:36px;padding:0 8px;font-size:11px}\n  .adm-nav{max-width:100vw;overscroll-behavior-x:contain}\n}\n`;
  if(!s.includes('v544 — compact admin header for 320px devices'))s+=css;fs.writeFileSync(file,s);
}

console.log('Final pre-release production fixes applied');
