import {isAdminAuthenticated,sameOrigin as adminSameOrigin} from '../_admin-auth.js';
const JSON_HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'referrer-policy':'no-referrer',
  'permissions-policy':'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'cross-origin-resource-policy':'same-origin',
  'x-robots-tag':'noindex, nofollow, noarchive'
};

const EVENT_ALLOWLIST=new Set([
  'page_view','read_depth','bookmark','affiliate_cta_click','search',
  'source_wizard_open','source_wizard_answer','source_wizard_result_open',
  'diagnostic_problem','diagnostic_answer','tool_action','navigation','feedback','article_reached_end',
  'audience_mode_change','entry_mode','first_meaningful_action'
]);

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
}
function cleanText(value,max=120){
  return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function cleanPath(value){
  try{
    const u=new URL(String(value||'/'),'https://traff-lab.com');
    if(u.origin!=='https://traff-lab.com') return '/';
    let p=u.pathname.replace(/\/{2,}/g,'/');
    if(!p.startsWith('/')) p='/'+p;
    return p.slice(0,220)||'/';
  }catch{return '/'}
}
function sameOrigin(request){
  const target=new URL(request.url).origin;
  const origin=request.headers.get('origin');
  if(origin){try{if(new URL(origin).origin===target)return true}catch{}}
  if(request.headers.get('sec-fetch-site')==='same-origin')return true;
  const referer=request.headers.get('referer');
  if(referer){try{if(new URL(referer).origin===target)return true}catch{}}
  return false;
}
async function hash(value){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function bodyJson(request){
  const type=request.headers.get('content-type')||'';
  if(!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(type))throw new Error('json');
  const declared=Number(request.headers.get('content-length')||0);
  if(declared>4096)throw new Error('large');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>4096)throw new Error('large');
  const parsed=JSON.parse(text);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('shape');
  return parsed;
}
function cleanClientId(value){
  const id=cleanText(value,80);
  return /^[A-Za-z0-9-]{16,80}$/.test(id)?id:'';
}
function cleanSearchQuery(value){
  return cleanText(value,100)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email]')
    .replace(/(?:https?:\/\/|www\.)\S+/gi,'[url]')
    .replace(/\b\d{7,}\b/g,'[number]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g,'[token]');
}
async function ensureSchema(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS events_daily (
      day TEXT NOT NULL,
      event TEXT NOT NULL,
      path TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(day,event,path,detail)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS article_votes (
      article_path TEXT NOT NULL,
      voter_hash TEXT NOT NULL,
      vote TEXT NOT NULL CHECK(vote IN ('up','down')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(article_path,voter_hash)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS visitors_daily (
      day TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      PRIMARY KEY(day,visitor_hash)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_event_day ON events_daily(event,day)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_votes_path ON article_votes(article_path)`)
  ]);
}
function eventDetail(event,data){
  const d=data&&typeof data==='object'?data:{};
  switch(event){
    case 'read_depth': return JSON.stringify({percent:Math.max(0,Math.min(100,Number(d.percent)||0))});
    case 'bookmark': return JSON.stringify({state:cleanText(d.state,16)});
    case 'affiliate_cta_click': return JSON.stringify({from:cleanText(d.from,48)});
    case 'search': return JSON.stringify({surface:cleanText(d.surface,32),query:cleanSearchQuery(d.query)});
    case 'source_wizard_answer': return JSON.stringify({answer:cleanText(d.answer,80)});
    case 'source_wizard_result_open': return JSON.stringify({href:cleanText(d.href,180)});
    case 'diagnostic_problem': return JSON.stringify({problem:cleanText(d.problem,80)});
    case 'diagnostic_answer': return JSON.stringify({answer:cleanText(d.answer,80)});
    case 'tool_action': return JSON.stringify({tool:cleanText(d.tool,60),label:cleanText(d.label,80)});
    case 'navigation': return JSON.stringify({href:cleanText(d.href,180),label:cleanText(d.label,80)});
    case 'feedback': return JSON.stringify({vote:cleanText(d.vote,16)});
    case 'article_reached_end': return JSON.stringify({title:cleanText(d.title,100)});
    case 'audience_mode_change': return JSON.stringify({mode:cleanText(d.mode,24)});
    case 'entry_mode': return JSON.stringify({mode:cleanText(d.mode,24),href:cleanText(d.href,180)});
    case 'first_meaningful_action': return JSON.stringify({kind:cleanText(d.kind,48),elapsed_ms:Math.max(0,Math.min(3600000,Number(d.elapsed_ms)||0))});
    default:return '';
  }
}
async function ratingCounts(db,path){
  const row=await db.prepare(`SELECT
      SUM(CASE WHEN vote='up' THEN 1 ELSE 0 END) AS up,
      SUM(CASE WHEN vote='down' THEN 1 ELSE 0 END) AS down
    FROM article_votes WHERE article_path=?1`).bind(path).first();
  return {up:Number(row?.up||0),down:Number(row?.down||0)};
}
async function handleEvent(context){
  if(context.request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(!sameOrigin(context.request))return json({error:'origin_rejected'},403);
  let payload;try{payload=await bodyJson(context.request)}catch{return json({error:'invalid_request'},400)}
  const event=cleanText(payload?.event,50);
  if(!EVENT_ALLOWLIST.has(event))return json({error:'event_rejected'},400);
  const path=cleanPath(payload?.path);
  const detail=eventDetail(event,payload?.data);
  const day=new Date().toISOString().slice(0,10);
  await ensureSchema(context.env.DB);
  await context.env.DB.prepare(`INSERT INTO events_daily(day,event,path,detail,count)
    VALUES(?1,?2,?3,?4,1)
    ON CONFLICT(day,event,path,detail) DO UPDATE SET count=count+1`)
    .bind(day,event,path,detail).run();
  if(event==='page_view'){
    const clientId=cleanClientId(payload?.clientId);
    if(clientId){
      const salt=String(context.env.ANALYTICS_SALT||'trafficlab-daily-v1');
      const visitorHash=await hash(`${day}|${salt}|${clientId}`);
      await context.env.DB.prepare(`INSERT OR IGNORE INTO visitors_daily(day,visitor_hash) VALUES(?1,?2)`)
        .bind(day,visitorHash).run();
    }
  }
  return json({ok:true});
}
async function handleRating(context){
  const request=context.request;
  if(!['GET','POST'].includes(request.method))return json({error:'method_not_allowed'},405);
  await ensureSchema(context.env.DB);
  if(request.method==='GET'){
    const path=cleanPath(new URL(request.url).searchParams.get('path')||'/');
    return json({path,...await ratingCounts(context.env.DB,path)});
  }
  if(!sameOrigin(request))return json({error:'origin_rejected'},403);
  let payload;try{payload=await bodyJson(request)}catch{return json({error:'invalid_request'},400)}
  const path=cleanPath(payload?.path);
  const vote=payload?.vote===''?'':cleanText(payload?.vote,8);
  const clientId=cleanClientId(payload?.clientId);
  if(!['','up','down'].includes(vote)||!clientId)return json({error:'invalid_vote'},400);
  const salt=String(context.env.ANALYTICS_SALT||'trafficlab-rating-v1');
  const voterHash=await hash(`${salt}|${path}|${clientId}`);
  if(!vote){
    await context.env.DB.prepare(`DELETE FROM article_votes WHERE article_path=?1 AND voter_hash=?2`).bind(path,voterHash).run();
  }else{
    await context.env.DB.prepare(`INSERT INTO article_votes(article_path,voter_hash,vote,updated_at)
      VALUES(?1,?2,?3,?4)
      ON CONFLICT(article_path,voter_hash) DO UPDATE SET vote=excluded.vote,updated_at=excluded.updated_at`)
      .bind(path,voterHash,vote,new Date().toISOString()).run();
  }
  return json({ok:true,path,...await ratingCounts(context.env.DB,path)});
}
async function handleStats(context){
  if(context.request.method!=='GET')return json({error:'method_not_allowed'},405);
  if(!adminSameOrigin(context.request))return json({error:'origin_rejected'},403);
  if(!(await isAdminAuthenticated(context.request,context.env)))return json({error:'unauthorized'},401);
  await ensureSchema(context.env.DB);
  const url=new URL(context.request.url);
  const days=Math.max(1,Math.min(365,Number(url.searchParams.get('days'))||30));
  const since=new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10);
  const db=context.env.DB;
  const [summary,topPages,reads90,bookmarks,searches,ratings,daily,visitors]=await Promise.all([
    db.prepare(`SELECT event,SUM(count) AS count FROM events_daily WHERE day>=?1 GROUP BY event`).bind(since).all(),
    db.prepare(`SELECT path,SUM(count) AS views FROM events_daily WHERE day>=?1 AND event='page_view' GROUP BY path ORDER BY views DESC LIMIT 80`).bind(since).all(),
    db.prepare(`SELECT path,SUM(count) AS count FROM events_daily WHERE day>=?1 AND event='read_depth' AND detail='{"percent":90}' GROUP BY path ORDER BY count DESC LIMIT 80`).bind(since).all(),
    db.prepare(`SELECT path,detail,SUM(count) AS count FROM events_daily WHERE day>=?1 AND event='bookmark' GROUP BY path,detail ORDER BY count DESC LIMIT 120`).bind(since).all(),
    db.prepare(`SELECT detail,SUM(count) AS count FROM events_daily WHERE day>=?1 AND event='search' GROUP BY detail ORDER BY count DESC LIMIT 40`).bind(since).all(),
    db.prepare(`SELECT article_path AS path,
        SUM(CASE WHEN vote='up' THEN 1 ELSE 0 END) AS up,
        SUM(CASE WHEN vote='down' THEN 1 ELSE 0 END) AS down
      FROM article_votes GROUP BY article_path ORDER BY (up+down) DESC,up DESC LIMIT 100`).all(),
    db.prepare(`SELECT day,SUM(count) AS views FROM events_daily WHERE day>=?1 AND event='page_view' GROUP BY day ORDER BY day ASC`).bind(since).all(),
    db.prepare(`SELECT day,COUNT(*) AS unique_browsers FROM visitors_daily WHERE day>=?1 GROUP BY day ORDER BY day ASC`).bind(since).all()
  ]);
  return json({
    ok:true,days,since,
    summary:summary.results||[],
    topPages:topPages.results||[],
    reads90:reads90.results||[],
    bookmarks:bookmarks.results||[],
    searches:searches.results||[],
    ratings:ratings.results||[],
    daily:daily.results||[],
    visitors:visitors.results||[]
  });
}
async function handleStatsReset(context){
  if(context.request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(!adminSameOrigin(context.request))return json({error:'origin_rejected'},403);
  if(!(await isAdminAuthenticated(context.request,context.env)))return json({error:'unauthorized'},401);
  let payload;try{payload=await bodyJson(context.request)}catch{return json({error:'invalid_request'},400)}
  if(payload.confirm!=='RESET_STATS')return json({error:'confirmation_required'},400);
  await ensureSchema(context.env.DB);
  const db=context.env.DB;
  await db.batch([
    db.prepare(`DELETE FROM events_daily`),
    db.prepare(`DELETE FROM visitors_daily`),
    db.prepare(`DELETE FROM article_votes`)
  ]);
  return json({ok:true,reset:true,reset_at:new Date().toISOString()});
}
async function handleHealth(context){
  if(context.request.method!=='GET')return json({error:'method_not_allowed'},405);
  if(!adminSameOrigin(context.request))return json({error:'origin_rejected'},403);
  if(!(await isAdminAuthenticated(context.request,context.env)))return json({error:'unauthorized'},401);
  await ensureSchema(context.env.DB);
  return json({ok:true});
}

export async function onRequest(context){
  try{
    if(!context.env.DB)return json({error:'d1_binding_missing',binding:'DB'},503);
    const parts=Array.isArray(context.params.path)?context.params.path:[context.params.path].filter(Boolean);
    const route=parts.join('/').replace(/^\/+|\/+$/g,'');
    if(route==='event')return handleEvent(context);
    if(route==='rating')return handleRating(context);
    if(route==='stats')return handleStats(context);
    if(route==='stats/reset')return handleStatsReset(context);
    if(route==='health')return handleHealth(context);
    return json({error:'not_found'},404);
  }catch(error){
    console.error('TrafficLab API error',error);
    return json({error:'internal_error'},500);
  }
}
