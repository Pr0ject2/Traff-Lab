const PARTNERS = {
  "1win": { blockedCountries: new Set(["RU"]) },
  "poshfriends": { blockedCountries: new Set() }
};

function availability(country, slug) {
  const partner = PARTNERS[slug];
  if (!partner) return { available: false, reason: "unknown_partner" };
  if (!country || country === "T1") return { available: false, reason: "unknown_country" };
  if (partner.blockedCountries.has(country)) return { available: false, reason: "blocked_geo" };
  return { available: true, reason: null };
}

export async function onRequestGet(context) {
  const country = String(context.request.cf?.country || "").toUpperCase();
  const url = new URL(context.request.url);
  const requested = String(url.searchParams.get("partner") || "").trim().toLowerCase();

  let payload;
  if (requested) {
    const result = availability(country, requested);
    payload = {
      partner: requested,
      country: country || null,
      available: result.available,
      reason: result.reason
    };
  } else {
    payload = {
      country: country || null,
      partners: Object.fromEntries(
        Object.keys(PARTNERS).map(slug => {
          const result = availability(country, slug);
          return [slug, { available: result.available, reason: result.reason }];
        })
      )
    };
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}
