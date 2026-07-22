# Ahmed Omani Auto Marketing — Portfolio Website

## Project Overview

B2B automotive marketing portfolio/catalog website for Ahmed Omani (automotive marketing specialist in Egypt). Static multi-page site (no build step) with dynamic content managed through Supabase and edited via a dedicated admin CMS.

- **Live Site**: Deployed on Vercel, auto-deploy from GitHub branch `claude/portfolio-website-redesign-y8p4kd`
- **Tech Stack**: Plain HTML/CSS/JS (no framework, no bundler) + Supabase (Postgres + Storage + Auth) + Vercel
- **Language**: Arabic (RTL) with Noto Kufi Arabic / Rubik fonts
- **Branding**: Red accent (`#E8192C`) on a black-glass (iOS-style glassmorphism) public site, with a switchable light-glass variant — admin picks which one is live site-wide via `ao_settings.site_theme_mode`. Admin panel has its own separate light/dark toggle (unrelated to the public site's theme).

---

## Key Files

### Frontend (Static, public)
- **`index.html`** — Lean landing page: hero (flexible H1/H2/H3/paragraph text blocks + optional bg image), trust stats bar, two catalog link-cards, "أعمالنا في الدعاية والإعلان" (ads portfolio, grouped into full-bleed horizontal auto-scroll tracks per client group), "أعمالنا في التسويق" (marketing portfolio cards), "قبل وبعد" before/after showcase, clients grid, footer. Published `ao_pages` rows auto-inject into nav/footer.
- **`catalog.html`** — Ads/offline-marketing product catalog with cart + WhatsApp checkout.
- **`catalog-marketing.html`** — Digital-marketing service catalog, same cart/checkout pattern.
- **`product.html`** — Single product detail page (`product.html?id={uuid}`), image gallery, WhatsApp order.
- **`page.html`** — Generic published-page template (`page.html?slug={slug}`), renders `ao_pages.sections` (hero/text/cta blocks).
- **`admin.html`** — Admin CMS. Real Supabase Auth login (see Security below). Sections: hero, stats bar, ads/marketing portfolio (grouped by `group_label`, with group rename + bulk multi-image upload), products catalog, clients, before/after, pages, section text overrides, section colors, settings.

### Assets
- **`assets/logo.png`** — Brand logo, used as favicon, nav/footer logo, and `og:image`.
- **`assets/logo.svg`** — Vector variant (kept for potential future use; not currently referenced by any page).

### SEO / infra
- **`robots.txt`**, **`sitemap.xml`** — basic crawl directives (admin.html disallowed).
- **`vercel.json`** — security response headers (CSP, X-Frame-Options, etc.) applied to every route.

---

## Database (Supabase project `lhunamvderddsplishtg`)

This is a **dedicated Supabase project for this website only** — it replaced an earlier setup where the site's tables lived inside a shared "Soholi Store" project (that project also hosted an unrelated app's tables/functions/real users). The old project is still reachable at `knwnviglquxvvwknxbqa` and its `ao-images` storage bucket is still referenced by some existing image URLs (see Storage note below), but no new writes should ever target it.

### RLS model
Every `ao_*` table: **public SELECT**, **writes (INSERT/UPDATE/DELETE) restricted to one specific authenticated admin user** (`auth.uid() = '0001f508-792e-44e3-9cc8-9f7a54c29765'`), not "any authenticated user" — keep this pattern even though this project is no longer shared, since it's still meaningfully safer than a blanket authenticated-role check. Same pattern on `storage.objects` for the `ao-images` bucket (bucket itself is `public=true`, so public image URLs still work without auth; only the storage *API* — list/upload/update/delete — is admin-gated).

`ao_faq` is intentionally left with **zero policies** (RLS enabled, no policy = default-deny for everyone including admin) — the FAQ feature was removed from the live site; the table/data still exist but are fully locked down rather than deleted.

### Tables

#### `ao_settings` (single row, id=1)
- `whatsapp`, `phone`, `email` — contact info
- `site_title`, `site_description`, `footer_text`
- `meta_pixel_id`, `google_tag_id`, `tiktok_pixel_id` — tracking pixel IDs (validated client-side against `/^[A-Za-z0-9_-]{1,64}$/` in `safeTrackId()` before being interpolated into an injected `<script>` — do not remove that check, it's the only thing standing between a bad value in this table and stored XSS on every visitor)
- `facebook_url`, `instagram_url`, `tiktok_url`
- `stats_data` (jsonb) — trust-stats bar entries
- `page_texts` (jsonb) — section heading overrides
- `section_colors`, `global_colors` (jsonb)
- `logo_url` (main logo; also the dark-mode fallback), `logo_dark_url` (optional, used only when `site_theme_mode='dark'`), `favicon_url`
- `site_theme_mode` (`'dark'|'light'`, default `'dark'`) — site-wide glass theme switch, read by every public page
- `site_bg_image` — optional ambient background photo shown blurred behind the glass panels (admin can also clear it back to the plain color background)
- `show_marketing_portfolio` — toggles the "أعمالنا في التسويق" section on index.html
- `catalog_ads_image`, `catalog_marketing_image` — cover images for the two catalog link-cards on index.html
- `wa_digital`, `wa_offline`, `wa_full` — WhatsApp message templates
- **No password column** — admin auth is handled entirely by Supabase Auth (`auth.users`), not this table.

#### `ao_hero` (single row, id=1)
- `badge`, `title`, `subtitle` (legacy fallback fields, still read if `text_blocks` is empty)
- `text_blocks` (jsonb) — ordered array of `{tag:'h1'|'h2'|'h3'|'p', text}`, the primary hero content source
- `bg_image_url`
- `hide_text` — hides the hero's text block entirely (image-only hero), admin checkbox is inverted ("إظهار النص")

#### `ao_portfolio`
- `title`, `image_url`, `catalog` (`'ads'|'marketing'`), `category`, `group_label` (client/collection grouping for the ads collage — index.html renders one horizontal track per distinct `group_label`), `stat_badge`, `description`, `is_active`, `sort_order`

#### `ao_products`
- Product catalog rows: `title`, `image_url`, `price`, `price_note`, `category`, `catalog`, `description`, `details` (text), `images` (jsonb array of extra gallery URLs), `is_active`, `is_bestseller` (surfaces the product in the "الأكثر طلبًا" section on the catalog pages), `sort_order`

#### `ao_clients`
- `name`, `logo_url`, `is_active`, `sort_order`

#### `ao_before_after`
- `client_name`, `description`, `before_image_url`, `after_image_url`, `is_active`, `sort_order`

#### `ao_pages`
- `title`, `slug`, `meta_description`, `sections` (jsonb array of `{type:'hero'|'text'|'cta', data:{...}}`), `is_published`

#### `ao_faq` — orphaned, locked (see RLS note above), not read by any live page.

### Storage
- **Bucket**: `ao-images` (public read via direct object URL; API access — list/upload/update/delete — restricted to the admin user)
- **Paths**: `portfolio/`, `products/`, `clients/`, `hero/`, `branding/`

---

## Authentication

Admin login (`admin.html`) uses real **Supabase Auth** (`sb.auth.signInWithPassword`), not a client-side password comparison. There is one dedicated admin account, created specifically for this site (not shared with the other app in this Supabase project). To change the admin password, log into admin.html and use the "تغيير كلمة المرور" field in Settings — it calls `sb.auth.updateUser({password})`, a real server-side password change.

If the admin session is lost/locked, a new admin user can be provisioned by inserting into `auth.users`/`auth.identities` with a `pgcrypto`-hashed password and updating the four `auth.uid() = '...'` literals in the RLS policies (see migration `restrict_ao_tables_to_admin_writes` and `restrict_ao_images_storage_to_admin`) to the new user's id — or, preferably, use Supabase's dashboard/Auth API to manage the existing account rather than hand-rolling SQL again.

---

## Development Workflow

### Local Testing
```bash
# No build step required — serve any .html directly
python -m http.server 8000
# Visit http://localhost:8000/index.html
```
Local testing hits the real, live Supabase project (there's no separate dev DB) — be mindful that writes from a local session affect production data.

### Making Changes
1. Edit `.html` files locally.
2. Test against live Supabase.
3. Commit to `claude/portfolio-website-redesign-y8p4kd`.
4. Push to GitHub — Vercel auto-deploys.
5. New Supabase columns/tables: the Supabase MCP connector available in this environment is tied to a different account than the one hosting this project (`lhunamvderddsplishtg`) — it cannot see or migrate this database. Give the client an exact `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` statement to run themselves in the Supabase SQL Editor (dashboard → SQL Editor, on project `lhunamvderddsplishtg` specifically — easy to run it against the wrong project by mistake if they have more than one). Then update this file and `setup.sql` to match.

---

## Design & Styling

### Public site: glassmorphism theme
`index.html`, `catalog.html`, `catalog-marketing.html`, `product.html` share the same token-based dark/light glass design system (`admin.html` and `page.html` are NOT part of it — they keep their own separate look):
- CSS custom properties (`--p1/p2/p3` backgrounds, `--ink-rgb`/`--ink`/`--ink2`/`--ink3` text, `--line`/`--line2` borders, `--red-rgb`/`--red`/`--red-d` accent, `--card-bg`/`--glass-blur`/`--glass-border`/`--glass-shadow` for the frosted-glass cards) defined in `:root`, overridden by a `:root[data-theme="light"]` block for the light variant.
- Which variant is live is controlled entirely by `ao_settings.site_theme_mode` (admin dropdown) — resolved theme is cached to `localStorage` and applied via an early inline `<head>` script on every page to avoid a flash of the wrong theme on load.
- A fixed `.ambient-glow` layer with animated blurred color blobs sits behind every section (sections use translucent backgrounds) — this is what makes the `backdrop-filter: blur()` glass cards actually read as glass instead of flat color. Admin can optionally set `site_bg_image` to put a real photo behind the blur instead of the plain color blobs.
- Accent red is constant across both themes (`--red: #E8192C` / `rgb(232,25,44)`); the hover shade `--red-d` differs per theme (brighter on dark, darker on light) since it needs to stay visible against the theme's background.
- Border-radius tokens: `--r:22px` (cards), `--rs:14px` (small elements), `--rp:999px` (pills).

### Layout
- RTL (`dir="rtl"`), mobile-first responsive breakpoints at 768px/560px.
- `.container` centers content at a constrained max-width; a few elements (the ads-portfolio tracks, the floating trust-stats strip that straddles the hero's bottom edge) deliberately break out of normal flow for a full-bleed/overlapping look.

### Typography
- Public site: Rubik. Admin: Noto Kufi Arabic.

---

## WhatsApp Integration

Centralized WhatsApp number in `_waNum`, loaded from `ao_settings.whatsapp`. Message templates (`wa_digital`, `wa_offline`, `wa_full`) live in the same table. Buttons: hero CTAs, catalog checkout, floating WA button, footer.

---

## Deployment

- **Branch**: `claude/portfolio-website-redesign-y8p4kd` → Vercel auto-deploy.
- **Vercel project**: `website` (no custom domain attached as of this writing; production alias is `website-mu-umber.vercel.app`). If a custom domain is added later, update `robots.txt`'s `Sitemap:` line and `sitemap.xml`'s `<loc>` values to match.
- No build step; framework: static HTML; Node 24.x.
- `vercel.json` adds security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) to every response.

---

## Known Limitations & TODOs

- Deleting a portfolio/product/client row only deletes the DB row, not the underlying Supabase Storage object — uploaded images become orphaned in storage over time (harmless, but wastes storage quota).
- No contact form — WhatsApp only.
- Arabic only (no i18n).
- `setup.sql` is a best-effort reference snapshot of the schema, not a source of truth. The Supabase MCP tools in this environment cannot see this project (see Development Workflow), so there is no automated way to introspect the live schema — when in doubt, ask the client to confirm via the Supabase dashboard, or infer it from what `admin.html`/the public pages actually read and write.

---

## Security Notes

- **Supabase anon key**: embedded in every page's HTML (standard for a Supabase-backed static site) — safe *only* because RLS enforces public-read/admin-write on every table (see RLS model above). Any new `ao_*` table must get the same treatment (public select policy + admin-only insert/update/delete policies keyed to the specific admin `auth.uid()`) — never leave a new table on a default-allow or `USING(true)` policy.
- **Admin auth**: real Supabase Auth session (JWT), not a client-side secret comparison. Do not reintroduce a password stored in a plain `ao_settings` column or a hardcoded fallback password in `admin.html` — both existed historically and were both exploitable (RLS read + `sessionStorage` gate had no server-side check at all).
- **Tracking pixel IDs**: user-editable via admin Settings, then interpolated into an inline `<script>` on every public page load. `safeTrackId()` (defined in `index.html`, `catalog.html`, `catalog-marketing.html`, `product.html`) must run before any pixel ID is used this way — it's the last line of defense if `ao_settings` write access were ever compromised again.
- **Storage bucket** `ao-images` is public for object *reads* (that's required for image URLs to render) but the storage API itself (listing, uploading, deleting) is admin-gated — don't loosen this back to a blanket policy.
- **Image URLs from the old project**: some `image_url`/`logo_url` values still point at the old `knwnviglquxvvwknxbqa.supabase.co` bucket (images weren't re-uploaded during the project migration, only the database was). Any *new* upload through admin.html lands in the current project's bucket automatically — this only affects images uploaded before the migration.

---

## Files & Directories

```
website/
├── index.html              Main landing page
├── catalog.html             Ads/offline catalog + cart
├── catalog-marketing.html   Digital-marketing catalog + cart
├── product.html             Single product detail page
├── page.html                Generic published-page template
├── admin.html               Admin CMS (Supabase Auth-gated)
├── robots.txt
├── sitemap.xml
├── vercel.json               Security headers config
├── setup.sql                 Best-effort schema reference (not authoritative)
├── claude.md                 This file
├── .agents/skills/gsap-animated-frontend/
├── skills-lock.json
└── assets/
    ├── logo.png              Brand logo (favicon, og:image, nav/footer)
    └── logo.svg
```

---

## Contact & Support

- **Client**: Ahmed Omani (ahmedomani.mkt@gmail.com)
- **WhatsApp**: +201152501056
- **Supabase Project**: `lhunamvderddsplishtg` (dedicated to this site)
- **Vercel Team**: ahmed-omani-s-projects
