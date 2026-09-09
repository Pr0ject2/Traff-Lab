import fs from 'node:fs';

const file = 'public/guides/partner-dashboard/index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/\s*<section class="partner-specific-box[\s\S]*?<\/section>/, '');
html = html.replace(/<li><a href="#условия-выплаты-тоже-влияют-на-кабинет">[^<]*<\/a><\/li>/, '');
if (html.includes('minimum 10 depositors') || html.includes('минимум 10 депозиторов') || html.includes('суммарно не менее $70') || html.includes('минимальная выплата — $5')) {
  throw new Error('Stale payout terms remain in partner dashboard');
}
fs.writeFileSync(file, html);
console.log('Partner dashboard stale terms removed');
