import fs from 'node:fs';

const root = 'public';
const dateIso = '2026-09-09';
const dateRu = '09.09.2026';

const targets = [
  {
    file: 'guides/clicks-no-registrations/index.html',
    id: 'clicks-control-sample',
    toc: 'Контрольная выборка перед изменениями',
    section: `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="clicks-control-sample"><span class="logic-index-v103">07</span>Соберите контрольную выборку перед изменениями</h2>
<p>До смены креатива, лендинга или оффера сохраните небольшой участок данных, на котором проблема видна. Иначе после правки будет непонятно, что именно изменило результат. Контрольная выборка должна относиться к одному источнику, одному GEO и одному маршруту.</p>
<table><tr><th>Что сохранить</th><th>Зачем</th></tr><tr><td>Период и источник</td><td>Чтобы не смешать разные кампании и дни.</td></tr><tr><td>Количество переходов до вашей страницы и кликов дальше</td><td>Чтобы увидеть, на каком шаге начинается потеря.</td></tr><tr><td>Устройство и GEO</td><td>Чтобы воспроизвести тот же пользовательский путь.</td></tr><tr><td>Конечный URL и SubID</td><td>Чтобы проверить, что переход попал в нужную связку.</td></tr><tr><td>Скрин или запись ошибки</td><td>Чтобы техническая проблема не превратилась в спор по памяти.</td></tr></table>
<div class="inline-note"><strong>Меняйте одну крупную переменную за раз.</strong> Если одновременно заменить креатив, страницу и оффер, даже улучшение результата ничего не скажет о причине.</div>
</section>`
  },
  {
    file: 'guides/registrations-no-ftd/index.html',
    id: 'ftd-cohort-window',
    toc: 'Одинаковое окно для когорт',
    section: `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="ftd-cohort-window"><span class="logic-index-v103">07</span>Сравнивайте когорты с одинаковым окном</h2>
<p>Если одна группа регистраций наблюдалась семь дней, а другая только сутки, их долю FTD нельзя сравнивать напрямую. Зафиксируйте дату привлечения и одинаковое окно наблюдения: например, считайте результат каждой когорты через одинаковое число дней после регистрации.</p>
<table><tr><th>Проверка</th><th>Что она исключает</th></tr><tr><td>Одинаковое окно после регистрации</td><td>Ложное падение из-за того, что новая когорта ещё не успела внести депозит.</td></tr><tr><td>Один GEO и платёжный набор</td><td>Смешивание аудиторий с разной доступностью способов оплаты.</td></tr><tr><td>Один источник или отдельные метки</td><td>Ситуацию, когда сильный канал скрывает слабый.</td></tr><tr><td>Статус FTD, а не только факт пополнения</td><td>Ошибочный подсчёт событий, которые программа ещё не квалифицировала.</td></tr></table>
<p>Если после такой нормализации разрыв сохраняется, уже имеет смысл сравнивать качество аудитории, обещание креатива и путь от регистрации до кассы. До этого вывод «источник не конвертит в депозит» слишком ранний.</p>
</section>`
  },
  {
    file: 'guides/statistics-mismatch/index.html',
    id: 'reconciliation-log',
    toc: 'Журнал сверки одного события',
    section: `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="reconciliation-log"><span class="logic-index-v103">07</span>Сделайте журнал сверки одного события</h2>
<p>Когда цифры расходятся, полезнее разобрать один конкретный переход, чем спорить о месячных итогах. Запишите одну цепочку от клика до итогового статуса и сохраните значения до изменения настроек.</p>
<table><tr><th>Поле</th><th>Что записать</th></tr><tr><td>Время события</td><td>Фактическое время и часовой пояс каждой системы.</td></tr><tr><td>Источник и SubID</td><td>Метка, по которой событие можно найти в отчётах.</td></tr><tr><td>Click ID</td><td>Общий идентификатор, если он передаётся по маршруту.</td></tr><tr><td>Статус в партнёрке</td><td>Регистрация, FTD, pending, approved, rejected или другой реальный статус кабинета.</td></tr><tr><td>Статус в трекере</td><td>Пришёл ли постбэк и с каким событием.</td></tr><tr><td>Изменения между системами</td><td>Редирект, обрезанный параметр, другой URL или ручная корректировка.</td></tr></table>
<p>Если одно событие проходит корректно, а агрегаты всё равно расходятся, проблема, скорее всего, в правилах подсчёта, периоде или уникальности. Если ломается уже одна цепочка, сначала чините передачу данных и только потом сравнивайте объёмы.</p>
</section>`
  },
  {
    file: 'guides/partner-dashboard/index.html',
    id: 'dashboard-snapshot',
    toc: 'Снимок отчёта перед выводом',
    section: `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="dashboard-snapshot"><span class="logic-index-v103">06</span>Сохраняйте снимок отчёта перед выводом</h2>
<p>Перед тем как менять период, фильтры или метки, сохраните текущий срез: период, валюту, источник, клики, регистрации, FTD, статусы и начисленный доход. Такой снимок превращает спор «вчера было другое число» в проверяемую сверку.</p>
<table><tr><th>Поле</th><th>Что проверить</th></tr><tr><td>Баланс</td><td>Это начислено, подтверждено или уже доступно к выплате.</td></tr><tr><td>Статусы</td><td>Какие события ещё ожидают подтверждения и какие отклонены.</td></tr><tr><td>Период</td><td>Какая дата и часовой пояс применены к отчёту.</td></tr><tr><td>Валюта</td><td>В какой валюте показаны доход и возможные корректировки.</td></tr><tr><td>Фильтры</td><td>Не скрывают ли они часть источников, ссылок или событий.</td></tr></table>
<div class="inline-note"><strong>Не путайте начисленный доход с доступной выплатой.</strong> Холды, минимальная сумма, график выплат и правила квалификации зависят от конкретной программы и могут меняться. Актуальные условия проверяйте в текущем кабинете или соглашении, а не по старому скриншоту.</div>
</section>`
  }
];

const between = (s, start, end) => {
  const a = s.indexOf(start), b = s.indexOf(end);
  if (a < 0 || b < 0 || b <= a) throw new Error(`Markers missing: ${start} / ${end}`);
  return s.slice(a + start.length, b);
};

const plainWordCount = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-zA-Z#0-9]+;/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;

for (const t of targets) {
  const file = `${root}/${t.file}`;
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes(`id="${t.id}"`)) {
    html = html.replace('\n<!-- TL-CMS:ARTICLE_BODY_END -->', `\n${t.section}\n<!-- TL-CMS:ARTICLE_BODY_END -->`);
    if (!html.includes(`id="${t.id}"`)) throw new Error(`Failed to add ${t.id}`);
  }

  if (!html.includes(`href="#${t.id}"`)) {
    html = html.replace(/(<ol>[\s\S]*?)(<li><a href="#куда-дальше">)/, `$1<li><a href="#${t.id}">${t.toc}</a></li>$2`);
    if (!html.includes(`href="#${t.id}"`)) {
      html = html.replace(/(<\/ol><\/nav>)/, `<li><a href="#${t.id}">${t.toc}</a></li>$1`);
    }
  }

  html = html.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g, `"dateModified":"${dateIso}"`)
             .replace(/<meta property="article:modified_time" content="\d{4}-\d{2}-\d{2}">/g, `<meta property="article:modified_time" content="${dateIso}">`);

  if (t.file.includes('statistics-mismatch')) {
    html = html.replaceAll('сайта и трекер:', 'сайта и трекера:')
               .replaceAll('сайта и трекер: период', 'сайта и трекера: период')
               .replaceAll('изменения ссылки, трекер или кампании', 'изменения ссылки, трекера или кампании');
  }

  if (t.file.includes('partner-dashboard')) {
    html = html.replace(/<section class="partner-specific-box[\s\S]*?<\/section>\s*<!-- TL-CMS:ARTICLE_BODY_END -->/, '<!-- TL-CMS:ARTICLE_BODY_END -->');
  }

  fs.writeFileSync(file, html);
}

const catalogPath = `${root}/content/articles.json`;
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const t of targets) {
  const html = fs.readFileSync(`${root}/${t.file}`, 'utf8');
  const id = `guides--${t.file.split('/')[1]}`;
  const item = catalog.articles.find(x => x.id === id);
  if (!item) throw new Error(`Catalog item missing: ${id}`);
  const body = between(html, '<!-- TL-CMS:ARTICLE_BODY_START -->', '<!-- TL-CMS:ARTICLE_BODY_END -->');
  const minutes = Math.max(3, Math.ceil(plainWordCount(body) / 190));
  item.readTime = `${minutes} мин`;
  item.date = dateRu;
  if (id === 'guides--statistics-mismatch') item.description = item.description.replace('сайта и трекер:', 'сайта и трекера:');
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const sitemapPath = `${root}/sitemap.xml`;
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
for (const t of targets) {
  const slug = t.file.split('/')[1];
  const url = `https://traff-lab.com/guides/${slug}/`;
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<loc>${escaped}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  sitemap = sitemap.replace(re, `$1${dateIso}$2`);
}
fs.writeFileSync(sitemapPath, sitemap);

console.log('Quality batch 4 applied');
