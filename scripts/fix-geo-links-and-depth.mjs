import fs from 'node:fs';

const DATE='2026-09-09';
const DISPLAY='09.09.2026';
const must=(c,m)=>{if(!c)throw new Error(m)};
const read=f=>fs.readFileSync(f,'utf8');
const write=(f,s)=>fs.writeFileSync(f,s);
const replace=(s,a,b,label)=>{must(s.includes(a),`Missing ${label}`);return s.replace(a,b)};

const updateDates=html=>html
  .replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g,`"dateModified":"${DATE}"`)
  .replace(/(<meta[^>]+(?:property|name)=["']article:modified_time["'][^>]+content=["'])\d{4}-\d{2}-\d{2}(["'])/gi,`$1${DATE}$2`)
  .replace(/(<meta[^>]+content=["'])\d{4}-\d{2}-\d{2}(["'][^>]+(?:property|name)=["']article:modified_time["'])/gi,`$1${DATE}$2`)
  .replace(/Обновлено:\s*<b>[^<]+<\/b>/g,`Обновлено: <b>${DISPLAY}</b>`);

// GEO: remove the now-stale pointer to a deleted static GEO list and replace it
// with a reusable pre-launch decision procedure.
{
  const file='public/guides/geo/index.html';
  let html=read(file);
  const old=/\n?<section class="partner-specific-box logic-section-v103 logic-explain-v103"><span>Практический пример<\/span><h2 id="актуальные-geo-программы-вынесены-отдельно">[\s\S]*?<\/section>/;
  must(old.test(html),'GEO stale partner block missing');
  const fresh=`
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="geo-checklist"><span class="logic-index-v103">05</span>Матрица проверки GEO перед запуском</h2>
<p>Страна готова к тесту только когда совпали несколько независимых условий. Доступность GEO в партнёрском кабинете отвечает лишь на один из них.</p>
<table><thead><tr><th>Слой</th><th>Что проверить</th><th>Если не сходится</th></tr></thead><tbody>
<tr><td>Партнёрская программа</td><td>Оффер, модель выплаты, источник и конкретное GEO разрешены для вашей кампании.</td><td>Не запускайте трафик до актуального подтверждения условий.</td></tr>
<tr><td>Продукт</td><td>Регистрация открывается с нужной страны, интерфейс и валюта соответствуют рынку.</td><td>Зафиксируйте проблему и не смешивайте это GEO с рабочими странами.</td></tr>
<tr><td>Платежи</td><td>Пользователь видит реально доступные и понятные ему методы пополнения.</td><td>Ожидайте просадку ниже регистрации и проверяйте другой маршрут или продукт.</td></tr>
<tr><td>Площадка</td><td>Источник допускает такой тип рекламы, внешней ссылки и креатива в выбранной стране.</td><td>Меняйте площадку или формат, а не пытайтесь скрыть запрещённый маршрут.</td></tr>
<tr><td>Правила страны</td><td>Отдельно проверены актуальные местные требования к азартным играм и их рекламе.</td><td>Список GEO программы не является юридическим разрешением.</td></tr>
<tr><td>Измерение</td><td>У страны есть собственная метка, чтобы клики, регистрации и FTD не смешивались.</td><td>Разделите кампании до первого реального трафика.</td></tr>
</tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="geo-split"><span class="logic-index-v103">06</span>Когда похожие страны всё равно считать отдельно</h2>
<p>Общий язык не делает рынки одинаковыми. Разделяйте страны, если отличается хотя бы один рабочий слой: валюта, способы оплаты, правила площадки, поисковые формулировки, доступность продукта или путь регистрации. Иначе средняя конверсия скроет причину разницы.</p>
<div class="inline-note"><strong>Минимальная единица сравнения:</strong> одно GEO + один источник + один период + одна понятная схема перехода. После этого уже можно сопоставлять стоимость и качество результата.</div>
<p>Если программа уже выбрана, используйте <a href="/guides/partner-program-rules/#rules-audit">аудит её правил</a> и сохраните подтверждение GEO до запуска.</p>
</section>`;
  html=html.replace(old,fresh);
  html=replace(html,'даёт разные клик, регистрация и регистрация, FTD','даёт разную конверсию из клика в регистрацию и из регистрации в FTD','GEO funnel wording');
  html=replace(html,'<li><a href="#актуальные-geo-программы-вынесены-отдельно">Актуальные GEO программы вынесены отдельно</a></li>','<li><a href="#geo-checklist">Матрица проверки GEO</a></li><li><a href="#geo-split">Когда считать страны отдельно</a></li>','GEO TOC');
  html=updateDates(html);
  write(file,html);
}

// Nigeria: the former "Africa" anchor disappeared when the partner-rules page
// was converted from a static country snapshot into a reusable audit workflow.
{
  const file='public/guides/nigeria-ad-guidelines/index.html';
  let html=read(file);
  const oldHref='/guides/partner-program-rules/#africa';
  const occurrences=(html.split(oldHref).length-1);
  must(occurrences===4,`Expected 4 stale Africa links, got ${occurrences}`);
  html=html.split(oldHref).join('/guides/geo/');
  html=html.replace(/<a href="\/guides\/geo\/">Африка<\/a>/g,'<a href="/guides/geo/">GEO</a>');
  html=replace(html,'<span>Вернуться</span><b>GEO программы и Африка</b><p>Сверьте Нигерию с общим списком стран и правилами программы перед подготовкой трафика.</p>','<span>Перед запуском</span><b>Проверить Нигерию как отдельное GEO</b><p>Сверьте локализацию, платёжный путь, правила рекламы и разметку Нигерии до запуска трафика.</p>','Nigeria related card');
  html=replace(html,'>Назад к Африке</a>','>Назад к GEO</a>','Nigeria exit link');
  html=updateDates(html);
  write(file,html);
}

// Keep catalog and sitemap freshness aligned with actual editorial changes.
{
  const file='public/content/articles.json';
  const data=JSON.parse(read(file));
  for(const a of data.articles){
    if(a.id==='guides--geo'){a.readTime='5 мин';a.date=DISPLAY;}
    if(a.id==='guides--nigeria-ad-guidelines'){a.date=DISPLAY;}
  }
  write(file,JSON.stringify(data,null,2)+'\n');
}
{
  const file='public/sitemap.xml';
  let xml=read(file);
  for(const url of ['/guides/geo/','/guides/nigeria-ad-guidelines/']){
    const escaped=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp(`(<loc>https://traff-lab\\.com${escaped}<\\/loc><lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod>)`);
    must(re.test(xml),`Sitemap entry missing: ${url}`);
    xml=xml.replace(re,`$1${DATE}$2`);
  }
  write(file,xml);
}

console.log('GEO depth and stale links fixed');
