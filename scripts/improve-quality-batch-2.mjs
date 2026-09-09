import fs from 'node:fs';

const DATE = '2026-09-09';
const DISPLAY_DATE = '09.09.2026';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };

function read(file){ return fs.readFileSync(file, 'utf8'); }
function write(file, text){ fs.writeFileSync(file, text); }

function updateDates(html){
  html = html.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g, `"dateModified":"${DATE}"`);
  html = html.replace(/(<meta[^>]+(?:property|name)=["']article:modified_time["'][^>]+content=["'])\d{4}-\d{2}-\d{2}(["'])/gi, `$1${DATE}$2`);
  html = html.replace(/(<meta[^>]+content=["'])\d{4}-\d{2}-\d{2}(["'][^>]+(?:property|name)=["']article:modified_time["'])/gi, `$1${DATE}$2`);
  html = html.replace(/Обновлено:\s*<b>[^<]+<\/b>/g, `Обновлено: <b>${DISPLAY_DATE}</b>`);
  return html;
}

function enrich(file, id, block, tocNeedle, tocItems){
  let html = read(file);
  must(!html.includes(`id="${id}"`), `${file}: ${id} already exists`);
  const end = '<!-- TL-CMS:ARTICLE_BODY_END -->';
  must(html.includes(end), `${file}: body end marker missing`);
  html = html.replace(end, `${block}\n${end}`);
  must(html.includes(tocNeedle), `${file}: TOC marker missing`);
  html = html.replace(tocNeedle, `${tocItems}${tocNeedle}`);
  html = updateDates(html);
  write(file, html);
}

// FTD: make the glossary page useful for real reconciliation, not only a definition.
enrich(
  'public/guides/ftd/index.html',
  'ftd-reconciliation',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="ftd-reconciliation"><span class="logic-index-v103">05</span>Когда депозит есть, а FTD не засчитан</h2>
<p>Первое пополнение в продукте и квалифицированный FTD в партнёрском отчёте могут оказаться разными событиями. Перед выводом о «пропавшей конверсии» проверьте, какое именно условие программы делает депозит оплачиваемым: новый ли это игрок, подходит ли GEO, выполнена ли минимальная сумма или другой критерий оффера, завершён ли платёж и к какому партнёру система атрибутировала пользователя.</p>
<table><thead><tr><th>Что видно</th><th>Что проверить</th><th>Что сохранить</th></tr></thead><tbody>
<tr><td>Регистрация есть, FTD нет</td><td>Статус платежа и определение квалифицированного FTD в текущем оффере.</td><td>Время регистрации, GEO, SubID/Click ID и статус события.</td></tr>
<tr><td>FTD есть у оператора, но нет в трекере</td><td>Возврат события через постбэк и совпадение идентификатора клика.</td><td>Идентификатор перехода и запись события в партнёрском кабинете.</td></tr>
<tr><td>Событие появилось позже</td><td>Часовой пояс отчётов, задержку обработки и выбранный период.</td><td>Одинаковый диапазон дат в обеих системах.</td></tr>
</tbody></table>
<div class="inline-note"><strong>Важно:</strong> конкретные требования к FTD берутся из условий вашего оффера. Не переносите минимальную сумму или окно атрибуции из чужой программы.</div>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="ftd-check"><span class="logic-index-v103">06</span>Как сверить один спорный FTD</h2>
<ol><li>Найдите исходный клик по SubID или Click ID и зафиксируйте его время.</li><li>Проверьте, что регистрация относится к тому же тесту, GEO и ссылке.</li><li>Сверьте статус первого платежа и квалификационные условия оффера.</li><li>Поставьте одинаковый период и часовой пояс в трекере и партнёрском кабинете.</li><li>Если событие есть только в одной системе, проверьте постбэк и передачу идентификатора.</li><li>Если расхождение осталось, отправьте менеджеру короткий набор фактов, а не общий вопрос «куда пропал депозит».</li></ol>
<p>Для системной сверки нескольких событий используйте <a href="/guides/statistics-mismatch/">гайд по расхождениям статистики</a>.</p>
</section>`,
  '<li><a href="#куда-дальше">',
  '<li><a href="#ftd-reconciliation">Когда депозит есть, а FTD не засчитан</a></li><li><a href="#ftd-check">Как сверить один спорный FTD</a></li>'
);

// Organic/free traffic: add a concrete cost model and decision procedure.
enrich(
  'public/guides/free-traffic/index.html',
  'organic-cost',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="organic-cost"><span class="logic-index-v103">05</span>Как посчитать реальную себестоимость «бесплатного» источника</h2>
<p>Для органики полезно считать не цену клика площадки, а стоимость производства и поддержки источника. Тогда YouTube, SEO, сообщества и собственный инструмент можно сравнивать между собой без иллюзии нулевой цены.</p>
<pre>Себестоимость периода = часы работы × стоимость часа + контент + сервисы + аккаунты + инфраструктура
Себестоимость FTD = себестоимость периода / подтверждённые FTD</pre>
<p>Стоимость часа здесь не обязана быть зарплатой сотрудника. Это ваша внутренняя оценка времени, которая позволяет сравнить два способа получить результат. Если один канал требует сорок часов ручной работы, а другой пять, слово «бесплатный» скрывает важную часть экономики.</p>
<table><thead><tr><th>Расход</th><th>Что включать</th></tr></thead><tbody><tr><td>Производство</td><td>Сценарии, монтаж, тексты, дизайн, публикация и обновления.</td></tr><tr><td>Инфраструктура</td><td>Хостинг, домен, прокси, аккаунты и сервисы, которые нужны именно этому источнику.</td></tr><tr><td>Поддержка</td><td>Модерация, ответы, исправления, переупаковка и обновление старых материалов.</td></tr></tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="organic-decision"><span class="logic-index-v103">06</span>Когда источник продолжать, а когда менять</h2>
<table><thead><tr><th>Сигнал</th><th>Что это означает</th><th>Следующий шаг</th></tr></thead><tbody>
<tr><td>Материалы почти не получают показов</td><td>До воронки ещё не дошли.</td><td>Проверяйте индексацию, распределение контента, тему и регулярность, а не оффер.</td></tr>
<tr><td>Просмотры есть, переходов почти нет</td><td>Контент потребляют, но причина перейти слабая или неуместная.</td><td>Проверьте намерение аудитории, место ссылки и соответствие предложения теме.</td></tr>
<tr><td>Переходы есть, регистраций нет</td><td>Проблема уже ниже источника.</td><td>Разберите GEO, мобильный путь, посадочную страницу и продукт.</td></tr>
<tr><td>FTD появляются повторяемо</td><td>Источник доказал способность приводить результат.</td><td>Сравнивайте себестоимость FTD, время на производство и устойчивость серии, а не только охват.</td></tr>
</tbody></table>
<div class="inline-note"><strong>Правило:</strong> органический канал имеет смысл масштабировать, когда повторяется не только охват, но и путь до измеримого действия при приемлемой для вас себестоимости.</div>
</section>`,
  '<li><a href="#выбрать-канал-под-свои-ограничения">',
  '<li><a href="#organic-cost">Как посчитать реальную себестоимость</a></li><li><a href="#organic-decision">Когда источник продолжать, а когда менять</a></li>'
);

// Metrics: turn formulas into a reproducible worked example and comparison checklist.
enrich(
  'public/guides/metrics/index.html',
  'worked-metrics',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="worked-metrics"><span class="logic-index-v103">06</span>Условный пример: от сырых цифр к решению</h2>
<p>Предположим, за один и тот же период платный тест дал 1 000 кликов, 120 регистраций и 18 FTD. Расход составил 36 000 ₽, а подтверждённый доход за выбранное окно — 54 000 ₽. Это учебные числа, а не ориентир рынка.</p>
<pre>Клик → регистрация = 120 / 1 000 = 12%
Регистрация → FTD = 18 / 120 = 15%
Клик → FTD = 18 / 1 000 = 1,8%
Стоимость FTD = 36 000 / 18 = 2 000 ₽
Доход на клик = 54 000 / 1 000 = 54 ₽</pre>
<p>Теперь видно, какие величины можно сравнивать со вторым тестом. Одной фразы «18 депозитов» недостаточно: без объёма кликов, расхода и одинакового окна дохода невозможно понять эффективность.</p>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="compare-metrics"><span class="logic-index-v103">07</span>Как сравнить два источника без ложного вывода</h2>
<table><thead><tr><th>Перед сравнением</th><th>Почему это важно</th></tr></thead><tbody>
<tr><td>Одинаковый период и окно атрибуции</td><td>Поздние FTD и RevShare не должны попадать только в одну из выборок.</td></tr>
<tr><td>Одинаковое определение события</td><td>Регистрация, FTD и квалифицированный FTD — не взаимозаменяемые показатели.</td></tr>
<tr><td>Одна валюта и полный расход</td><td>Комиссии, сервисы и закупка трафика должны учитываться одинаково.</td></tr>
<tr><td>Достаточный объём данных</td><td>Один FTD на десяти кликах и десять FTD на тысяче кликов нельзя читать одинаково уверенно.</td></tr>
<tr><td>Качество после FTD</td><td>Для RevShare одинаковая стоимость первого депозита ещё не означает одинаковую ценность когорты.</td></tr>
</tbody></table>
<p>Если цифры между системами не совпадают, сначала устраните расхождение через <a href="/guides/statistics-mismatch/">сверку статистики</a>, и только затем сравнивайте эффективность.</p>
</section>`,
  '<li><a href="#посмотреть-что-стоит-за-цифрами">',
  '<li><a href="#worked-metrics">Условный пример расчёта</a></li><li><a href="#compare-metrics">Как сравнить два источника</a></li>'
);

// GGR/NGR: focus the page on reconstructing the actual calculation base.
enrich(
  'public/guides/ggr-ngr/index.html',
  'reconcile-base',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="reconcile-base"><span class="logic-index-v103">05</span>Как восстановить расчётную базу из отчёта</h2>
<p>Если партнёрский кабинет показывает GGR, NGR и комиссию отдельно, не начинайте с процента RevShare. Сначала восстановите переход между двумя базами и выясните, какие строки отчёта уменьшают результат.</p>
<table><thead><tr><th>Поле отчёта</th><th>Что спросить или проверить</th></tr></thead><tbody>
<tr><td>GGR / игровой результат</td><td>Как программа определяет показатель и за какой период он рассчитан.</td></tr>
<tr><td>Бонусы и промо</td><td>Какие бонусные расходы вычитаются из партнёрской базы и в какой момент.</td></tr>
<tr><td>Платёжные и иные комиссии</td><td>Какие комиссии относятся на NGR именно в этой программе.</td></tr>
<tr><td>Корректировки</td><td>Есть ли ручные или отложенные корректировки, которые появляются позже исходного периода.</td></tr>
<tr><td>Итоговая база</td><td>Совпадает ли она с величиной, к которой фактически применён процент RevShare.</td></tr>
</tbody></table>
<p>Если часть вычетов объединена в одну строку, запросите у программы определение этой строки. Без него сравнение двух RevShare-ставок остаётся неполным.</p>
</section>
<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="same-rate"><span class="logic-index-v103">06</span>Почему одинаковый процент может дать разную выплату</h2>
<p>Условный пример: у двух программ за сопоставимый период одинаковый GGR 100 000 ₽ и ставка RevShare 40%. В первой программе после предусмотренных условиями вычетов база равна 90 000 ₽, во второй — 70 000 ₽. Выплата получится 36 000 ₽ и 28 000 ₽ соответственно. Разницу создаёт не процент, а база, к которой он применён.</p>
<div class="inline-note"><strong>Вывод:</strong> для сравнения программ сохраняйте не только ставку, но и определение GGR/NGR, список вычетов, отрицательный перенос и момент фиксации периода.</div>
<p>Дальнейшую механику дохода по времени и когортам разбирает отдельный материал <a href="/guides/revshare/">про RevShare</a>.</p>
</section>`,
  '<li><a href="#связать-расчётную-базу-со-своим-трафиком">',
  '<li><a href="#reconcile-base">Как восстановить расчётную базу</a></li><li><a href="#same-rate">Почему одинаковый процент даёт разный итог</a></li>'
);

// Affiliate manager: add a concrete brief and a way to resolve ambiguous rules.
enrich(
  'public/guides/affiliate-manager/index.html',
  'manager-brief',
  `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="manager-brief"><span class="logic-index-v103">06</span>Минимальный бриф менеджеру до запуска</h2>
<p>Чем точнее вводные, тем полезнее ответ. Перед вопросом о доступности оффера соберите короткий бриф, который привязывает ответ к конкретному запуску:</p>
<ul><li><b>GEO:</b> страна и язык аудитории.</li><li><b>Источник:</b> YouTube, SEO, Telegram, рекламная сеть или другой конкретный канал.</li><li><b>Формат:</b> длинное видео, поисковая страница, пост, баннер и т. п.</li><li><b>Модель:</b> RS, CPA или конкретный оффер из кабинета.</li><li><b>Маршрут:</b> прямой переход, собственный лендинг или другая фактическая схема.</li><li><b>Трекинг:</b> какие SubID/Click ID вы будете сохранять.</li></ul>
<div class="inline-note"><strong>Смысл:</strong> ответ «источник разрешён» без GEO, модели и формата слишком общий. Сохраняйте сообщение, из которого понятно, для какого запуска было дано согласование.</div>
</section>
<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="manager-question"><span class="logic-index-v103">07</span>Как уточнять неоднозначное правило</h2>
<table><thead><tr><th>Слабый вопрос</th><th>Проверяемый вопрос</th><th>Что сохранить</th></tr></thead><tbody>
<tr><td>«Можно YouTube?»</td><td>«Разрешён ли органический long-form YouTube для этого GEO и оффера, включая внешнюю ссылку в описании?»</td><td>Ответ, дату и идентификатор оффера.</td></tr>
<tr><td>«CPA работает?»</td><td>«Какие критерии делают FTD квалифицированным в этой CPA-кампании и требуется ли предварительное согласование креатива?»</td><td>Критерии события и условия теста.</td></tr>
<tr><td>«Почему не засчитали?»</td><td>«Вот Click ID, время, GEO и статус регистрации. Какой критерий события не выполнен?»</td><td>Исходные данные и конкретную причину решения.</td></tr>
</tbody></table>
<p>Если ответ меняет правила запуска, перенесите его в свой журнал теста вместе с датой. Тогда через месяц решение можно восстановить без поиска по переписке.</p>
</section>`,
  '<li><a href="#зафиксировать-ответы-перед-запуском">',
  '<li><a href="#manager-brief">Минимальный бриф менеджеру</a></li><li><a href="#manager-question">Как уточнять неоднозначное правило</a></li>'
);

// Keep catalog metadata aligned with the visible reading time and newly expanded pages.
const catalogPath = 'public/content/articles.json';
const catalog = JSON.parse(read(catalogPath));
const reading = {
  'guides--cpa-vs-revshare': '7 мин',
  'guides--first-ftd': '7 мин',
  'guides--free-traffic': '8 мин',
  'guides--ftd': '6 мин',
  'guides--revshare': '7 мин',
  'guides--statistics': '8 мин',
  'guides--metrics': '4 мин',
  'guides--affiliate-manager': '4 мин',
  'guides--ggr-ngr': '4 мин'
};
const changedIds = new Set(['guides--ftd','guides--free-traffic','guides--metrics','guides--affiliate-manager','guides--ggr-ngr']);
for (const article of catalog.articles) {
  if (reading[article.id]) article.readTime = reading[article.id];
  if (changedIds.has(article.id)) article.date = DISPLAY_DATE;
}
write(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let sitemap = read('public/sitemap.xml');
for (const url of ['/guides/ftd/','/guides/free-traffic/','/guides/metrics/','/guides/affiliate-manager/','/guides/ggr-ngr/']) {
  const re = new RegExp(`(<loc>https://traff-lab\\.com${url.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}<\\/loc><lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod>)`);
  must(re.test(sitemap), `sitemap entry missing for ${url}`);
  sitemap = sitemap.replace(re, `$1${DATE}$2`);
}
write('public/sitemap.xml', sitemap);

console.log('Quality batch 2 applied');
