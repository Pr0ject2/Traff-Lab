const ADMIN_COOKIE='__Host-tl_admin';
const SESSION_TTL_SECONDS=8*60*60;
const LOGIN_WINDOW_SECONDS=15*60;
const LOGIN_MAX_FAILURES=5;
const LOGIN_BLOCK_SECONDS=15*60;

function textEncoder(){return new TextEncoder()}
function b64url(bytes){
  let s='';for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function safeEqual(a,b){
  a=String(a||'');b=String(b||'');
  if(!a||!b||a.length!==b.length)return false;
  let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);
  return out===0;
}
async function sha256(value){
  const digest=await crypto.subtle.digest('SHA-256',textEncoder().encode(String(value||'')));
  return b64url(new Uint8Array(digest));
}
async function sessionKey(env){
  const password=String(env.ADMIN_PASSWORD||'');
  const material=await crypto.subtle.digest('SHA-256',textEncoder().encode(`TrafficLab admin session v1\0${password}`));
  return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign']);
}
async function signSession(payload,env){
  const key=await sessionKey(env);
  const signature=await crypto.subtle.sign('HMAC',key,textEncoder().encode(payload));
  return b64url(new Uint8Array(signature));
}
function cookieValue(request,name){
  const raw=request.headers.get('cookie')||'';
  for(const part of raw.split(';')){
    const i=part.indexOf('=');if(i<0)continue;
    if(part.slice(0,i).trim()===name)return part.slice(i+1).trim();
  }
  return '';
}
export function adminConfigured(env){return String(env.ADMIN_PASSWORD||'').length>=16}
export async function verifyAdminPassword(candidate,env){
  if(!adminConfigured(env))return false;
  const [a,b]=await Promise.all([sha256(String(candidate||'')),sha256(String(env.ADMIN_PASSWORD||''))]);
  return safeEqual(a,b);
}
export async function createAdminSession(env){
  if(!adminConfigured(env))throw new Error('admin_not_configured');
  const exp=Math.floor(Date.now()/1000)+SESSION_TTL_SECONDS;
  const nonceBytes=new Uint8Array(18);crypto.getRandomValues(nonceBytes);
  const nonce=b64url(nonceBytes);
  const payload=`v1.${exp}.${nonce}`;
  const sig=await signSession(payload,env);
  return `${payload}.${sig}`;
}
export async function isAdminAuthenticated(request,env){
  if(!adminConfigured(env))return false;
  const token=cookieValue(request,ADMIN_COOKIE);
  const parts=token.split('.');
  if(parts.length!==4||parts[0]!=='v1')return false;
  const exp=Number(parts[1]);
  if(!Number.isInteger(exp))return false;
  const now=Math.floor(Date.now()/1000);
  if(exp<=now||exp>now+SESSION_TTL_SECONDS+60)return false;
  if(!/^[A-Za-z0-9_-]{20,40}$/.test(parts[2])||!/^[A-Za-z0-9_-]{40,60}$/.test(parts[3]))return false;
  const payload=parts.slice(0,3).join('.');
  const expected=await signSession(payload,env);
  return safeEqual(parts[3],expected);
}
export function adminSessionCookie(token){
  return `${ADMIN_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}
export function clearAdminSessionCookie(){
  return `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
export function sameOrigin(request){
  const target=new URL(request.url).origin;
  const origin=request.headers.get('origin');
  if(origin){try{return new URL(origin).origin===target}catch{return false}}
  if(request.headers.get('sec-fetch-site')==='same-origin')return true;
  const referer=request.headers.get('referer');
  if(referer){try{return new URL(referer).origin===target}catch{return false}}
  return false;
}
async function ensureRateSchema(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS admin_login_limits (
    client_hash TEXT PRIMARY KEY,
    window_started INTEGER NOT NULL,
    failures INTEGER NOT NULL,
    blocked_until INTEGER NOT NULL DEFAULT 0
  )`).run();
}
async function clientHash(request,env){
  const ip=(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,80);
  const ua=(request.headers.get('user-agent')||'').slice(0,180);
  return sha256(`TrafficLab login rate v1\0${String(env.ADMIN_PASSWORD||'')}\0${ip}\0${ua}`);
}
export async function loginRateState(request,env,db){
  await ensureRateSchema(db);
  const key=await clientHash(request,env);
  const now=Math.floor(Date.now()/1000);
  const row=await db.prepare(`SELECT window_started,failures,blocked_until FROM admin_login_limits WHERE client_hash=?1`).bind(key).first();
  if(row&&Number(row.blocked_until||0)>now){
    return {blocked:true,retryAfter:Math.max(1,Number(row.blocked_until)-now),key};
  }
  return {blocked:false,retryAfter:0,key,row:row||null};
}
export async function recordLoginFailure(db,key,row){
  const now=Math.floor(Date.now()/1000);
  let started=Number(row?.window_started||0),failures=Number(row?.failures||0);
  if(!started||now-started>LOGIN_WINDOW_SECONDS){started=now;failures=0}
  failures+=1;
  const blockedUntil=failures>=LOGIN_MAX_FAILURES?now+LOGIN_BLOCK_SECONDS:0;
  await db.prepare(`INSERT INTO admin_login_limits(client_hash,window_started,failures,blocked_until)
    VALUES(?1,?2,?3,?4)
    ON CONFLICT(client_hash) DO UPDATE SET window_started=excluded.window_started,failures=excluded.failures,blocked_until=excluded.blocked_until`)
    .bind(key,started,failures,blockedUntil).run();
  return {blocked:blockedUntil>now,retryAfter:blockedUntil>now?LOGIN_BLOCK_SECONDS:0,failures};
}
export async function clearLoginFailures(db,key){
  await db.prepare(`DELETE FROM admin_login_limits WHERE client_hash=?1`).bind(key).run();
}
