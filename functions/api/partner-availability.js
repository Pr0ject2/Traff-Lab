const BLOCKED_COUNTRIES = new Set(["RU"]);

export async function onRequestGet(context) {
  const country = String(context.request.cf?.country || "").toUpperCase();
  const available = Boolean(country) && !BLOCKED_COUNTRIES.has(country) && country !== "T1";
  return new Response(JSON.stringify({ available, country: country || null }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}
