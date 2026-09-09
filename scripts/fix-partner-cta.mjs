import fs from 'node:fs';

const file='public/guides/partner-program-rules/index.html';
let s=fs.readFileSync(file,'utf8');
const old=`<style id="tl-partner-cta-contrast-v525">
html body a.partner-direct-button,
html body a.partner-direct-button:link,
html body a.partner-direct-button:visited,
html body a.partner-direct-button:hover,
html body a.partner-direct-button:focus,
html body a.partner-direct-button:focus-visible,
html body a.partner-direct-button:active{
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  opacity:1!important;
}
</style>`;
const neu=`<style id="tl-partner-cta-contrast-v526">
html body a.partner-direct-button,
html body a.partner-direct-button:link,
html body a.partner-direct-button:visited{
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  background:#2d735f!important;
  border-color:#2d735f!important;
  opacity:1!important;
}
html body a.partner-direct-button:hover,
html body a.partner-direct-button:focus,
html body a.partner-direct-button:focus-visible,
html body a.partner-direct-button:active{
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  background:#245f50!important;
  border-color:#245f50!important;
  opacity:1!important;
}
</style>`;
if(!s.includes(old)) throw new Error('Expected CTA contrast block not found');
s=s.replace(old,neu);
fs.writeFileSync(file,s);
console.log('Partner CTA contrast fixed');
