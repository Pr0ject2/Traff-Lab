import fs from 'node:fs';

const root='public';
const dateIso='2026-09-09';
const dateRu='09.09.2026';

const insertBeforeBodyEnd=(html, section)=>{
  const marker='\n<!-- TL-CMS:ARTICLE_BODY_END -->';
  if(!html.includes(marker)) throw new Error('ARTICLE_BODY_END missing');
  return html.replace(marker, `\n${section}${marker}`);
};

const updateDates=html=>html
  .replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g, `"dateModified":"${dateIso}"`)
  .replace(/(<meta\s+property="article:modified_time"\s+content=")\d{4}-\d{2}-\d{2}("\s*\/?>)/g, `$1${dateIso}$2`)
  .replace(/(<meta\s+content=")\d{4}-\d{2}-\d{2}("\s+property="article:modified_time"\s*\/?>)/g, `$1${dateIso}$2`);

const addTocItem=(html,id,label)=>{
  if(html.includes(`href="#${id}"`)) return html;
  const end='</ol></nav>';
  const i=html.indexOf(end);
  if(i<0) throw new Error(`TOC end missing for ${id}`);
  return html.slice(0,i)+`<li><a href="#${id}">${label}</a></li>`+html.slice(i);
};

// 1. Program selection: remove a volatile banner-like rate and turn it into an evidence workflow.
{
  const file=`${root}/guides/choose-program/index.html`;
  let html=fs.readFileSync(file,'utf8');
  const re=/<section class="partner-specific-box logic-section-v103 logic-warning-v103"><span>Практический пример<\/span><h2 id="сравнивай-программу-не-по-баннерной-ставке-а-по-соглашению">[\s\S]*?<\/section>/;
  const replacement=`<section class="partner-specific-box logic-section-v103 logic-warning-v103"><span>Практический пример</span><h2 id="сравнивай-программу-не-по-баннерной-ставке-а-по-соглашению"><span class="logic-index-v103">02</span>Сравнивайте программу не по баннерной ставке, а по текущему соглашению</h2><p>Процент RevShare, CPA, холд, минимальная выплата, квалификация и ограничения по источникам могут меняться. Поэтому в сравнительную таблицу переносите не рекламную цифру с баннера, а условия, которые сейчас опубликованы в кабинете или соглашении и относятся именно к вашему GEO и источнику.</p><table><tr><th>Что сохранить</th><th>Зачем</th></tr><tr><td>Дата проверки</td><td>Чтобы через месяц было видно, насколько свежим было условие на момент запуска.</td></tr><tr><td>Страница правил или скрин кабинета</td><td>Чтобы отличить опубликованное условие от пересказа в обзоре.</td></tr><tr><td>Письменный ответ менеджера</td><td>Чтобы зафиксировать трактовку спорного пункта для конкретного источника и GEO.</td></tr><tr><td>Версия, с которой запущен трафик</td><td>Чтобы не смешивать результаты до и после изменения условий.</td></tr></table><a href="/guides/partner-program-rules/">Разобрать, как проверять правила программы</a></section>`;
  if(!re.test(html)) throw new Error('choose-program volatile example not found');
  html=html.replace(re,replacement);
  if(/50%\s*GGR/i.test(html)) throw new Error('Hardcoded 50% GGR remains in choose-program');
  html=updateDates(html);
  fs.writeFileSync(file,html);
}

// 2. Tracking: fix grammar and add an end-to-end acceptance test that is independent of any specific tracker UI.
{
  const file=`${root}/guides/tracking/index.html`;
  let html=fs.readFileSync(file,'utf8');
  html=html
    .replace('Click ID - уникальный идентификатор перехода. трекер создаёт его', 'Click ID - уникальный идентификатор перехода. Трекер создаёт его')
    .replace('к специальному URL трекер и передаёт туда Click ID', 'к специальному URL трекера и передаёт туда Click ID')
    .replace('Если нет SubID или постбэк,', 'Если нет SubID или постбэка,')
    .replace('постбэк, ваш трекер', 'постбэк → ваш трекер');
  if(!html.includes('id="tracking-acceptance"')){
    const section=`<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="tracking-acceptance"><span class="logic-index-v103">06</span>Контрольный тест до живого трафика</h2><p>До запуска объёма пройдите одну цепочку вручную с заранее известными метками. Цель не в том, чтобы увидеть красивый отчёт, а в том, чтобы доказать: каждый идентификатор дошёл до следующей системы и вернулся к тому же клику.</p><ol><li>Создайте контрольный переход с понятной UTM-меткой и отдельным SubID.</li><li>Если трафик идёт через свой сайт, проверьте, что веб-аналитика увидела нужную UTM, а переход дальше не потерял партнёрскую метку.</li><li>В партнёрском кабинете найдите контрольный клик по SubID или другому поддерживаемому параметру.</li><li>Если используется трекер, сохраните созданный им Click ID и убедитесь, что он передан дальше именно в том поле, которое требует конкретная платформа.</li><li>Если программа позволяет тестовую конверсию или тест постбэка, отправьте её и проверьте, что событие вернулось к тому же Click ID и правильному типу конверсии.</li><li>Сохраните время, URL, значения меток и скрин результата. Это станет контрольной точкой, если после запуска статистика начнёт расходиться.</li></ol><div class="inline-note"><strong>Имена параметров не универсальны.</strong> Не копируйте название макроса из чужой инструкции наугад: сверяйте документацию именно той партнёрской платформы и трекера, которые используются в связке.</div></section>`;
    html=insertBeforeBodyEnd(html,section);
  }
  html=addTocItem(html,'tracking-acceptance','Контрольный тест до живого трафика');
  html=updateDates(html);
  fs.writeFileSync(file,html);
}

// 3. Content sites: turn generic “keep articles updated” advice into a reproducible inventory and update trigger.
{
  const file=`${root}/guides/content-sites/index.html`;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('id="content-inventory"')){
    const section=`<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="content-inventory"><span class="logic-index-v103">07</span>Ведите простой реестр материалов</h2><p>После нескольких десятков страниц память перестаёт быть системой. Достаточно одной таблицы, где для каждой статьи записано, какой вопрос она решает, когда проверялись факты и что должно стать поводом для следующего пересмотра.</p><table><tr><th>Поле</th><th>Что записывать</th></tr><tr><td>URL и основной вопрос</td><td>Чтобы две страницы случайно не начали отвечать на один и тот же запрос пользователя.</td></tr><tr><td>Дата проверки фактов</td><td>Когда в последний раз сверялись правила, интерфейсы, условия программы или другие изменяемые сведения.</td></tr><tr><td>Критичный источник</td><td>Ссылка или документ, от которого зависит конкретное утверждение.</td></tr><tr><td>Внутренние переходы</td><td>Какая страница ведёт сюда и куда читатель должен идти дальше.</td></tr><tr><td>Сигнал для пересмотра</td><td>Изменение продукта, правил, интерфейса, поискового интента, сломанная ссылка или фактическая ошибка.</td></tr></table><p>Падение показов или кликов само по себе не доказывает, что текст устарел. Это повод открыть страницу и проверить спрос, интент, сниппет, конкурирующие материалы и техническое состояние, а не автоматически переписывать статью.</p><div class="inline-note"><strong>Обновляйте по причине, а не по календарю.</strong> Для стабильного справочного материала дата публикации не важнее точности. А вот условия оффера, правила площадки и интерфейсы нужно пересматривать всякий раз, когда меняется источник этих данных.</div></section>`;
    html=insertBeforeBodyEnd(html,section);
  }
  html=addTocItem(html,'content-inventory','Реестр материалов и обновления');
  html=updateDates(html);
  fs.writeFileSync(file,html);
}

const between=(s,start,end)=>{const a=s.indexOf(start),b=s.indexOf(end);if(a<0||b<0||b<=a)throw new Error('CMS markers missing');return s.slice(a+start.length,b)};
const wordCount=html=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-zA-Z#0-9]+;/g,' ').trim().split(/\s+/).filter(Boolean).length;
const slugs=['choose-program','tracking','content-sites'];
const catalogPath=`${root}/content/articles.json`;
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
for(const slug of slugs){
  const html=fs.readFileSync(`${root}/guides/${slug}/index.html`,'utf8');
  const item=catalog.articles.find(x=>x.id===`guides--${slug}`);
  if(!item) throw new Error(`Catalog item missing: ${slug}`);
  const body=between(html,'<!-- TL-CMS:ARTICLE_BODY_START -->','<!-- TL-CMS:ARTICLE_BODY_END -->');
  item.readTime=`${Math.max(3,Math.ceil(wordCount(body)/190))} мин`;
  item.date=dateRu;
}
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');

let sitemap=fs.readFileSync(`${root}/sitemap.xml`,'utf8');
for(const slug of slugs){
  const url=`https://traff-lab.com/guides/${slug}/`;
  const esc=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  sitemap=sitemap.replace(new RegExp(`(<loc>${esc}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`),`$1${dateIso}$2`);
}
fs.writeFileSync(`${root}/sitemap.xml`,sitemap);
console.log('Quality batch 5 applied');
