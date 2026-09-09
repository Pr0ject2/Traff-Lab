import fs from 'node:fs';

const DATE='2026-09-09';
const DISPLAY='09.09.2026';
const must=(c,m)=>{if(!c)throw new Error(m)};
const read=f=>fs.readFileSync(f,'utf8');
const write=(f,s)=>fs.writeFileSync(f,s);

function updateDates(html){
  return html
    .replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/g,`"dateModified":"${DATE}"`)
    .replace(/(<meta[^>]+(?:property|name)=["']article:modified_time["'][^>]+content=["'])\d{4}-\d{2}-\d{2}(["'])/gi,`$1${DATE}$2`)
    .replace(/(<meta[^>]+content=["'])\d{4}-\d{2}-\d{2}(["'][^>]+(?:property|name)=["']article:modified_time["'])/gi,`$1${DATE}$2`)
    .replace(/Обновлено:\s*<b>[^<]+<\/b>/g,`Обновлено: <b>${DISPLAY}</b>`);
}

function enrich(file, firstId, block, tocItems, replacements=[]){
  let html=read(file);
  must(!html.includes(`id="${firstId}"`),`${file}: already enriched`);
  const end='<!-- TL-CMS:ARTICLE_BODY_END -->';
  must(html.includes(end),`${file}: body end missing`);
  html=html.replace(end,`${block}\n${end}`);

  const tocEnd='</ol></nav><div class="aside-block';
  const tocEndPos=html.indexOf(tocEnd);
  must(tocEndPos>=0,`${file}: toc end missing`);
  const olStart=html.lastIndexOf('<ol>',tocEndPos);
  const lastItem=html.lastIndexOf('<li>',tocEndPos);
  must(olStart>=0&&lastItem>olStart,`${file}: toc list missing`);
  html=html.slice(0,lastItem)+tocItems+html.slice(lastItem);

  for(const [before,after,label] of replacements){
    must(html.includes(before),`${file}: missing replacement ${label}`);
    html=html.replace(before,after);
  }
  html=updateDates(html);
  write(file,html);
}

enrich(
  'public/guides/traffic-quality/index.html',
  'quality-diagnosis',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="quality-diagnosis"><span class="logic-index-v103">06</span>Как локализовать проблему качества по воронке</h2>
<p>«Плохое качество» слишком общее объяснение. Сначала определите, на каком участке источник отличается от своей обычной базы или от сопоставимой когорты.</p>
<table><thead><tr><th>Сигнал</th><th>Что проверить первым</th><th>Чего пока не заключать</th></tr></thead><tbody>
<tr><td>Кликов много, регистраций мало</td><td>GEO, соответствие обещания посадочной странице, мобильный путь и случайные переходы.</td><td>Что проблема обязательно в платёжеспособности аудитории.</td></tr>
<tr><td>Регистрации есть, FTD заметно слабее</td><td>Платежи, квалификацию FTD, продукт и соответствие аудитории офферу.</td><td>Что источник нужно отключить только по верхней конверсии.</td></tr>
<tr><td>FTD есть, но растут отклонения</td><td>Причины отклонения по статусам, дублям, GEO и правилам конкретного оффера.</td><td>Что все отклонения означают фрод.</td></tr>
<tr><td>Первый депозит нормальный, дальнейшая активность слабая</td><td>Когорту, период наблюдения, продукт и источник ожиданий пользователя.</td><td>Что один день достаточно описывает ценность RevShare-трафика.</td></tr>
</tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="quality-evidence"><span class="logic-index-v103">07</span>Что собрать, если программа спорит с качеством трафика</h2>
<p>Полезнее спорить не общими словами, а одной воспроизводимой выборкой. Сохраните источник, GEO, период, кампанию/SubID, число кликов, регистраций, подтверждённых и отклонённых FTD, а также причины статусов, если кабинет их показывает.</p>
<ul><li>сравнивайте одинаковые временные окна;</li><li>не смешивайте разные GEO и источники в одну когорту;</li><li>отделяйте техническое расхождение статистики от оценки качества;</li><li>если правило программы неоднозначно, приложите сохранённое подтверждение менеджера.</li></ul>
<div class="inline-note"><strong>Рабочий вывод:</strong> качество — это наблюдаемое поведение конкретной когорты плюс соответствие правилам. Оно не доказывается одной метрикой и не должно сводиться к субъективной оценке источника.</div>
</section>`,
  '<li><a href="#quality-diagnosis">Как локализовать проблему качества</a></li><li><a href="#quality-evidence">Что собрать при споре о качестве</a></li>'
);

enrich(
  'public/guides/tracker-for-beginner/index.html',
  'tracker-decision',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="tracker-decision"><span class="logic-index-v103">06</span>Решение по задаче: нужен трекер сейчас или нет</h2>
<table><thead><tr><th>Ситуация</th><th>Минимальный рабочий учёт</th><th>Нужен отдельный трекер?</th></tr></thead><tbody>
<tr><td>Один источник, один оффер, несколько публикаций</td><td>Отдельный SubID на каждую публикацию + партнёрский кабинет.</td><td>Не обязательно, если этих данных хватает для решения.</td></tr>
<tr><td>Несколько источников или лендингов</td><td>Единая схема названий и раздельные метки.</td><td>Уже полезен, если приходится вручную сводить системы.</td></tr>
<tr><td>Нужно связать расход, клик и конверсию</td><td>Click ID, стоимость и возврат событий.</td><td>Обычно да: ручная сверка быстро становится ненадёжной.</td></tr>
<tr><td>Нужна маршрутизация и несколько офферов</td><td>Контролируемые правила маршрута и отдельная статистика вариантов.</td><td>Да, если задача разрешена правилами источника и оффера.</td></tr>
</tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="tracker-migration"><span class="logic-index-v103">07</span>Как подключить трекер и не потерять старую базу сравнения</h2>
<ol><li>Зафиксируйте текущую схему SubID и отчёт за контрольный период.</li><li>Создайте одну тестовую кампанию в трекере, не меняя одновременно GEO, оффер и креатив.</li><li>Сделайте ручной тестовый клик и проверьте, что исходная метка сохранилась.</li><li>Если программа поддерживает возврат события, проверьте тестовую конверсию и Click ID.</li><li>Сверьте клики за одинаковый короткий период между источником, трекером и партнёрским кабинетом.</li><li>Только после этого переносите остальные кампании.</li></ol>
<p>Так вы отделяете ошибку миграции от изменения качества трафика. Пошаговая реализация этой цепочки есть в <a href="/guides/adsbridge-campaign/">инструкции AdsBridge</a>.</p>
</section>`,
  '<li><a href="#tracker-decision">Нужен ли трекер именно сейчас</a></li><li><a href="#tracker-migration">Как подключить без потери базы</a></li>',
  [
    ['<p>трекер собирает переходы','<p>Трекер собирает переходы','capitalization'],
    ['без отдельного трекер можно проверить','без отдельного трекера можно проверить','related grammar']
  ]
);

enrich(
  'public/guides/offer/index.html',
  'offer-passport',
  `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="offer-passport"><span class="logic-index-v103">05</span>Паспорт оффера перед первым кликом</h2>
<p>Чтобы условия не превращались в набор скриншотов из разных мест, сохраните одну карточку запуска. Она должна отвечать на вопросы, которые реально влияют на зачёт и экономику.</p>
<table><thead><tr><th>Поле</th><th>Что записать</th></tr></thead><tbody>
<tr><td>Оффер и модель</td><td>Название/ID, CPA/RS/гибрид и дата проверки.</td></tr>
<tr><td>GEO</td><td>Конкретную страну, не общий регион.</td></tr>
<tr><td>Квалификация</td><td>Какое действие считается оплачиваемым и какие условия должны быть выполнены.</td></tr>
<tr><td>Источник и формат</td><td>Разрешённый канал, тип размещения и брендовые ограничения.</td></tr>
<tr><td>Атрибуция</td><td>Какие метки или Click ID доступны и как возвращается событие.</td></tr>
<tr><td>Выплаты</td><td>Текущий график, минимум, холд и способ вывода из вашего кабинета.</td></tr>
<tr><td>Подтверждение</td><td>Ссылка на правила или сохранённый ответ менеджера для неоднозначных пунктов.</td></tr>
</tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="offer-compare"><span class="logic-index-v103">06</span>Как сравнить офферы до накопления статистики</h2>
<p>До реального теста нельзя честно знать будущую конверсию. Поэтому предварительное сравнение должно отделять известные условия от предположений.</p>
<ul><li><b>Известно:</b> GEO, правила источника, модель выплаты, квалификация, трекинг и текущие условия кабинета.</li><li><b>Нужно проверить тестом:</b> CTR, регистрация, FTD, стоимость результата и дальнейшая активность.</li><li><b>Нельзя считать преимуществом без данных:</b> обещание «лучше конвертит», рекламный размер ставки или чужой результат без сопоставимого источника.</li></ul>
<div class="inline-note"><strong>Практика:</strong> выберите оффер, который проходит обязательные ограничения, а затем проверяйте спорные преимущества одинаковым тестом. После запуска сравнение продолжается уже по <a href="/guides/metrics/">метрикам собственной воронки</a>.</div>
</section>`,
  '<li><a href="#offer-passport">Паспорт оффера перед запуском</a></li><li><a href="#offer-compare">Как сравнить офферы до теста</a></li>',
  [['Разобраться с географией оффер</b>','Разобраться с географией оффера</b>','related grammar']]
);

enrich(
  'public/guides/landing-page/index.html',
  'landing-hypothesis',
  `<section class="academy-content-section logic-section-v103 logic-analysis-v103"><h2 id="landing-hypothesis"><span class="logic-index-v103">06</span>Как проверить, что лендинг действительно нужен</h2>
<p>Формулируйте пользу страницы как конкретную гипотезу: «без своего экрана пользователь не понимает X, а лендинг отвечает на X до перехода». Если X невозможно назвать, есть риск, что страница существует просто по привычке.</p>
<table><thead><tr><th>Гипотеза</th><th>Что измерять</th><th>Интерпретация</th></tr></thead><tbody>
<tr><td>Лендинг лучше объясняет выбор</td><td>Переход дальше + регистрация/FTD по отдельной метке.</td><td>Высокий CTR кнопки сам по себе не доказывает улучшение итоговой воронки.</td></tr>
<tr><td>Лендинг фильтрует неподходящую аудиторию</td><td>Меньше внешних кликов, но выше качество после перехода.</td><td>Падение числа кликов может быть нормальным, если улучшается нужное действие.</td></tr>
<tr><td>Прямой путь короче и понятнее</td><td>Сравнение прямой ссылки и страницы на сопоставимом трафике.</td><td>Если нижняя воронка не выигрывает, лишний экран не оправдан.</td></tr>
</tbody></table>
</section>
<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="landing-diagnosis"><span class="logic-index-v103">07</span>Где искать потерю после добавления страницы</h2>
<ol><li>Сверьте число входов на лендинг с кликами источника.</li><li>Проверьте мобильную загрузку и основную кнопку на реальном устройстве.</li><li>Сравните переходы дальше по отдельной версии/метке.</li><li>Смотрите не только CTR кнопки, но регистрацию и FTD после неё.</li><li>Если новый экран ухудшил нижнюю воронку, верните контрольный прямой маршрут и меняйте одну гипотезу за раз.</li></ol>
<div class="inline-note"><strong>Контроль:</strong> A/B-маршрутизация полезна только когда варианты разрешены правилами площадки и показывают пользователю честное содержание. Она не должна использоваться для сокрытия запрещённой страницы от модерации.</div>
</section>`,
  '<li><a href="#landing-hypothesis">Как проверить необходимость лендинга</a></li><li><a href="#landing-diagnosis">Где искать потерю после добавления</a></li>'
);

const catalogPath='public/content/articles.json';
const data=JSON.parse(read(catalogPath));
const ids=new Set(['guides--traffic-quality','guides--tracker-for-beginner','guides--offer','guides--landing-page']);
for(const a of data.articles){
  if(ids.has(a.id)) a.date=DISPLAY;
}
write(catalogPath,JSON.stringify(data,null,2)+'\n');

let sitemap=read('public/sitemap.xml');
for(const url of ['/guides/traffic-quality/','/guides/tracker-for-beginner/','/guides/offer/','/guides/landing-page/']){
  const escaped=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`(<loc>https://traff-lab\\.com${escaped}<\\/loc><lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod>)`);
  must(re.test(sitemap),`sitemap entry missing ${url}`);
  sitemap=sitemap.replace(re,`$1${DATE}$2`);
}
write('public/sitemap.xml',sitemap);

console.log('Quality batch 3 applied');
