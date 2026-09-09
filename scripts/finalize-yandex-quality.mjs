import fs from 'node:fs';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const replace = (text, before, after, label) => {
  must(text.includes(before), `Missing marker: ${label}`);
  return text.replace(before, after);
};

const appPath = 'public/assets/app.js';
let app = fs.readFileSync(appPath, 'utf8');
app = replace(
  app,
  '"url":"/guides/adsbridge-campaign/","title":"AdsBridge: первая кампания от клика до тестовой конверсии и проверить трекинг"',
  '"url":"/guides/adsbridge-campaign/","title":"AdsBridge: первая кампания от клика до тестовой конверсии"',
  'AdsBridge ARTICLE_CATALOG title'
);
app = replace(
  app,
  '"url":"/traffic/sources/youtube/","title":"YouTube: длинные видео"',
  '"url":"/traffic/sources/youtube/","title":"YouTube как источник трафика: канал, длинные видео и первый тест"',
  'YouTube ARTICLE_CATALOG title'
);
fs.writeFileSync(appPath, app);

const rulesPath = 'public/guides/partner-program-rules/index.html';
let html = fs.readFileSync(rulesPath, 'utf8');

html = replace(
  html,
  '<div class="inline-note"><b>Про цифры ниже:</b> они показывают конкретный пример условий на дату обновления страницы. Для реального запуска приоритет у актуальных данных кабинета, соглашения и подтверждения менеджера. Список GEO сам по себе не означает юридическое разрешение рекламы.</div>',
  '<div class="inline-note"><b>Источник истины для запуска:</b> актуальный кабинет, действующее соглашение и письменное подтверждение менеджера. Доступность GEO в продукте или кабинете сама по себе не означает, что реклама разрешена местным законодательством или правилами площадки.</div>',
  'stale figures note'
);

const accountStart = '<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="account">';
const modelsStart = '<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="models">';
{
  const s = html.indexOf(accountStart);
  const e = html.indexOf(modelsStart, s);
  must(s >= 0 && e > s, 'account/models boundary');
  const block = `<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="account"><span class="logic-index-v103">01</span>Что зафиксировать ещё до запуска</h2>
<ul class="rules-check-list">
<li><b>Кто и на каких условиях работает с программой.</b> Проверь требования к аккаунту, верификации и допустимому числу кабинетов в актуальном соглашении.</li>
<li><b>Модель выплаты.</b> Зафиксируй RS, CPA или другую модель именно для выбранного оффера, а не по рекламной странице программы.</li>
<li><b>Источник и формат.</b> Отдельно проверь канал трафика, тип креатива, брендовые ограничения и необходимость предварительного согласования.</li>
<li><b>GEO.</b> Сохрани страну, дату проверки и источник подтверждения. Доступность продукта не заменяет проверку рекламных правил и местного законодательства.</li>
<li><b>Выплаты.</b> Выпиши минимум, валюту, метод, холд и дополнительные условия первого вывода из текущего кабинета.</li>
<li><b>Что считается конфиденциальным.</b> Не публикуй условия из кабинета или переписки, если программа относит их к закрытой информации.</li>
</ul>
</section>`;
  html = html.slice(0, s) + block + html.slice(e);
}

const forbiddenStart = '<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="forbidden-methods">';
const sourceStart = '<section class="academy-content-section logic-section-v103 logic-warning-v103"><h2 id="forbidden-sources">';
{
  const s = html.indexOf(forbiddenStart);
  const e = html.indexOf(sourceStart, s);
  must(s >= 0 && e > s, 'forbidden methods boundary');
  const block = `<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="forbidden-methods"><span class="logic-index-v103">03</span>Как разбирать раздел с запрещёнными методами</h2>
<table class="rules-table"><thead><tr><th>Пункт правил</th><th>Как превратить его в проверку</th></tr></thead><tbody>
<tr><td>Мотивированный трафик / вознаграждение пользователю</td><td>Уточни, запрещены ли кэшбэк, бонус за регистрацию или депозит и любые другие стимулы в твоей модели.</td></tr>
<tr><td>Саморегистрация и связанные аккаунты</td><td>Проверь, как программа определяет собственные или связанные регистрации и какие данные использует при проверке.</td></tr>
<tr><td>Cookie stuffing и принудительная атрибуция</td><td>Убедись, что переход и cookie появляются только после реального действия пользователя.</td></tr>
<tr><td>Вводящая в заблуждение реклама</td><td>Сверь обещания в креативе с фактическими бонусами, платежами и условиями продукта.</td></tr>
</tbody></table>
<div class="inline-note"><b>Если формулировка расплывчатая:</b> не додумывай границу запрета сам. Отправь менеджеру конкретный пример размещения и сохрани ответ вместе с датой и идентификатором кампании.</div>
</section>`;
  html = html.slice(0, s) + block + html.slice(e);
}

const checksStart = '<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="checks">';
{
  const s = html.indexOf(sourceStart);
  const e = html.indexOf(checksStart, s);
  must(s >= 0 && e > s, 'forbidden sources boundary');
  const block = `<section class="academy-content-section logic-section-v103 logic-warning-v103"><h2 id="forbidden-sources"><span class="logic-index-v103">04</span>Источники, бренд и креативы: что проверять отдельно</h2>
<ul class="rules-check-list">
<li><b>Брендовый поиск и SEO.</b> Проверь, можно ли использовать название бренда в ключевых словах, домене, заголовках и метаданных.</li>
<li><b>Соцсети, видео, мессенджеры и платная реклама.</b> Не считай разрешение одного канала автоматическим разрешением остальных.</li>
<li><b>Рассылки и уведомления.</b> Уточни требования к собственной базе, согласию пользователя и формату сообщения.</li>
<li><b>Материалы бренда.</b> Проверь, какие логотипы, изображения и формулировки разрешено брать из кабинета и можно ли их изменять.</li>
<li><b>CPA и индивидуальные офферы.</b> Если условия выдаются менеджером, сохрани согласование именно той кампании, которую запускаешь.</li>
</ul>
</section>`;
  html = html.slice(0, s) + block + html.slice(e);
}

const appealStart = '<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="appeal">';
const geoStart = '<section class="geo-directory logic-section-v103 logic-explain-v103" id="geos">';
{
  const s = html.indexOf(appealStart);
  const e = html.indexOf(geoStart, s);
  must(s >= 0 && e > s, 'appeal/geo boundary');
  const block = `<section class="academy-content-section logic-section-v103 logic-explain-v103"><h2 id="appeal"><span class="logic-index-v103">06</span>Если возник спор или проверка</h2>
<p>Используй актуальный канал поддержки, указанный в кабинете или действующем соглашении. В обращение положи не пересказ ситуации, а данные, по которым запуск можно восстановить.</p>
<ul class="rules-check-list"><li>ID аккаунта и кампании;</li><li>период и GEO;</li><li>источник трафика и SubID;</li><li>ссылку на размещение или скрин рекламного кабинета;</li><li>сохранённое согласование менеджера, если оно требовалось;</li><li>конкретный вопрос по отклонённой конверсии, выплате или правилу.</li></ul>
<div class="inline-note"><b>Срок ответа, адрес поддержки и применимое право не переписывай из старых памяток.</b><p>Эти пункты могут меняться вместе с соглашением. Проверяй их в документе, который действует для твоего аккаунта на момент обращения.</p></div>
</section>`;
  html = html.slice(0, s) + block + html.slice(e);
}

const beforeLaunch = '<section class="academy-content-section logic-section-v103 logic-action-v103"><h2 id="before-launch">';
{
  const s = html.indexOf(geoStart);
  const e = html.indexOf(beforeLaunch, s);
  must(s >= 0 && e > s, 'geo/before-launch boundary');
  const block = `<section class="academy-content-section logic-section-v103 logic-action-v103" id="geo-verification"><h2><span class="logic-index-v103">07</span>Как проверить GEO без устаревшего списка стран</h2>
<p>Список стран на статичной странице быстро стареет и не отвечает на главный вопрос: можно ли запускать именно этот источник и оффер сегодня. Проверяй GEO как набор независимых условий.</p>
<table class="rules-table"><thead><tr><th>Проверка</th><th>Что подтвердить</th></tr></thead><tbody>
<tr><td>Доступность оффера</td><td>Страна доступна в актуальном кабинете для выбранной модели выплаты.</td></tr>
<tr><td>Источник</td><td>Программа разрешает конкретный канал и формат трафика для этого GEO.</td></tr>
<tr><td>Продукт</td><td>Регистрация, валюта и нужные способы оплаты реально работают для пользователя из этой страны.</td></tr>
<tr><td>Площадка</td><td>Рекламная или контентная платформа допускает такой контент и внешнюю ссылку в выбранном GEO.</td></tr>
<tr><td>Законодательство</td><td>Локальные требования отдельно проверены; наличие страны в партнёрском кабинете не является юридическим разрешением рекламы.</td></tr>
</tbody></table>
<div class="inline-note"><b>Что сохранить:</b> дату проверки, GEO, оффер/модель, источник подтверждения и ответ менеджера на спорные пункты. Тогда через месяц видно, на каких условиях запуск принимался.</div>
</section>
`;
  html = html.slice(0, s) + block + html.slice(e);
}

html = html.replace(
  '<h2 id="before-launch"><span class="logic-index-v103">10</span>Что проверить перед первым кликом</h2>',
  '<h2 id="before-launch"><span class="logic-index-v103">08</span>Что проверить перед первым кликом</h2>'
);
html = html.replace(
  '<ol class="rules-launch-list"><li>Есть ли нужное GEO в актуальном списке и для какой модели оно доступно.</li><li>Разрешён ли именно твой источник трафика.</li><li>Работаешь по RS или CPA и какие условия выплаты действуют в кабинете.</li><li>Для CPA — согласована ли кампания с менеджером до запуска.</li><li>Не используешь ли брендовые ключи, спам, мотивированный трафик или запрещённые материалы.</li><li>Есть ли отдельная метка на источник, площадку и тест, чтобы при проверке показать происхождение трафика.</li><li>Проверена ли посадочная страница, регистрация и оплата с нужного GEO.</li></ol>',
  '<ol class="rules-launch-list"><li>Доступен ли оффер для нужного GEO и модели в текущем кабинете.</li><li>Разрешён ли именно твой источник и формат трафика.</li><li>Зафиксированы ли формула выплаты, квалификация действия, холд и условия вывода.</li><li>Сохранено ли согласование кампании, если оно требуется.</li><li>Проверены ли брендовые ограничения, креатив и текст обещаний.</li><li>Есть ли отдельная метка на источник, площадку и тест.</li><li>Проверены ли посадочная страница, регистрация и оплата с нужного GEO.</li><li>Проверены ли правила площадки и местные ограничения для выбранной страны.</li></ol>'
);

const oldToc = '<ol><li><a href="#account">Что нужно соблюдать ещё до запуска</a></li><li><a href="#models">RS и CPA: условия отличаются</a></li><li><a href="#forbidden-methods">Что нельзя делать с трафиком</a></li><li><a href="#forbidden-sources">Запрещённые источники и брендовые ограничения</a></li><li><a href="#checks">Как программа проверяет трафик</a></li><li><a href="#appeal">Если возник спор</a></li><li><a href="#geo-program">GEO программы</a></li><li><a href="#африка">Африка</a></li><li><a href="#geo-с-crypto-моделью">GEO с crypto-моделью</a></li><li><a href="#before-launch">Что проверить перед первым кликом</a></li><li><a href="#связать-правила-с-запуском">Связать правила с запуском</a></li></ol>';
const newToc = '<ol><li><a href="#rules-audit">Как читать правила</a></li><li><a href="#account">Что зафиксировать до запуска</a></li><li><a href="#models">RS и CPA</a></li><li><a href="#forbidden-methods">Запрещённые методы</a></li><li><a href="#forbidden-sources">Источники и бренд</a></li><li><a href="#checks">Проверка трафика</a></li><li><a href="#appeal">Спор или проверка</a></li><li><a href="#geo-verification">Проверка GEO</a></li><li><a href="#before-launch">Перед первым кликом</a></li><li><a href="#связать-правила-с-запуском">Связать правила с запуском</a></li></ol>';
html = replace(html, oldToc, newToc, 'partner rules TOC');

fs.writeFileSync(rulesPath, html);
console.log('Final Yandex quality cleanup applied.');
