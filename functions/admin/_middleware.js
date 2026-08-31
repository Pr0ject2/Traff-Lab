import {
  adminConfigured,verifyAdminPassword,createAdminSession,isAdminAuthenticated,
  adminSessionCookie,clearAdminSessionCookie,sameOrigin,loginRateState,
  recordLoginFailure,clearLoginFailures
} from '../_admin-auth.js';

function nonce(){const b=new Uint8Array(16);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('')}
function headers(extra={}){
  return new Headers({
    'cache-control':'no-store, max-age=0',
    'content-type':'text/html; charset=utf-8',
    'x-content-type-options':'nosniff',
    'x-frame-options':'DENY',
    'referrer-policy':'no-referrer',
    'permissions-policy':'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
    'cross-origin-opener-policy':'same-origin',
    'cross-origin-resource-policy':'same-origin',
    'x-robots-tag':'noindex, nofollow, noarchive',
    ...extra
  });
}
function loginPage(message='',status=200,retryAfter=0){
  const n=nonce();
  const h=headers({
    'content-security-policy':`default-src 'none'; style-src 'nonce-${n}'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`
  });
  if(retryAfter)h.set('retry-after',String(retryAfter));
  const alert=message?`<div class="alert">${escapeHtml(message)}</div>`:'';
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>TrafficLab Admin</title><style nonce="${n}">
  :root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172822;background:#f2eee6}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#f8f5ef 0,#f2eee6 55%,#ebe4d9 100%)}.card{width:min(430px,100%);padding:30px;background:#fffdf9;border:1px solid #d8cfc1;border-radius:18px;box-shadow:0 20px 60px rgba(30,52,43,.11)}.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.brand img{width:45px;height:45px;padding:6px;border-radius:12px;background:#123d33}.brand b{display:block;font-size:18px}.brand span{display:block;margin-top:2px;color:#7a817d;font-size:11px}h1{margin:0 0 8px;font:700 30px/1.08 Georgia,"Times New Roman",serif;color:#17382f}p{margin:0 0 22px;color:#64716c;font-size:14px;line-height:1.55}label{display:grid;gap:7px;color:#3c4e47;font-size:12px;font-weight:700}input{width:100%;height:46px;padding:0 13px;border:1px solid #cfc6b8;border-radius:10px;background:#fff;color:#172822;font:inherit}input:focus{outline:3px solid rgba(28,100,78,.12);border-color:#629483}button{width:100%;min-height:46px;margin-top:13px;border:0;border-radius:10px;background:#164c3f;color:white;font:750 14px/1 inherit;cursor:pointer}button:hover{background:#103f35}.alert{margin:0 0 16px;padding:11px 12px;border:1px solid #e5bcbc;border-radius:10px;background:#fff0f0;color:#8b3434;font-size:12px;line-height:1.45}.foot{margin-top:18px;color:#929993;font-size:10.5px;text-align:center}
  </style></head><body><main class="card"><div class="brand"><img src="/assets/trafficlab-flask.svg" alt=""><div><b>TrafficLab</b><span>Защищённая админка</span></div></div><h1>Вход</h1><p>Введите пароль администратора. Сессия действует 8 часов и хранится только в защищённой HttpOnly-cookie.</p>${alert}<form method="post" action="/admin/login" autocomplete="on"><label>Пароль<input name="password" type="password" maxlength="256" minlength="1" autocomplete="current-password" required autofocus></label><button type="submit">Войти</button></form><div class="foot">TrafficLab · закрытый раздел</div></main></body></html>`;
  return new Response(html,{status,headers:h});
}
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function redirect(location,cookie=''){
  const h=headers({'location':location,'content-type':'text/plain; charset=utf-8'});
  if(cookie)h.append('set-cookie',cookie);
  return new Response('Redirecting',{status:303,headers:h});
}
async function readPassword(request){
  const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(type!=='application/x-www-form-urlencoded')throw new Error('type');
  const declared=Number(request.headers.get('content-length')||0);if(declared>2048)throw new Error('large');
  const text=await request.text();if(new TextEncoder().encode(text).byteLength>2048)throw new Error('large');
  const password=new URLSearchParams(text).get('password')||'';
  if(password.length>256)throw new Error('large');
  return password;
}
function secureStaticResponse(response){
  const h=new Headers(response.headers);
  h.set('cache-control','no-store, max-age=0');
  h.set('content-security-policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://api.github.com; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
  h.set('x-frame-options','DENY');h.set('x-content-type-options','nosniff');h.set('referrer-policy','no-referrer');
  h.set('permissions-policy','accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()');
  h.set('cross-origin-opener-policy','same-origin');h.set('cross-origin-resource-policy','same-origin');h.set('x-robots-tag','noindex, nofollow, noarchive');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}

export async function onRequest(context){
  const {request,env}=context;
  const url=new URL(request.url);
  const path=url.pathname.replace(/\/{2,}/g,'/');
  if(!adminConfigured(env))return loginPage('Админ-доступ ещё не настроен на сервере.',503);
  if(!env.DB)return loginPage('Серверная база для защиты входа недоступна.',503);

  if(path==='/admin/logout'){
    if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:headers({'allow':'POST'})});
    if(!sameOrigin(request))return new Response('Forbidden',{status:403,headers:headers()});
    return redirect('/admin/',clearAdminSessionCookie());
  }

  if(path==='/admin/login'){
    if(request.method==='GET'){
      if(await isAdminAuthenticated(request,env))return redirect('/admin/');
      return loginPage();
    }
    if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:headers({'allow':'GET, POST'})});
    if(!sameOrigin(request))return loginPage('Запрос отклонён.',403);
    const rate=await loginRateState(request,env,env.DB);
    if(rate.blocked)return loginPage('Слишком много неудачных попыток. Попробуйте позже.',429,rate.retryAfter);
    let password='';try{password=await readPassword(request)}catch{return loginPage('Не удалось обработать форму входа.',400)}
    if(!(await verifyAdminPassword(password,env))){
      const result=await recordLoginFailure(env.DB,rate.key,rate.row);
      if(result.blocked)return loginPage('Слишком много неудачных попыток. Вход временно заблокирован.',429,result.retryAfter);
      return loginPage('Неверный пароль.',401);
    }
    await clearLoginFailures(env.DB,rate.key);
    const token=await createAdminSession(env);
    return redirect('/admin/',adminSessionCookie(token));
  }

  if(!(await isAdminAuthenticated(request,env)))return loginPage();
  if(!['GET','HEAD'].includes(request.method))return new Response('Method Not Allowed',{status:405,headers:headers({'allow':'GET, HEAD'})});
  return secureStaticResponse(await context.next());
}
