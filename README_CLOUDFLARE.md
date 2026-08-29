# TrafficLab — Cloudflare Pages deployment

Repository structure:

- `public/` — static site and Pages build output.
- `functions/` — Cloudflare Pages Functions (`/api/*`).

Cloudflare Pages settings:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `public`
- Root directory: leave blank / repository root

After the first deploy:

1. Create a D1 database and bind it to the Pages project as `DB`.
2. Add secret `ANALYTICS_ADMIN_TOKEN`.
3. Redeploy.
4. Test the `*.pages.dev` preview before attaching `traff-lab.com`.

The TrafficLab browser CMS is configured for GitHub repository `pr0ject2/Traff-Lab` and writes site changes under `public/`.
