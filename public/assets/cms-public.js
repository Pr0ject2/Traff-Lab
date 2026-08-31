(function(){
'use strict';
const BASE='/';
const j=(u)=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeInternalHref(value,fallback=BASE){try{const raw=String(value||'').trim();if(raw.startsWith('#'))return raw;const u=new URL(raw,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith(BASE))return fallback;return u.pathname+u.search+u.hash}catch{return fallback}}
function currentPath(){let p=location.pathname;return p.endsWith('/')?p:p+'/'}
const CORE_NAV_IDS=new Set(['start','traffic','compare','practice','diagnostics','analytics','tools','services','library','basics','glossary','notes','history','saved','about','help','privacy','terms','path','economics']);
function cleanNavigation(data,sectionsData){if(!data?.groups||!sectionsData?.sections)return data;const validIds=new Set(sectionsData.sections.map(s=>String(s.id||'')));const groups=data.groups.map(g=>({...g,items:(g.items||[]).filter(it=>{const id=String(it.id||'');if(CORE_NAV_IDS.has(id)||validIds.has(id))return true;const href=safeInternalHref(it.href,'');if(!href)return true;let parts=[];try{parts=new URL(href,location.origin).pathname.split('/').filter(Boolean).map(decodeURIComponent)}catch{return true}return !(parts.length===1&&parts[0]===id)})}));return {...data,groups}}
function renderNav(data){
  const sidebar=document.querySelector('.global-sidebar'); if(!sidebar||!data?.groups)return;
  const path=currentPath();
  const refHost=sidebar.querySelector(':scope > .ref-sidebar-groups');

  /* Reference UI already owns the sidebar shell. Update that existing menu
     from the CMS data instead of appending a second legacy navigation below it. */
  if(refHost){
    const iconMap={
      start:'compass',traffic:'route',compare:'scaling',practice:'book-open',
      services:'package-2',analytics:'line-chart',diagnostics:'circle-alert',tools:'calculator',
      library:'layout-template',basics:'map',glossary:'whole-word',notes:'pen-square',history:'history'
    };
    const navIconShapes={
      compass:'<path d="m15.2 8.8-2.7 8.1-8.1 2.7 2.7-8.1 8.1-2.7Z"/><circle cx="12" cy="12" r="8.8"/>',
      route:'<circle cx="6" cy="18" r="2.5"/><path d="M8.5 18h7.6a3.2 3.2 0 0 0 0-6.4H7.3a3.2 3.2 0 0 1 0-6.4H15"/><circle cx="18" cy="5.2" r="2.5"/>',
      scaling:'<path d="M5 19h14a1.5 1.5 0 0 0 1.5-1.5V5"/><path d="M9 15h4v-4"/><path d="M19 5h-5"/><path d="M19 5 9 15"/>',
      'book-open':'<path d="M12 7v12"/><path d="M4 17V5a1 1 0 0 1 1-1h4a4 4 0 0 1 3 1.3A4 4 0 0 1 15 4h4a1 1 0 0 1 1 1v12h-5a3.5 3.5 0 0 0-3 1.5A3.5 3.5 0 0 0 9 17Z"/>',
      'package-2':'<path d="M12 3.8v5.4"/><path d="M7.4 4.2h9.2a2 2 0 0 1 1.8 1l2.2 4.4a2 2 0 0 1 .2.9v8.1a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2v-8a2 2 0 0 1 .2-.9l2.2-4.5a2 2 0 0 1 1.8-1Z"/><path d="M3.3 10.1h17.4"/>',
      'line-chart':'<path d="M4 4v13.5A2.5 2.5 0 0 0 6.5 20H20"/><path d="m18 8-4.5 4.5-3.5-3.5L7 12"/>',
      'circle-alert':'<circle cx="12" cy="12" r="8.8"/><path d="M12 8.3v4.2"/><circle cx="12" cy="15.8" r=".9" fill="currentColor" stroke="none"/>',
      calculator:'<rect x="5" y="3.5" width="14" height="17" rx="2.2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 15v4"/>',
      'layout-template':'<rect x="4" y="4" width="16" height="6" rx="1.4"/><rect x="4" y="14" width="8" height="6" rx="1.4"/><rect x="15" y="14" width="5" height="6" rx="1.4"/>',
      map:'<path d="M9 4.5 4.5 6.7v12.8L9 17.3l6 2.2 4.5-2.2V4.5L15 6.7Z"/><path d="M9 4.5v12.8M15 6.7v12.8"/>',
      'whole-word':'<circle cx="7" cy="12" r="2.8"/><path d="M10.2 9v6"/><circle cx="17" cy="12" r="2.8"/><path d="M14 7.5v8.5"/><path d="M21 17v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1"/>',
      'pen-square':'<path d="M12 4H5.8A1.8 1.8 0 0 0 4 5.8v12.4A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8V12"/><path d="M16.5 4.5a1.4 1.4 0 0 1 2 2L10.9 14a2 2 0 0 1-.8.5l-2.7.8.8-2.7a2 2 0 0 1 .5-.8Z"/>',
      history:'<path d="M4 12a8 8 0 1 0 2.7-5.9L4 8.8"/><path d="M4 4v4.8h4.8"/><path d="M12 8.2v4.8l3.6 2"/>'
    };
    const iconMarkup=(id)=>`<svg class="ref-nav-icon-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true" focusable="false">${navIconShapes[iconMap[id]||'layout-template']||navIconShapes['layout-template']}</svg>`;
    const items=[];
    (data.groups||[]).forEach(g=>(g.items||[]).forEach(it=>items.push(it)));
    const activeHref=items.map(it=>it.href||'#').filter(h=>{
      const hp=currentPathFromHref(h); return path===hp || (hp!==BASE && path.startsWith(hp));
    }).sort((a,b)=>String(b).length-String(a).length)[0]||'';

    refHost.innerHTML=(data.groups||[]).map((g,gi)=>{
      const links=(g.items||[]).map(it=>{
        const href=safeInternalHref(it.href||'#','#'); const isActive=href===activeHref;
        const cleanTitle=String(it.title||'Пункт').replace(/^↺\s*/,'');
        return `<a href="${esc(href)}" class="${isActive?'is-active':''}"${isActive?' aria-current="page"':''}><span class="ref-nav-icon">${iconMarkup(it.id||'custom')}</span><span>${esc(cleanTitle)}</span></a>`;
      }).join('');
      const hasActive=(g.items||[]).some(it=>(it.href||'#')===activeHref);
      return `<section class="ref-nav-group is-open${hasActive?' has-active':''}" data-ref-group="${esc(g.id||String(gi))}"><button class="ref-nav-heading" type="button" aria-expanded="true"><span>${esc(String(g.title||'Раздел').toUpperCase())}</span><i>⌄</i></button><nav>${links}</nav></section>`;
    }).join('');

    refHost.querySelectorAll('.ref-nav-heading').forEach(btn=>btn.addEventListener('click',()=>{
      const group=btn.closest('.ref-nav-group'); const next=!group.classList.contains('is-open');
      group.classList.toggle('is-open',next); btn.setAttribute('aria-expanded',next?'true':'false');
    }));
    return;
  }

  /* Legacy fallback for pages where the reference shell is not present. */
  sidebar.querySelectorAll(':scope > .sidebar-group').forEach(x=>x.remove());
  const anchor=sidebar.querySelector(':scope > .sidebar-mode-compact, :scope > .sidebar-partner-cta, :scope > .sidebar-bottom');
  data.groups.forEach((g,gi)=>{
    const box=document.createElement('div'); box.className='sidebar-group'; box.dataset.sidebarGroup=g.id||String(gi);
    const title=document.createElement('p'); title.className='sidebar-group-title'; title.textContent=g.title||'Раздел'; box.appendChild(title);
    const nav=document.createElement('nav'); nav.className='sidebar-menu'; nav.setAttribute('aria-label',g.title||'Раздел');
    (g.items||[]).forEach(it=>{
      const a=document.createElement('a'); a.href=safeInternalHref(it.href||'#','#'); a.dataset.nav=it.id||'custom'; a.dataset.cmsIcon=it.icon||'•'; a.classList.add('cms-nav-item');
      if(currentPathFromHref(a.href)===path){a.classList.add('active');a.setAttribute('aria-current','page')}
      const span=document.createElement('span');span.textContent=String(it.title||'Пункт').replace(/^↺\s*/,'');a.appendChild(span);nav.appendChild(a);
    });
    box.appendChild(nav); sidebar.insertBefore(box,anchor||null); decorateGroup(box,gi);
  });
}
function currentPathFromHref(href){const safe=safeInternalHref(href,'');if(!safe)return '';try{let p=new URL(safe,location.href).pathname;return p.endsWith('/')?p:p+'/'}catch{return ''}}
function decorateGroup(group,index){
 const title=group.querySelector(':scope > .sidebar-group-title'),menu=group.querySelector(':scope > .sidebar-menu');if(!title||!menu)return;
 const b=document.createElement('button');b.type='button';b.className='sidebar-group-toggle';b.textContent=title.textContent.trim();
 const key='ita-sidebar-cms-'+(group.dataset.sidebarGroup||index);const current=!!menu.querySelector('.active,[aria-current="page"]');let saved=null;try{saved=localStorage.getItem(key)}catch{}
 const collapsed=current?false:saved!=='0';group.classList.toggle('is-collapsed',collapsed);b.setAttribute('aria-expanded',collapsed?'false':'true');title.insertAdjacentElement('afterend',b);
 b.addEventListener('click',()=>{const next=!group.classList.contains('is-collapsed');if(!next&&innerWidth<=900)document.querySelectorAll('.global-sidebar .sidebar-group').forEach(o=>{if(o!==group){o.classList.add('is-collapsed');o.querySelector(':scope > .sidebar-group-toggle')?.setAttribute('aria-expanded','false')}});group.classList.toggle('is-collapsed',next);b.setAttribute('aria-expanded',next?'false':'true');try{localStorage.setItem(key,next?'1':'0')}catch{}})
}
function libraryRow(a){
 const topic=(a.section||'материалы').toLowerCase(); const level=a.level==='advanced'?'advanced':'beginner'; const url=safeInternalHref(a.url,''); if(!url)return '';
 return `<article class="library-row" data-card-link="${esc(url)}" data-level="${level}" data-search="${esc([a.title,a.description,a.aliases,a.section].join(' '))}" data-topic="${esc(topic)}"><div class="library-type">${esc(a.label||'Статья')}</div><div><a href="${esc(url)}"><h2>${esc(a.title)}</h2></a><p>${esc(a.description||a.lead||'')}</p></div><div class="library-meta"><span class="level-badge level-${level}">${level==='advanced'?'После базы':'С нуля'}</span><span>${esc(a.section||'Материалы')}</span><span>${esc(a.readTime||'5 мин')}</span><span>${esc(a.date||'')}</span></div></article>`;
}
function setupLibrary(data){
 const host=document.getElementById('libraryRows'); if(!host||!data?.articles)return;
 const list=data.articles.filter(a=>a.libraryVisible!==false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 host.innerHTML=list.map(libraryRow).join('');
 const input=document.getElementById('librarySearch'),empty=document.getElementById('libraryEmpty'),hint=document.getElementById('librarySearchHint'),topicLabel=document.getElementById('activeTopicLabel');
 const params=new URLSearchParams(location.search),rawTopic=(params.get('topic')||'all').toLowerCase();
 const labels={all:'Все материалы','основы':'Основы','экономика':'Экономика','аналитика':'Аналитика','практика':'Практика','трафик':'Трафик'}; if(topicLabel)topicLabel.textContent=labels[rawTopic]||'Все материалы';
 const apply=()=>{const q=(input?.value||'').trim().toLowerCase();let visible=0;host.querySelectorAll('.library-row').forEach(r=>{const topicOk=rawTopic==='all'||(r.dataset.topic||'').toLowerCase()===rawTopic;const queryOk=!q||(r.dataset.search||'').toLowerCase().includes(q);const ok=topicOk&&queryOk;r.classList.toggle('is-filtered-out',!ok);if(ok)visible++});if(empty)empty.hidden=visible>0;if(hint)hint.textContent=q?`Найдено: ${visible}`:'Введите тему или термин'};
 input?.addEventListener('input',apply); const q=(params.get('q')||'').slice(0,160);if(input&&q)input.value=q;apply();
 host.addEventListener('click',e=>{const row=e.target.closest('.library-row[data-card-link]');if(row&&!e.target.closest('a,button,input,select,textarea'))location.href=row.dataset.cardLink});
 document.dispatchEvent(new CustomEvent('al:modechange',{detail:{source:'cms'}}));
}
function installStyle(){const st=document.createElement('style');st.textContent='.global-sidebar .sidebar-menu a.cms-nav-item[data-cms-icon]::before{content:attr(data-cms-icon)!important}.cms-runtime-error{display:none!important}';document.head.appendChild(st)}
function setupPartnerRedirect(){return}
async function init(){setupPartnerRedirect();installStyle();const [nav,articles,sections]=await Promise.allSettled([j(BASE+'content/navigation.json?v='+Date.now()),j(BASE+'content/articles.json?v='+Date.now()),j(BASE+'content/sections.json?v='+Date.now())]);if(nav.status==='fulfilled')renderNav(cleanNavigation(nav.value,sections.status==='fulfilled'?sections.value:null));if(articles.status==='fulfilled')setupLibrary(articles.value)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(()=>{}));else init().catch(()=>{});
})();
