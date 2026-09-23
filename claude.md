# Ahmed Omani Auto Marketing — Portfolio Website

## Project Overview

B2B automotive marketing portfolio/catalog website for Ahmed Omani (automotive marketing specialist in Egypt). Static multi-page site (no build step) with dynamic content managed through Supabase and edited via a dedicated admin CMS.

- **Live Site**: Deployed on Vercel, auto-deploy from GitHub branch `claude/portfolio-website-redesign-y8p4kd`
- **Tech Stack**: Plain HTML/CSS/JS (no framework, no bundler) + Supabase (Postgres + Storage + Auth) + Vercel
- **Language**: Arabic (RTL) with Noto Kufi Arabic / Rubik fonts
- **Branding**: Red accent (`#E8192C`) on a public site with two independently-switchable axes — dark/light theme (`ao_settings.site_theme_mode`) and glass/flat template (`ao_settings.site_template`, glassmorphism blur-and-translucency vs. a flat/solid surface look), both admin dropdowns, four combinations total. Admin panel has its own separate light/dark toggle (unrelated to the public site's theme/template).

---

## Key Files

### Frontend (Static, public)
- **`index.html`** — Lean landing page: hero (flexible H1/H2/H3/paragraph text blocks + optional bg image), trust stats bar, two catalog link-cards, "أعمالنا في الدعاية والإعلان" (ads portfolio, grouped into full-bleed horizontal auto-scroll tracks per client group), "أعمالنا في التسويق" (marketing portfolio cards), "قبل وبعد" before/after showcase, clients grid, footer. Published `ao_pages` rows auto-inject into nav/footer.
- **`catalog.html`** — Ads/offline-marketing product catalog with cart + WhatsApp checkout.
- **`catalog-marketing.html`** — Digital-marketing service catalog, same cart/checkout pattern.
- **`product.html`** — Single product detail page (`product.html?id={uuid}`), image gallery, WhatsApp order.
- **`page.html`** — Generic published-page template (`page.html?slug={slug}`), renders `ao_pages.sections` (hero/text/cta blocks).
- **`admin.html`** — Admin CMS. Real Supabase Auth login (see Security below). Sections: hero, stats bar, ads/marketing portfolio (grouped by `group_label`, with group rename, bulk multi-image upload, per-project cover-image picker, and ▲▼ image reordering — see "Portfolio Projects" below), products catalog, clients, before/after, pages, section text overrides, section colors, settings.

### Assets
- **`assets/logo.png`** — Brand logo, used as favicon, nav/footer logo, and `og:image`.

### SEO / infra
- **`robots.txt`**, **`sitemap.xml`** — basic crawl directives (admin.html disallowed).
- **`vercel.json`** — security response headers (CSP, X-Frame-Options, etc.) applied to every route; also rewrites `/product-feed.csv` → `/api/product-feed`.
- **`api/product-feed.js`** — Vercel serverless function (Node, zero npm dependencies — uses the platform's built-in `fetch`). Generates the Meta Commerce Catalog product feed as CSV on every request, live from `ao_products`/`ao_settings` via Supabase's REST API (same anon key already public in every page — no new secret). Public, unauthenticated GET. See "Meta Commerce Catalog Feed" below.

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
- `site_theme_mode` (`'dark'|'light'`, default `'dark'`) — site-wide dark/light theme switch, read by every public page
- `site_template` (`'glass'|'flat'`, default `'glass'`) — site-wide glassmorphism-vs-flat surface template, orthogonal to `site_theme_mode` (see Design & Styling below)
- `site_bg_image` — optional ambient background photo shown blurred behind the glass panels (glass template only — ignored under the flat template; admin can also clear it back to the plain color background)
- `show_marketing_portfolio` — toggles the "أعمالنا في التسويق" section on index.html
- `catalog_ads_image`, `catalog_marketing_image` — cover images for the two catalog link-cards on index.html
- `wa_digital`, `wa_offline`, `wa_full` — WhatsApp message templates
- `ads_catalog_badges` (jsonb array of `{icon, text}`) — trust-badge pill row under `catalog.html`'s header (e.g. delivery/turnaround-time/free-design); `icon` is a bootstrap-icons name, empty array hides the row
- **No password column** — admin auth is handled entirely by Supabase Auth (`auth.users`), not this table.

#### `ao_hero` (single row, id=1)
- `badge`, `title`, `subtitle` (legacy fallback fields, still read if `text_blocks` is empty)
- `text_blocks` (jsonb) — ordered array of `{tag:'h1'|'h2'|'h3'|'p', text}`, the primary hero content source
- `bg_image_url`
- `hide_text` — hides the hero's text block entirely (image-only hero), admin checkbox is inverted ("إظهار النص")

#### `ao_portfolio`
- `title`, `image_url`, `catalog` (`'ads'|'marketing'`), `category`, `group_label` (client/collection grouping for the ads collage — index.html renders one horizontal track per distinct `group_label`), `stat_badge`, `description`, `is_active`, `sort_order`
- `is_cover` (boolean, default `false`) — marks one row within a `group_label` group as that project's thumbnail/cover. See "Portfolio Projects: Cover Image & Image Ordering" below for the full model (this column did not exist when the project launched; added 2026-09, see `setup.sql`'s migrations section for the `ALTER TABLE` needed on the live DB).

#### `ao_products`
- Product catalog rows: `title`, `image_url`, `price`, `price_note`, `category`, `catalog`, `description`, `details` (text), `images` (jsonb array of extra gallery URLs), `is_active`, `is_bestseller` (surfaces the product in the "الأكثر طلبًا" section on the catalog pages), `sort_order`

#### `ao_clients`
- `name`, `logo_url`, `is_active`, `sort_order`

#### `ao_before_after`
- `client_name`, `description`, `before_image_url`, `after_image_url`, `is_active`, `sort_order`

#### `ao_pages`
- `title`, `slug`, `meta_description`, `sections` (jsonb array of `{type:'hero'|'text'|'cta', data:{...}}`), `is_published`

#### `ao_faq`
- `question`, `answer`, `category` (`'عام'|'تسويق'`), `is_active`, `sort_order`
- Rendered as an accordion section on `index.html` (`id="faq"`, direct link `/#faq`), grouped under a sub-heading per category — `'تسويق'` questions are meant to answer how the social-media-management service works (how we run the page, how to get started, etc.), kept in the same section rather than a separate page. Standard public-read/admin-write RLS (this table previously had zero policies/was fully locked when the FAQ feature had been removed from the site; it was reactivated and re-added to the standard RLS loop).

#### `ao_analytics_events` — dashboard analytics (visits / cart-adds / orders)
- `event_type` (`'visit'|'add_to_cart'|'order'`), `product_id` (nullable FK → `ao_products.id`), `page` (`'index'|'catalog'|'catalog-marketing'|'product'|'page'`), `created_at`
- **RLS is inverted from every other table**: public **INSERT** (any visitor, including anonymous, can log an event), **SELECT/DELETE restricted to the admin** — the opposite of the public-read/admin-write pattern used everywhere else, because this table holds write-only telemetry, not editable content.
- Written by a fire-and-forget `logEvent(type, productId)` helper on every public page (`index.html`, `catalog.html`, `catalog-marketing.html`, `product.html`, `page.html`): one `'visit'` event per browser session (deduped via `sessionStorage['ao_visit_logged']`), one `'add_to_cart'` per `addToCart()` call on the catalog pages, one `'order'` per WhatsApp send (cart checkout on the catalog pages, or the single-product inquiry button on `product.html`).
- Read by `admin.html`'s dashboard (`loadAnalytics()`) — fetches all rows client-side and aggregates counts + a top-5-by-cart-adds product list in JS. This is a lightweight event log, not a real analytics product; if row volume ever becomes a real concern, move the aggregation into a Postgres view/RPC instead of pulling all rows client-side.

### Storage
- **Bucket**: `ao-images` (public read via direct object URL; API access — list/upload/update/delete — restricted to the admin user)
- **Paths**: `portfolio/`, `products/`, `clients/`, `hero/`, `branding/`

---

## Portfolio Projects: Cover Image & Image Ordering

There is no dedicated "project" table — a project (called a "group" in the code) is just every `ao_portfolio` row that shares the same `group_label` and `catalog='ads'`. `index.html`'s `renderAdsGroups()` groups the sort_order-ordered rows by `group_label` on the fly and renders one `pg-card` per group; clicking it opens the full-image gallery (`openPgGallery()` → `openProjectDetail()`). `admin.html`'s `openGroupManager()` is the equivalent admin view for one group, listing every photo row in it.

Two things about a group are editable beyond the individual photo rows, both added 2026-09:

### Cover image (thumbnail)
- Column: `ao_portfolio.is_cover` (boolean). At most one row per group should have `is_cover=true` at a time — `admin.html`'s `setCoverPhoto(id)` enforces this by clearing it on every other row in the group before setting it on the chosen one (two sequential `.update()` calls, not a single atomic transaction — acceptable for a single-admin CMS with no concurrent writers).
- `groupCover(list)` (defined once in `admin.html`, duplicated inline as a one-off `.find(...)||list[0]` in `index.html` since the two files don't share JS) resolves the cover: the flagged row, or the group's first row by `sort_order` if none is flagged. This fallback is what makes the column safe to add without a data backfill — every existing group behaves exactly as before until an admin explicitly picks a cover.
- Used for: the `pg-card` thumbnail on the public site (`index.html`'s `renderAdsGroups`), the group's thumbnail in the admin portfolio list (`admin.html`'s `renderPort`), and — see next paragraph — the project's saved description.
- **Why the description rides along with the cover**: a group's description text lives on one specific `ao_portfolio` row (there's nowhere else to put it, absent a real projects table) — historically always `groupPhotos[0]`, i.e. whichever row happened to sort first. `gm-desc` in `openGroupManager()` and the public gallery's blurb in `openPgGallery()` both now read/write the **cover** row's `description` instead of positional-first. This was a deliberate side effect of adding image reordering (see below): without it, reordering a group's images could silently move the saved description onto a different, empty row the moment a different photo became first. Once an admin sets an explicit cover, the description is pinned to that row regardless of how the images get reordered afterwards. A group that has never had a cover set still uses positional-first for both, same as before this feature existed.

### Image ordering within a project
- No new column — reuses the existing `sort_order` (which already determined display order within a group as a side effect of the query being `.order('sort_order')` and groups being built by iterating that already-sorted list). What's new is `admin.html` giving the admin a direct way to *change* it per-image instead of it only ever reflecting insert order.
- UI: `openGroupManager()`'s photo list has ▲/▼ buttons per photo (disabled at the group's first/last position). Each click calls `movePortImg(id, dir)` (`dir` is `-1` or `+1`), which finds that photo's immediate neighbor within the **same group** and swaps their `sort_order` values with two `.update()` calls, then reloads and reopens the modal.
- **Only rows within the clicked photo's own group are ever touched** — this is what keeps a group's position relative to other groups stable (a group's overall position in the marquee is an emergent property of "which group's rows have the lowest `sort_order` values", not a field of its own; reordering *within* the group must not change which numeric neighborhood its rows occupy, or the group could jump position in the marquee as an unintended side effect).
- **Duplicate/unset `sort_order` edge case**: if the two rows being swapped happen to already have equal `sort_order` (e.g. legacy rows that were never explicitly ordered, or two bulk-uploaded batches that collided), a plain swap is a no-op. `movePortImg` detects this (`a.sort_order===b.sort_order`) and first renumbers the *entire group* to a compact strictly-increasing sequence anchored at the group's current minimum `sort_order` (`base, base+1, base+2, ...`, matching the group's current display order) before performing the intended swap. This keeps the group's numeric neighborhood anchored at the same minimum it already had, so its position among other groups shouldn't move — but this isn't airtight against a truly pathological case (another group's row landing, by coincidence, inside the exact numeric gap this renumber now occupies) — considered acceptable given how the data actually gets created (bulk upload always appends strictly-increasing values at the current global max, so a group's own rows are rarely interleaved with another group's in practice). If a future agent needs this to be bulletproof, the real fix is a proper `ao_portfolio_projects` table with its own `sort_order` independent of image rows — a bigger migration than this feature warranted.
- The public gallery lightbox (`openPgGallery()` → `images: items.map(p => p.image_url)`) reflects this order directly — reordering in `admin.html` immediately changes the order photos appear in when a visitor opens the project.

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

### Public site: glassmorphism theme + flat/solid template
`index.html`, `catalog.html`, `catalog-marketing.html`, `product.html` share the same token-based design system (`admin.html` and `page.html` are NOT part of it — they keep their own separate look):
- CSS custom properties (`--p1/p2/p3` backgrounds, `--ink-rgb`/`--ink`/`--ink2`/`--ink3` text, `--line`/`--line2` borders, `--red-rgb`/`--red`/`--red-d` accent, `--card-bg`/`--glass-blur`/`--glass-border`/`--glass-shadow`/`--nav-bg` for the card/nav surface treatment) defined in `:root`, overridden by a `:root[data-theme="light"]` block for the light variant.
- Which theme is live is controlled entirely by `ao_settings.site_theme_mode` (admin dropdown) — resolved theme is cached to `localStorage` (`ao-site-theme`) and applied via an early inline `<head>` script on every page to avoid a flash of the wrong theme on load.
- **Template** is a second, orthogonal dimension on top of the theme: `ao_settings.site_template` (`'glass'` default | `'flat'`), toggled the same way (`document.documentElement.dataset.template='flat'`, cached to `localStorage` as `ao-site-template`, applied via its own early `<head>` script). A `:root[data-template="flat"]` block (plus a `:root[data-template="flat"][data-theme="light"]` variant for the shadow) redefines just the surface tokens — `--card-bg` becomes a flat `var(--p2)` instead of the translucent gradient, `--glass-blur:none`, `--glass-border` becomes a normal opaque line color, `--glass-shadow` drops the inset glass-sheen highlight for a plain drop shadow, `--nav-bg` becomes fully opaque — and hides the `.ambient-glow` color blobs and any admin-uploaded `site_bg_image` (glass-only feature, `applySiteBg()` no-ops when the flat template is active). Because every card/nav component already reads its surface treatment from these tokens rather than hardcoding it, the flat template requires no changes to individual component rules — all 4 files carry an identical override block. `applySiteTemplate()` must run before `applySiteBg()` in each page's load function so the flat-mode check sees the right `dataset.template` value.
- A fixed `.ambient-glow` layer with animated blurred color blobs sits behind every section in the glass template (sections use translucent backgrounds) — this is what makes the `backdrop-filter: blur()` glass cards actually read as glass instead of flat color; hidden entirely under the flat template. Admin can optionally set `site_bg_image` to put a real photo behind the blur instead of the plain color blobs (glass template only).
- Accent red is constant across both themes (`--red: #E8192C` / `rgb(232,25,44)`); the hover shade `--red-d` differs per theme (brighter on dark, darker on light) since it needs to stay visible against the theme's background.
- Border-radius tokens: `--r:22px` (cards), `--rs:14px` (small elements), `--rp:999px` (pills) — shared by both templates.

### Layout
- RTL (`dir="rtl"`), mobile-first responsive breakpoints at 768px/560px.
- `.container` centers content at a constrained max-width; a few elements (the ads-portfolio tracks, the floating trust-stats strip that straddles the hero's bottom edge) deliberately break out of normal flow for a full-bleed/overlapping look.

### Typography
- Public site: Rubik. Admin: Noto Kufi Arabic.

---

## WhatsApp Integration

Centralized WhatsApp number in `_waNum`, loaded from `ao_settings.whatsapp`. Message templates (`wa_digital`, `wa_offline`, `wa_full`) live in the same table. Buttons: hero CTAs, catalog checkout, floating WA button, footer.

---

## Meta Commerce Catalog Feed

`api/product-feed.js` is a Vercel serverless function (also reachable at `/product-feed.csv` via a `vercel.json` rewrite) that generates a Meta Commerce Catalog-compatible CSV **live** from `ao_products`/`ao_settings` on every request — there is no static/manually-edited feed file. It calls Supabase's REST API directly with `fetch` (no `@supabase/supabase-js`, no npm dependency, no build step — consistent with the rest of this project).

- **Included rows**: only `is_active=true` products that have both a numeric `price > 0` and an `image_url` — Meta rejects rows missing either, so those are silently excluded rather than fed with fake data. The response headers `X-Feed-Included` / `X-Feed-Skipped-No-Price` / `X-Feed-Skipped-No-Image` report the counts on every request, useful for debugging why a product isn't in the feed.
- **Columns**: `id, title, description, availability, condition, price, link, image_link, additional_image_link, brand, product_type`. `availability` is hardcoded `"in stock"` and `condition` `"new"` for every row — this is a made-to-order service/signage catalog with no stock-tracking field, not real inventory data.
- **`id` = `ao_products.id`** (the same UUID string), unmodified — this is deliberate: it's the exact same value already used as `content_ids` in every Meta Pixel event across `catalog.html`/`catalog-marketing.html`/`product.html`, which is what lets Meta match pixel events (ViewContent/AddToCart/Lead) back to catalog rows for dynamic ads and catalog-based optimization.
- **`link`** is built from the incoming request's own host header (`https://<host>/product.html?id=<uuid>`), so it resolves correctly on the production domain, a Vercel preview URL, or any future custom domain without code changes.
- **`brand`** comes from `ao_settings.site_title` (falls back to a hardcoded default only if that's empty).
- Uses the same public anon key already embedded in every page's HTML — safe for the same reason noted in Security Notes (RLS enforces public-read).

**Meta Commerce Manager setup** (manual, one-time, done by the client): Commerce Manager → Catalog → Data Sources → Add Items → Scheduled Feed → paste the feed URL → set fetch frequency (daily is enough; hourly wastes Meta's fetch quota since product data doesn't change that often) → Save.

---

## Deployment

- **Branch**: `claude/portfolio-website-redesign-y8p4kd` → Vercel auto-deploy.
- **Vercel project**: `website` (no custom domain attached as of this writing; production alias is `website-mu-umber.vercel.app`). If a custom domain is added later, update `robots.txt`'s `Sitemap:` line and `sitemap.xml`'s `<loc>` values to match.
- No build step; framework: static HTML; Node 24.x.
- `vercel.json` adds security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) to every response.

---

## Known Limitations & TODOs

- Deleting a portfolio/product/client row only deletes the DB row, not the underlying Supabase Storage object — uploaded images become orphaned in storage over time (harmless, but wastes storage quota).
- Portfolio "projects" (groups) aren't a real entity, just rows sharing a `group_label` string — there's no way to reorder the *projects* themselves (only the images within one project), and a project's overall position is an emergent side effect of its rows' `sort_order` values rather than something directly settable. See "Portfolio Projects: Cover Image & Image Ordering" above for the edge cases this creates.
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
├── api/
│   └── product-feed.js       Meta Commerce Catalog CSV feed (serverless)
├── robots.txt
├── sitemap.xml
├── vercel.json               Security headers + /product-feed.csv rewrite
├── setup.sql                 Best-effort schema reference (not authoritative)
├── claude.md                 This file
└── assets/
    └── logo.png              Brand logo (favicon, og:image, nav/footer)
```

---

## Contact & Support

- **Client**: Ahmed Omani (ahmedomani.mkt@gmail.com)
- **WhatsApp**: +201152501056
- **Supabase Project**: `lhunamvderddsplishtg` (dedicated to this site)
- **Vercel Team**: ahmed-omani-s-projects
