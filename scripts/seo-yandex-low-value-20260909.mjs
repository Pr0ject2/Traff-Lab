import fs from 'node:fs';

const TODAY_ISO = '2026-09-09';
const TODAY_RU = '09.09.2026';

const targets = {
  adsbridge: {
    path: 'public/guides/adsbridge-campaign/index.html',
    url: '/guides/adsbridge-campaign/',
    canonical: 'https://traff-lab.com/guides/adsbridge-campaign/',
    titleTag: 'AdsBridge: первая кампания и проверка трекинга | TrafficLab',
    pageTitle: 'AdsBridge: первая кампания от клика до тестовой конверсии',
    description: 'Практическая настройка первой кампании AdsBridge: источник, SubID, Click ID, оффер, постбэк и контрольная проверка от тестового клика до конверсии.',
    lead: 'Соберите в AdsBridge один проверяемый путь: источник → кампания → лендинг или оффер → конверсия. Здесь важна не теория трекинга, а конкретный результат: после тестового клика видно, откуда пришёл переход, куда он ушёл и вернулась ли конверсия.',
  },
  partner: {
    path: 'public/guides/partner-program-rules/index.html',
    url: '/guides/partner-program-rules/',
    canonical: 'https://traff-lab.com/guides/partner-program-rules/',
    titleTag: 'Правила партнёрской программы: что проверить до запуска | TrafficLab',
    pageTitle: 'Правила партнёрской программы: что проверить до запуска трафика',
    description: 'Как проверить правила партнёрской программы перед трафиком: GEO, разрешённые источники, RevShare/CPA, выплаты, брендовые ограничения, проверки и подтверждения условий.',
    lead: 'Эта страница не выбирает партнёрскую программу за вас. Она нужна после выбора: выписать условия конкретной программы, подтвердить GEO и источник, зафиксировать модель выплаты и сохранить доказательства согласований до первого клика.',
  },
  paid: {
    path: 'public/traffic/sources/paid/index.html',
    url: '/traffic/sources/paid/',
    canonical: 'https://traff-lab.com/traffic/sources/paid/',
    titleTag: 'Платный трафик как источник: запуск и диагностика | TrafficLab',
    pageTitle: 'Платный трафик как источник: запуск, диагностика и масштабирование',
    description: 'Практический playbook платного трафика: правила площадки, структура кампании, трекинг, лимит расхода, диагностика воронки и решение остановить или масштабировать тест.',
    lead: 'Эта страница про платный трафик как рабочий источник целиком: от допуска площадки и структуры кампании до диагностики воронки и масштабирования. Первый тест должен отвечать на один вопрос и оставлять данные, по которым понятно, что делать дальше.',
  },
  youtube: {
    path: 'public/traffic/sources/youtube/index.html',
    url: '/traffic/sources/youtube/',
    canonical: 'https://traff-lab.com/traffic/sources/youtube/',
    titleTag: 'YouTube как источник трафика: канал и первый тест | TrafficLab',
    pageTitle: 'YouTube как источник трафика: канал, длинные видео и первый тест',
    description: 'Практика длинного YouTube как источника трафика: выбор формата, серия роликов, поиск и рекомендации, разметка ссылок и анализ пути до регистраций и FTD.',
    lead: 'Здесь YouTube разбирается именно как источник: как собрать канал вокруг одного формата, получить трафик из поиска и рекомендаций, разметить каждый выпуск и оценивать серию роликов по пути до регистраций и FTD.',
  },
};

function mustReplace(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`Missing marker: ${label}`);
  return text.replace(before, after);
}

function replaceTag(text, pattern, value, label) {
  if (!pattern.test(text)) throw new Error(`Missing tag: ${label}`);
  return text.replace(pattern, value);
}

function updateStructuredData(html, target) {
  const pattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing JSON-LD in ${target.path}`);
  const data = JSON.parse(match[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  for (const item of graph) {
    if (item['@type'] === 'WebPage' && item.url === target.canonical) {
      item.name = target.pageTitle;
      item.description = target.description;
    }
    if (item['@type'] === 'Article' && item.url === target.canonical) {
      item.headline = target.pageTitle;
      item.name = target.pageTitle;
      item.description = target.description;
      item.dateModified = TODAY_ISO;
    }
    if (item['@type'] === 'BreadcrumbList' && Array.isArray(item.itemListElement)) {
      const last = item.itemListElement.at(-1);
      if (last?.item === target.canonical) last.name = target.pageTitle;
    }
  }
  return html.replace(pattern, `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

function updateHeadAndHero(html, target) {
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${target.titleTag}</title>`, `${target.path} title`);
  html = replaceTag(html, /<meta content="[^"]*" name="description"\s*\/>/, `<meta content="${target.description}" name="description"/>`, `${target.path} description`);
  html = replaceTag(html, /<meta content="[^"]*" property="og:title"\s*\/>/, `<meta content="${target.pageTitle}" property="og:title"/>`, `${target.path} og:title`);
  html = replaceTag(html, /<meta content="[^"]*" property="og:description"\s*\/>/, `<meta content="${target.description}" property="og:description"/>`, `${target.path} og:description`);
  html = replaceTag(html, /<meta content="[^"]*" name="twitter:title"\s*\/>/, `<meta content="${target.pageTitle}" name="twitter:title"/>`, `${target.path} twitter:title`);
  html = replaceTag(html, /<meta content="[^"]*" name="twitter:description"\s*\/>/, `<meta content="${target.description}" name="twitter:description"/>`, `${target.path} twitter:description`);
  html = updateStructuredData(html, target);
  html = html.replace(/<meta content="\d{4}-\d{2}-\d{2}" property="article:modified_time"\s*\/>/, `<meta content="${TODAY_ISO}" property="article:modified_time"/>`);
  html = html.replace(/<meta property="article:modified_time" content="\d{4}-\d{2}-\d{2}"\s*>/, `<meta property="article:modified_time" content="${TODAY_ISO}">`);
  html = replaceTag(html, /<h1>[\s\S]*?<\/h1>/, `<h1>${target.pageTitle}</h1>`, `${target.path} h1`);
  html = html.replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">${target.lead}</p>`);
  html = html.replace(/обновлено \d{2}\.\d{2}\.\d{4}/i, `обновлено ${TODAY_RU}`);
  html = html.replace(/Обновлено: <b>\d{2}\.\d{2}\.\d{4}<\/b>/, `Обновлено: <b>${TODAY_RU}</b>`);
  return html;
}

function addAdsBridgeValue(html) {
  if (html.includes('id="acceptance-test"')) return html;
  const section = `
<section class="academy-content-section logic-section-v103 logic-action-v103" id="acceptance-test"><h2>Контрольная проверка: что должно появиться после одного тестового клика</h2>
<p>Теорию про UTM, SubID, Click ID и постбэк отдельно разбирает <a href="/guides/tracking/">гайд по трекингу</a>. Здесь критерий проще: перед покупкой или публикацией трафика один тестовый переход должен пройти весь собранный маршрут и оставить проверяемый след.</p>
<table class="rules-table"><thead><tr><th>Проверка</th><th>Что должно быть видно</th><th>Если результата нет</th></tr></thead><tbody>
<tr><td>Клик</td><td>Переход появился в нужной кампании AdsBridge, а не в соседнем тесте.</td><td>Проверь Click URL, домен кампании и выбранный источник.</td></tr>
<tr><td>Метка источника</td><td>В отчёте сохранился ожидаемый SubID или другой параметр, по которому можно узнать площадку и размещение.</td><td>Исправь шаблон ссылки до запуска, иначе происхождение регистраций потом не восстановить.</td></tr>
<tr><td>Маршрут</td><td>По той же ссылке открывается именно нужный лендинг или оффер для выбранного GEO.</td><td>Проверь правила распределения, URL назначения и мобильный путь.</td></tr>
<tr><td>Click ID</td><td>Идентификатор клика передаётся дальше, если он нужен для возврата события.</td><td>Сверь имя параметра на стороне источника, трекера и партнёрской программы.</td></tr>
<tr><td>Конверсия</td><td>Тестовое событие видно в партнёрской статистике, а при настроенном постбэк — и в AdsBridge.</td><td>Сначала сверяй идентификатор клика и постбэк, а не увеличивай объём трафика.</td></tr>
<tr><td>Расход</td><td>Стоимость появляется только по той модели расходов, которую реально передаёт источник или которую вы настроили явно.</td><td>Не оценивай ROI по отчёту, пока расход не совпадает с рекламным кабинетом.</td></tr>
</tbody></table>
<div class="inline-note"><b>Готовность к запуску:</b> тест считается технически собранным, когда по одному переходу можно восстановить источник, маршрут и итоговое событие. Если любой этап неизвестен, увеличение объёма только умножит потерянные данные.</div>
</section>
`;
  return mustReplace(html, '<!-- TL-CMS:ARTICLE_BODY_END -->', `${section}<!-- TL-CMS:ARTICLE_BODY_END -->`, 'AdsBridge body end');
}

function addPartnerValue(html) {
  if (html.includes('id="rules-audit"')) return html;
  const section = `
<section class="academy-content-section logic-section-v103 logic-action-v103" id="rules-audit"><h2>Как читать правила партнёрской программы перед запуском</h2>
<p>Если программа ещё не выбрана, сначала используйте <a href="/guides/choose-program/">гайд по выбору партнёрской программы</a>. Здесь другой этап: программа уже выбрана, и нужно превратить её правила в короткий набор подтверждений, к которому можно вернуться после запуска.</p>
<table class="rules-table"><thead><tr><th>Что проверить</th><th>Где подтвердить</th><th>Что сохранить до трафика</th></tr></thead><tbody>
<tr><td>GEO и модель</td><td>Актуальный кабинет, условия программы или ответ менеджера.</td><td>Дату проверки, страну и модель выплаты: RS/CPA.</td></tr>
<tr><td>Источник трафика</td><td>Правила программы; при неоднозначности — письменное согласование.</td><td>Формулировку разрешения именно для вашего источника и формата.</td></tr>
<tr><td>CPA-кампания</td><td>Индивидуальный оффер и согласование менеджера.</td><td>Условия теста и идентификатор кампании, к которой они относятся.</td></tr>
<tr><td>Выплаты</td><td>Соглашение и текущий кабинет.</td><td>Минимум, график, валюту/метод и дополнительные условия первого вывода.</td></tr>
<tr><td>Брендовые ограничения</td><td>Раздел о торговых марках, ключевых словах, доменах и креативах.</td><td>Список запретов, который можно сверять перед публикацией.</td></tr>
<tr><td>Проверка качества</td><td>Раздел о проверках и удержании выплат.</td><td>SubID и журнал размещений, чтобы происхождение трафика можно было показать.</td></tr>
</tbody></table>
<div class="inline-note"><b>Про цифры ниже:</b> они показывают конкретный пример условий на дату обновления страницы. Для реального запуска приоритет у актуальных данных кабинета, соглашения и подтверждения менеджера. Список GEO сам по себе не означает юридическое разрешение рекламы.</div>
</section>
`;
  return mustReplace(html, '<!-- TL-CMS:ARTICLE_BODY_START -->', `<!-- TL-CMS:ARTICLE_BODY_START -->${section}`, 'Partner body start');
}

function addPaidValue(html) {
  if (html.includes('id="stop-or-continue"')) return html;
  const section = `
<section class="playbook-decision" id="stop-or-continue"><h2>Когда остановить тест, а когда продолжать</h2>
<p>Универсальной суммы, после которой любой тест становится «достаточным», нет. Решение зависит от того, какой участок воронки уже собрал данные и можно ли им доверять. Сначала отделяйте техническую неисправность от слабой гипотезы.</p>
<ul class="traffic-diagnostic-list">
<li><b>Расход есть, клики или стоимость не сходятся между системами.</b> Остановите увеличение бюджета и сначала восстановите учёт. Без корректного расхода и кликов экономика теста не читается.</li>
<li><b>Клики есть, но до лендинга доходит заметно меньше ожидаемого.</b> Проверяйте скорость, редиректы, мобильную версию, GEO и сам маршрут. Новый креатив эту проблему не исправит.</li>
<li><b>Лендинг получает трафик, регистраций нет.</b> Разбирайте соответствие обещания странице, продукт, GEO и форму регистрации. Не смешивайте это с тестом нового источника.</li>
<li><b>Регистрации есть, FTD нет.</b> Проверяйте платежи, качество аудитории, продукт и ограничения GEO. Дешёвая регистрация ещё не подтверждает качество закупки.</li>
<li><b>FTD появились.</b> Сравнивайте стоимость привлечения с фактически наблюдаемой ценностью пользователей в одном и том же окне. Только после повторяемого результата имеет смысл расширять бюджет или аудиторию.</li>
</ul>
<div class="inline-note"><b>Не путайте с базовым гайдом:</b> <a href="/guides/paid-traffic/">«как задать первый тест»</a> помогает сформулировать лимит и критерий до покупки кликов. Эта страница описывает платный трафик как источник целиком: запуск, диагностику и дальнейшее масштабирование.</div>
</section>
`;
  return mustReplace(html, '<section class="playbook-decision" id="decision">', `${section}<section class="playbook-decision" id="decision">`, 'Paid decision section');
}

function addYoutubeValue(html) {
  if (html.includes('id="youtube-vs-shorts"')) return html;
  const section = `
<section class="guide-v101-section" id="youtube-vs-shorts"><h2>Что здесь относится именно к длинному YouTube</h2>
<p>Эта страница про канал и длинные ролики как самостоятельный источник трафика. Общую методику измерения любого видео — от просмотра до перехода и конверсии — вынесли в <a href="/guides/video-traffic/">отдельный гайд по видео-трафику</a>, чтобы не дублировать её здесь.</p>
<div class="guide-v101-dual">
<div class="guide-v101-verdict good"><h3>Длинные видео</h3><ul><li>могут собирать поиск, главную и рекомендации спустя время после публикации;</li><li>дают больше пространства для темы, сравнения и объяснения продукта;</li><li>логичнее оценивать серией сопоставимых выпусков и повторными срезами.</li></ul></div>
<div><h3>Shorts и короткое видео</h3><ul><li>распределяются прежде всего через короткую ленту и быстрее дают первый сигнал;</li><li>имеют другую механику удержания и перехода;</li><li>их нужно считать отдельным тестом, даже если они выходят на том же канале.</li></ul><p><a href="/traffic/sources/short-video/">Перейти к коротким видео →</a></p></div>
</div>
<div class="guide-v101-callout"><b>Почему разделяем:</b><p>если смешать длинные ролики и Shorts в одной выборке, просмотры и удержание будут несопоставимы, а вывод о качестве YouTube как источника получится шумным.</p></div>
</section>
`;
  return mustReplace(html, '</section>\n<section class="guide-v101-section" id="fit">', `</section>${section}<section class="guide-v101-section" id="fit">`, 'YouTube fit boundary');
}

for (const [key, target] of Object.entries(targets)) {
  let html = fs.readFileSync(target.path, 'utf8');
  html = updateHeadAndHero(html, target);
  if (key === 'adsbridge') html = addAdsBridgeValue(html);
  if (key === 'partner') html = addPartnerValue(html);
  if (key === 'paid') html = addPaidValue(html);
  if (key === 'youtube') html = addYoutubeValue(html);
  if (!html.includes(`href="${target.canonical}" rel="canonical"`)) throw new Error(`Canonical changed/missing: ${target.path}`);
  if (!/name="robots"[^>]*index,follow|content="index,follow[^>]*" name="robots"/.test(html)) throw new Error(`Index robots missing: ${target.path}`);
  fs.writeFileSync(target.path, html);
}

const articlesPath = 'public/content/articles.json';
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
for (const target of Object.values(targets)) {
  const item = articlesData.articles?.find((article) => article.url === target.url);
  if (!item) continue;
  item.title = target.pageTitle;
  item.description = target.description;
  item.lead = target.lead;
  item.date = TODAY_RU;
}
fs.writeFileSync(articlesPath, `${JSON.stringify(articlesData, null, 2)}\n`);

const sitemapPath = 'public/sitemap.xml';
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
for (const target of Object.values(targets)) {
  const escaped = target.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<url><loc>${escaped}<\\/loc><lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod><\\/url>)`);
  if (!re.test(sitemap)) throw new Error(`Sitemap entry missing: ${target.canonical}`);
  sitemap = sitemap.replace(re, `$1${TODAY_ISO}$2`);
}
fs.writeFileSync(sitemapPath, sitemap);

const checks = [
  ['public/guides/adsbridge-campaign/index.html', 'id="acceptance-test"'],
  ['public/guides/partner-program-rules/index.html', 'id="rules-audit"'],
  ['public/traffic/sources/paid/index.html', 'id="stop-or-continue"'],
  ['public/traffic/sources/youtube/index.html', 'id="youtube-vs-shorts"'],
];
for (const [file, marker] of checks) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(marker)) throw new Error(`Verification failed: ${file} lacks ${marker}`);
  const canonicalCount = (html.match(/rel="canonical"/g) || []).length;
  const h1Count = (html.match(/<h1[ >]/g) || []).length;
  if (canonicalCount !== 1) throw new Error(`${file}: expected one canonical, got ${canonicalCount}`);
  if (h1Count !== 1) throw new Error(`${file}: expected one H1, got ${h1Count}`);
}

console.log('Patched and verified four Yandex low-value pages.');
