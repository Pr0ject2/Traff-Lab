const PARTNER_URL = "https://1w.run/?p=4o8v";
const BLOCKED_COUNTRIES = new Set(["RU"]);

function html(message, status = 451) {
  return new Response(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Партнёрская программа | TrafficLab</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8f4eb;color:#17342d;font:16px/1.6 Arial,sans-serif}.box{max-width:580px;padding:28px 30px;background:#fffdf9;border:1px solid #d8d0c2;border-top:4px solid #17342d;border-radius:10px}h1{margin:0 0 12px;font:500 30px/1.15 Georgia,serif}p{margin:0 0 16px;color:#5c665f}a{color:#6f482b;font-weight:700}</style></head><body><main class="box"><h1>Переход недоступен для этого GEO</h1><p>${message}</p><a href="/guides/choose-program/">Вернуться к выбору партнёрской программы</a></main></body></html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function onRequest(context) {
  const country = String(context.request.cf?.country || "").toUpperCase();
  if (!country || country === "T1") {
    return html("Не удалось надёжно определить страну посетителя, поэтому внешний переход не выполняется.", 403);
  }
  if (BLOCKED_COUNTRIES.has(country)) {
    return html("TrafficLab не выполняет прямой переход в выбранную партнёрскую программу для посетителей из России.", 451);
  }
  return new Response(null, {
    status: 302,
    headers: {
      "location": PARTNER_URL,
      "cache-control": "no-store, max-age=0",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}
