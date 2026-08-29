# TrafficLab — Cloudflare Pages deployment

Repository structure:

- `public/` — static site and Pages build output.
- `functions/` — Cloudflare Pages Functions (`/api/*` and protected `/admin/*`).

Cloudflare Pages settings:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `public`
- Root directory: leave blank / repository root

Required runtime configuration:

1. Bind the D1 database to the Pages project with variable name `DB`.
2. Add encrypted secret `ADMIN_PASSWORD` (at least 16 characters; a long unique password is recommended).
3. Redeploy after changing bindings or secrets.
4. Open `/admin/` and sign in with `ADMIN_PASSWORD`.

Admin security in v436:

- `/admin/` and all `/admin/*` assets are intercepted by Pages Functions before static files are served.
- The password exists only in the Cloudflare secret `ADMIN_PASSWORD`; it is not embedded in HTML or JavaScript.
- Successful login issues a host-only `HttpOnly; Secure; SameSite=Strict` cookie that expires after 8 hours.
- `/api/stats` and `/api/health` use the same authenticated server session.
- Five failed login attempts in a 15-minute window cause a 15-minute server-side lock for that client fingerprint. The raw IP address is not stored; D1 receives only a salted hash.
- Login and logout POST requests are restricted to same-origin requests and form bodies are size-limited.
- `ANALYTICS_ADMIN_TOKEN` is no longer required by v436 and can be removed after the new deployment is confirmed working.

The TrafficLab browser CMS is configured for GitHub repository `pr0ject2/Traff-Lab` and writes site changes under `public/`.
