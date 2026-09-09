import { chromium } from 'playwright';

const expected = {
  '/guides/adsbridge-campaign/': 'AdsBridge: первая кампания от клика до тестовой конверсии',
  '/guides/partner-program-rules/': 'Правила партнёрской программы: что проверить до запуска трафика',
  '/traffic/sources/paid/': 'Платный трафик как источник: запуск, диагностика и масштабирование',
  '/traffic/sources/youtube/': 'YouTube как источник трафика: канал, длинные видео и первый тест'
};

const browser = await chromium.launch({ headless: true });
const failures = [];
for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  for (const [path, expectedH1] of Object.entries(expected)) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173' + path, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      h1Count: document.querySelectorAll('h1').length,
      canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
      overflow: document.body.scrollWidth > document.documentElement.clientWidth + 2,
      geoVerification: document.querySelectorAll('#geo-verification').length,
      staleGeo: document.querySelectorAll('#geo-program,#африка,#geo-с-crypto-моделью').length,
      badPaidMetric: /CTR\s+в\s+описани/i.test(document.querySelector('main')?.innerText || ''),
      adsChain: document.querySelectorAll('[data-adsbridge-click-chain]').length,
      youtubeReading: document.querySelectorAll('#youtube-studio-reading').length,
      paidReconciliation: document.querySelectorAll('#paid-reconciliation').length
    }));
    console.log(JSON.stringify({ viewport: viewport.name, path, errors, info }));
    if (errors.length) failures.push(`${viewport.name} ${path}: JS error`);
    if (info.h1 !== expectedH1) failures.push(`${viewport.name} ${path}: H1 mismatch: ${info.h1}`);
    if (info.h1Count !== 1 || info.canonicalCount !== 1) failures.push(`${viewport.name} ${path}: H1/canonical count`);
    if (info.overflow) failures.push(`${viewport.name} ${path}: horizontal overflow`);
    if (path === '/guides/partner-program-rules/' && (info.geoVerification !== 1 || info.staleGeo !== 0)) failures.push(`${viewport.name} partner: stale GEO structure`);
    if (path === '/traffic/sources/paid/' && (info.badPaidMetric || info.paidReconciliation !== 1)) failures.push(`${viewport.name} paid: generic metric override or reconciliation issue`);
    if (path === '/guides/adsbridge-campaign/' && info.adsChain !== 1) failures.push(`${viewport.name} adsbridge: click chain missing`);
    if (path === '/traffic/sources/youtube/' && info.youtubeReading !== 1) failures.push(`${viewport.name} youtube: Studio reading missing`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
