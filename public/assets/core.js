
/* TrafficLab core UI.
   Critical navigation lives here so a failure in optional modules does not disable the site. */
(function(){
  'use strict';

  function safeStorageGet(key){
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function safeStorageSet(key,value){
    try { localStorage.setItem(key,value); } catch(e) {}
  }

  /* Audience mode is a site-wide preference and must work independently. */
  const MODE_KEY='al-user-mode-v1';
  function applyMode(mode,emit){
    mode = mode === 'pro' ? 'pro' : 'beginner';
    document.body.classList.toggle('mode-pro',mode==='pro');
    document.body.classList.toggle('mode-beginner',mode!=='pro');
    document.body.dataset.audienceMode=mode;
    document.querySelectorAll('[data-user-mode]').forEach(function(btn){
      btn.setAttribute('aria-pressed',btn.dataset.userMode===mode?'true':'false');
    });
    document.querySelectorAll('[data-mode-summary]').forEach(function(label){
      label.textContent=mode==='pro'?'Аналитика и рабочие задачи':'Пошагово с нуля';
    });
    if(emit){
      document.dispatchEvent(new CustomEvent('al:modechange',{detail:{mode:mode}}));
      if(window.alTrack) window.alTrack('audience_mode_change',{mode:mode});
    }
  }
  const initialMode=safeStorageGet(MODE_KEY)==='pro'?'pro':'beginner';
  applyMode(initialMode,false);
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-user-mode]');
    if(!btn)return;
    const mode=btn.dataset.userMode==='pro'?'pro':'beginner';
    safeStorageSet(MODE_KEY,mode);
    applyMode(mode,true);
  });

  /* Term hints are independent from the audience mode. */
  const HINTS_KEY='al-term-hints-v1';
  function applyHints(enabled,emit){
    document.body.classList.toggle('hints-off',!enabled);
    document.body.dataset.termHints=enabled?'on':'off';
    document.querySelectorAll('[data-hints-toggle]').forEach(function(btn){
      btn.setAttribute('aria-pressed',enabled?'true':'false');
      btn.setAttribute('aria-label',enabled?'Отключить подсказки к терминам':'Включить подсказки к терминам');
      const state=btn.querySelector('[data-hints-state]');
      if(state)state.textContent=enabled?'Вкл.':'Выкл.';
    });
    document.querySelectorAll('.term-help').forEach(function(btn){
      btn.disabled=!enabled;
      btn.setAttribute('aria-disabled',enabled?'false':'true');
      btn.tabIndex=enabled?0:-1;
    });
    if(emit)document.dispatchEvent(new CustomEvent('al:hintschange',{detail:{enabled:enabled}}));
  }
  const initialHints=safeStorageGet(HINTS_KEY)!=='off';
  applyHints(initialHints,false);
  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-hints-toggle]');
    if(!btn)return;
    const enabled=btn.getAttribute('aria-pressed')!=='true';
    safeStorageSet(HINTS_KEY,enabled?'on':'off');
    applyHints(enabled,true);
  });

  /* First-visit entry links also set the global mode before navigation. */
  document.addEventListener('click',function(e){
    const entry=e.target.closest('[data-entry-mode]');
    if(!entry)return;
    const mode=entry.dataset.entryMode==='pro'?'pro':'beginner';
    safeStorageSet(MODE_KEY,mode);
    applyMode(mode,true);
    if(window.alTrack) window.alTrack('entry_mode',{mode:mode,href:entry.getAttribute('href')||''});
  });

  /* Mobile menu is critical navigation, so it does not depend on the knowledge-base script. */
  function initMobileNav(){
    const header=document.querySelector('.site-header .header-inner, .site-header .ref-topbar') || document.querySelector('.site-header');
    const sidebar=document.querySelector('.global-sidebar');
    if(!header||!sidebar)return;
    let btn=header.querySelector('.mobile-nav-toggle');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='mobile-nav-toggle';
      btn.innerHTML='<span class="mobile-nav-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>Меню</span>';
      header.appendChild(btn);
    }
    if(btn.dataset.mobileNavReady==='true')return;
    btn.dataset.mobileNavReady='true';
    btn.setAttribute('aria-expanded','false');
    sidebar.id=sidebar.id||'library-navigation';
    btn.setAttribute('aria-controls',sidebar.id);
    btn.setAttribute('aria-label','Открыть меню библиотеки');

    let overlay=document.querySelector('.mobile-nav-overlay');
    if(!overlay){
      overlay=document.createElement('button');
      overlay.type='button';
      overlay.className='mobile-nav-overlay';
      overlay.setAttribute('aria-label','Закрыть меню');
      document.body.appendChild(overlay);
    }

    function syncButtons(expanded){
      document.querySelectorAll('.site-header .mobile-nav-toggle').forEach(function(button){
        button.setAttribute('aria-expanded',expanded?'true':'false');
        button.setAttribute('aria-label',expanded?'Закрыть меню библиотеки':'Открыть меню библиотеки');
      });
    }
    function close(returnFocus){
      document.body.classList.remove('mobile-nav-open');
      syncButtons(false);
      const currentBtn=document.querySelector('.site-header .mobile-nav-toggle')||btn;
      if(returnFocus && currentBtn && currentBtn.isConnected)currentBtn.focus();
    }
    function open(){
      document.body.classList.add('mobile-nav-open');
      syncButtons(true);
      const firstLink=sidebar.querySelector('a,input,button');
      if(firstLink)firstLink.focus();
    }
    btn.addEventListener('click',function(){
      document.body.classList.contains('mobile-nav-open')?close(true):open();
    });
    overlay.addEventListener('click',function(){close(true)});
    sidebar.addEventListener('click',function(e){
      if(e.target.closest('a'))close(false);
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&document.body.classList.contains('mobile-nav-open'))close(true);
    });
    const mobileQuery=window.matchMedia('(max-width:900px)');
    function closeOnDesktop(e){if(!e.matches)close(false)}
    if(mobileQuery.addEventListener)mobileQuery.addEventListener('change',closeOnDesktop);
    else if(mobileQuery.addListener)mobileQuery.addListener(closeOnDesktop);
  }
  window.ITAInitMobileNav=initMobileNav;
  window.ITASetAudienceMode=function(mode,emit){
    mode=mode==='pro'?'pro':'beginner';
    safeStorageSet(MODE_KEY,mode);
    applyMode(mode,emit!==false);
  };
  initMobileNav();

  /* Homepage search has a native fallback form after v38, this handles old markup too. */
  const siteSearch=document.getElementById('siteSearch');
  const searchButton=document.getElementById('searchButton');
  if(siteSearch&&searchButton){
    function go(event){
      if(event)event.preventDefault();
      const q=siteSearch.value.trim().slice(0,160);
      location.href='/guides/'+(q?'?q='+encodeURIComponent(q):'');
    }
    const form=siteSearch.closest('form');
    if(form)form.addEventListener('submit',go);
    else searchButton.addEventListener('click',go);
  }
})();


/* v433 — consent-aware first-party analytics for Cloudflare Pages + D1.
   Functional browser storage (history, bookmarks, notes, theme, settings) stays local.
   Aggregate analytics is sent only after an explicit choice to allow statistics. */
window.dataLayer=window.dataLayer||[];
(function(){
  'use strict';
  const CLIENT_KEY='tl-anon-client-v1';
  const SESSION_KEY='tl-anon-session-v1';
  const SESSION_TTL=30*60*1000;
  const CONSENT_KEY='tl-analytics-consent-v1';
  const endpoint='/api/event';
  let trackingStarted=false;
  let depthHandler=null;

  function consent(){
    try{
      const v=localStorage.getItem(CONSENT_KEY)||'';
      return v==='yes'||v==='no'?v:'';
    }catch(_e){return ''}
  }
  function setConsent(value){
    const v=value==='yes'?'yes':'no';
    try{localStorage.setItem(CONSENT_KEY,v)}catch(_e){}
    document.dispatchEvent(new CustomEvent('tl:privacychange',{detail:{analytics:v==='yes'}}));
    if(v==='yes') startTracking();
    return v;
  }
  function analyticsAllowed(){return consent()==='yes'}
  function randomId(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    const b=new Uint8Array(16);window.crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function clientId(){
    try{
      let id=localStorage.getItem(CLIENT_KEY)||'';
      if(id&&!/^[A-Za-z0-9-]{16,80}$/.test(id)){try{localStorage.removeItem(CLIENT_KEY)}catch(_e){}id=''}
      if(!id){id=randomId();localStorage.setItem(CLIENT_KEY,id)}
      return id;
    }catch(_e){return ''}
  }
  function sessionId(){
    try{
      const now=Date.now();let value={};
      try{value=JSON.parse(localStorage.getItem(SESSION_KEY)||'{}')||{}}catch(_e){}
      let id=/^[A-Za-z0-9-]{16,80}$/.test(String(value.id||''))?String(value.id):'';
      const last=Number(value.last)||0;
      if(!id||!last||now-last>SESSION_TTL)id=randomId();
      localStorage.setItem(SESSION_KEY,JSON.stringify({id,last:now}));
      return id;
    }catch(_e){return ''}
  }
  function post(name,data){
    if(!analyticsAllowed())return;
    const payload={event:name,path:location.pathname,data:data||{},clientId:clientId(),sessionId:sessionId()};
    try{
      fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'same-origin'}).catch(()=>{});
    }catch(_e){}
  }
  window.alTrack=function(name,data){
    try{window.dataLayer.push(Object.assign({event:'al_'+name,path:location.pathname},data||{}));}catch(_e){}
    post(name,data);
  };

  function removeBanner(){document.querySelector('.tl-privacy-banner')?.remove()}
  function showPrivacyChoice(force){
    if(!force&&consent())return;
    removeBanner();
    const box=document.createElement('section');
    box.className='tl-privacy-banner';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-label','Настройки конфиденциальности');
    box.innerHTML='<div class="tl-privacy-copy"><b>Статистика TrafficLab</b><p>История, закладки и заметки остаются в этом браузере. Анонимные посещения и основные действия отправляем только с вашего разрешения.</p><a href="/privacy/">Подробнее</a></div><div class="tl-privacy-actions"><button type="button" data-privacy-choice="no">Только необходимое</button><button class="primary" type="button" data-privacy-choice="yes">Разрешить статистику</button></div>';
    box.addEventListener('click',e=>{
      const b=e.target.closest('[data-privacy-choice]');if(!b)return;
      setConsent(b.dataset.privacyChoice);removeBanner();
    });
    document.body.appendChild(box);
  }

  function startTracking(){
    if(trackingStarted||!analyticsAllowed())return;
    trackingStarted=true;
    window.alTrack('page_view',{});
    const article=document.querySelector('article.article,.source-playbook-article');
    if(!article)return;
    const fired=new Set();
    depthHandler=()=>{
      const doc=document.documentElement;
      const max=Math.max(1,doc.scrollHeight-window.innerHeight);
      const pct=Math.max(0,Math.min(100,Math.round((window.scrollY/max)*100)));
      [50,90].forEach(mark=>{
        if(pct>=mark&&!fired.has(mark)){
          fired.add(mark);window.alTrack('read_depth',{percent:mark});
        }
      });
    };
    window.addEventListener('scroll',depthHandler,{passive:true});
    window.addEventListener('pagehide',depthHandler);
    setTimeout(depthHandler,400);
  }

  window.TLAnalytics={clientId,sessionId,allowed:analyticsAllowed};
  window.TLPrivacy={consent,setConsent,openSettings:()=>showPrivacyChoice(true)};

  const init=()=>{
    if(analyticsAllowed())startTracking();
    else if(!consent())showPrivacyChoice(false);
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-privacy-settings]')){e.preventDefault();showPrivacyChoice(true)}
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* Whole-card mouse navigation; the visible HTML link remains the keyboard/fallback path. */
(function(){
  'use strict';
  const interactive='a,button,input,select,textarea,label,summary,[contenteditable="true"]';
  document.addEventListener('click',function(e){
    const card=e.target.closest('[data-card-link]');
    if(!card || e.target.closest(interactive)) return;
    const url=card.dataset.cardLink;
    if(url) location.href=url;
  });
})();


/* v83: keyboard support for clickable service cards */
(function(){
  'use strict';
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    const card=e.target.closest('.service-tool[data-card-link]');
    if(!card || e.target.closest('a,button,input,select,textarea')) return;
    e.preventDefault();
    const url=card.dataset.cardLink;
    if(url) location.href=url;
  });
})();

/* v244 — mobile navigation recovery layer.
   The top bar is rebuilt by app.js after core.js has already loaded. Rebind
   navigation when that happens and provide a click fallback in case a cached
   shell replaced the original button without its listener. */
(()=>{
  const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
  const sync=(open)=>{
    document.body.classList.toggle('mobile-nav-open',open);
    document.querySelectorAll('.site-header .mobile-nav-toggle').forEach(btn=>{
      btn.setAttribute('aria-expanded',open?'true':'false');
      btn.setAttribute('aria-label',open?'Закрыть меню библиотеки':'Открыть меню библиотеки');
    });
  };

  /* Capture the state before the button's own handler runs. If nothing has
     changed by the end of the click, the fallback performs the toggle. */
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.site-header .mobile-nav-toggle');
    if(!btn || !isMobile()) return;
    const before=document.body.classList.contains('mobile-nav-open');
    setTimeout(()=>{
      const after=document.body.classList.contains('mobile-nav-open');
      if(after===before) sync(!before);
    },0);
  },true);

  document.addEventListener('click',e=>{
    if(!e.target.closest('.mobile-nav-overlay') || !isMobile()) return;
    setTimeout(()=>{
      if(document.body.classList.contains('mobile-nav-open')) sync(false);
    },0);
  },true);

  const rebind=()=>{
    if(typeof window.ITAInitMobileNav==='function') window.ITAInitMobileNav();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',rebind,{once:true});
  else rebind();
  window.addEventListener('load',rebind,{once:true});

  const header=document.querySelector('.site-header');
  if(header && 'MutationObserver' in window){
    new MutationObserver(()=>rebind()).observe(header,{childList:true,subtree:true});
  }
})();


/* v272 — independent adaptive site-progress engine.
   Runs in core.js so optional article UI errors cannot stop progress tracking. */
(function(){
  'use strict';
  const KEY='ita-site-progress-v3';
  const LEGACY=['ita-site-progress-v2','ita-site-progress-v1'];
  const FALLBACK=["/guides/partner-program-rules/", "/guides/adsbridge-campaign/", "/guides/affiliate-manager/", "/guides/affiliate-marketing/", "/guides/choose-program/", "/guides/choose-traffic-source/", "/guides/clicks-no-registrations/", "/guides/community-traffic/", "/guides/content-sites/", "/guides/cpa-vs-revshare/", "/guides/first-ftd/", "/guides/free-traffic/", "/guides/ftd/", "/guides/geo/", "/guides/ggr-ngr/", "/guides/landing-page/", "/guides/launch-checklist/", "/guides/metrics/", "/guides/nigeria-ad-guidelines/", "/guides/offer/", "/guides/paid-traffic/", "/guides/partner-dashboard/", "/guides/registrations-no-ftd/", "/guides/revshare/", "/guides/search-traffic/", "/guides/social-traffic/", "/guides/statistics-mismatch/", "/guides/statistics/", "/guides/stream-traffic/", "/guides/tracker-for-beginner/", "/guides/tracking/", "/guides/traffic-quality/", "/guides/video-traffic/", "/traffic/sources/alt-video/", "/traffic/sources/communities/", "/traffic/sources/content-site/", "/traffic/sources/dzen/", "/traffic/sources/mailing/", "/traffic/sources/paid/", "/traffic/sources/reddit/", "/traffic/sources/search/", "/traffic/sources/short-video/", "/traffic/sources/social/", "/traffic/sources/streams/", "/traffic/sources/telegram/", "/traffic/sources/vk-video/", "/traffic/sources/x-twitter/", "/traffic/sources/youtube/"];
  let catalog=FALLBACK.slice();
  const visited=new Set();

  function normalize(value){
    try{
      const u=new URL(value||location.pathname,location.href);
      let p=u.pathname.replace(/index\.html$/,'');
      if(!p.endsWith('/'))p+='/';
      return p;
    }catch(e){return String(value||'')}
  }
  function isArticle(value){
    const p=normalize(value);
    return (p.startsWith('/guides/')&&p!=='/guides/') ||
           p.startsWith('/traffic/sources/');
  }
  function parseArray(key){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(value)?value:[];
    }catch(e){return []}
  }
  function absorb(){
    [KEY].concat(LEGACY).forEach(function(key){
      parseArray(key).forEach(function(value){const p=normalize(value);if(isArticle(p))visited.add(p)});
    });
    try{
      const states=JSON.parse(localStorage.getItem('al-reading-state-v1')||'{}')||{};
      Object.keys(states).forEach(function(value){const p=normalize(value);if(isArticle(p))visited.add(p)});
    }catch(e){}
    try{
      const recent=JSON.parse(localStorage.getItem('al-recent-v1')||'[]')||[];
      recent.forEach(function(item){if(item&&item.url){const p=normalize(item.url);if(isArticle(p))visited.add(p)}});
    }catch(e){}
    const current=normalize(location.pathname);
    if(isArticle(current))visited.add(current);
    try{localStorage.setItem(KEY,JSON.stringify(Array.from(visited)))}catch(e){}
  }
  function validVisited(){
    const set=new Set(catalog.map(normalize));
    return Array.from(visited).filter(function(p){return set.has(normalize(p))});
  }
  function render(){
    absorb();
    const total=Math.max(1,catalog.length);
    const opened=validVisited().length;
    const pct=Math.max(0,Math.min(100,Math.round(opened/total*100)));
    document.querySelectorAll('[data-ref-progress-value]').forEach(function(el){el.textContent=pct+'%'});
    document.querySelectorAll('[data-ref-progress-bar]').forEach(function(el){
      el.style.width=pct+'%';
      el.setAttribute('aria-valuemin','0');
      el.setAttribute('aria-valuemax','100');
      el.setAttribute('aria-valuenow',String(pct));
    });
    document.querySelectorAll('.ref-top-progress').forEach(function(el){
      const label='Открыто '+opened+' из '+total+' материалов TrafficLab';
      el.title=label; el.setAttribute('aria-label',label);
    });
    return {opened:opened,total:total,pct:pct};
  }
  function basePath(){
    const link=document.querySelector('link[href*="/assets/site.css"]');
    if(link){
      try{const p=new URL(link.href,location.href).pathname;return p.replace(/assets\/site\.css.*$/,'')}catch(e){}
    }
    return '/';
  }
  async function discover(){
    try{
      const response=await fetch(basePath()+'sitemap.xml',{cache:'no-store'});
      if(!response.ok)throw new Error('sitemap '+response.status);
      const text=await response.text();
      const xml=new DOMParser().parseFromString(text,'application/xml');
      const fresh=Array.from(xml.querySelectorAll('url > loc')).map(function(n){return normalize(n.textContent||'')}).filter(isArticle);
      if(fresh.length)catalog=Array.from(new Set(fresh));
    }catch(e){
      catalog=FALLBACK.slice();
    }
    render();
  }

  window.ITARefreshSiteProgress=render;
  window.ITASiteProgress={refresh:render,discover:discover,get:function(){return render()}};

  absorb();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){render();discover()},{once:true});
  }else{render();discover()}
  window.addEventListener('pageshow',render);
  window.addEventListener('storage',function(e){
    if([KEY].concat(LEGACY,['al-reading-state-v1','al-recent-v1']).includes(e.key))render();
  });

  // app.js rebuilds the topbar after core.js. Repaint as soon as progress nodes appear.
  if('MutationObserver' in window){
    const observer=new MutationObserver(function(mutations){
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType===1 && (node.matches?.('.ref-top-progress,[data-ref-progress-value],[data-ref-progress-bar]') || node.querySelector?.('.ref-top-progress,[data-ref-progress-value],[data-ref-progress-bar]'))){
            render(); return;
          }
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
