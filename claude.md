# Ahmed Omani Auto Marketing — Portfolio Website

## Project Overview

B2B automotive marketing portfolio/catalog website for Ahmed Omani (automotive marketing specialist in Egypt). Static multi-page site (no build step) with dynamic content managed through Supabase and edited via a dedicated admin CMS.

- **Live Site**: Deployed on Vercel, auto-deploy from GitHub branch `claude/portfolio-website-redesign-y8p4kd`
- **Tech Stack**: Plain HTML/CSS/JS (no framework, no bundler) + Supabase (Postgres + Storage + Auth) + Vercel
- **Language**: Arabic (RTL) with IBM Plex Sans Arabic / Inter Tight fonts
- **Branding**: Red accent (`#E8192C`) used strictly as an accent (CTAs, active states, numerals) on one opinionated dark editorial theme — solid hairline surfaces, no glassmorphism. See "Design & Styling" below for the full 2026 redesign; `ao_settings.site_theme_mode`/`site_template` (dark/light, glass/flat) still exist as admin dropdowns and still work exactly as before, they just no longer change anything on the redesigned public pages (see that section's note on the retired toggle).

---

## Key Files

### Frontend (Static, public)
- **`index.html`** — Editorial landing page (2026 redesign, see "Design & Styling"): cinematic hero (flexible H1/H2/H3/paragraph text blocks + optional bg image/slideshow), static intro/positioning statement, trust stats, two catalog link tiles, "أعمالنا في الدعاية والإعلان" + "أعمالنا في التسويق" (unified editorial work-list, 4-slot layout cycle — see `workItemHtml()`), hardcoded services list, brand-values ticker (real marquee), process steps, videos, before/after, case studies, clients marquee, FAQ, CTA band, footer. Published `ao_pages` rows auto-inject into nav/footer.
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

**2026 editorial redesign** — the public site was fully rebuilt (design system, motion, and every section's markup/CSS/JS) to move away from the earlier glassmorphism look toward a premium automotive-creative-agency identity: near-black solid surfaces, hairline borders, sharp-ish radii, and red used only as a sparing accent. This replaced the previous dark/light + glass/flat four-theme system with one opinionated dark theme. `admin.html` and the Supabase schema were **not** touched by this redesign — it is a pure frontend restyle/rebuild; every `render*()` function's data bindings, every cart/WhatsApp/analytics id and global function name, and the `product.html?id=` URL contract are unchanged (see "Known Limitations" and the git history on branch `claude/portfolio-website-redesign-y8p4kd` for the exact commit).

### Public site: one dark editorial theme, all five files
`index.html`, `catalog.html`, `catalog-marketing.html`, `product.html`, and `page.html` now share the same token contract (previously `page.html` had its own separate warm-light palette; it was folded in as part of this redesign):
- Backgrounds `--p1:#0B0B0C` / `--p2:#141416` / `--p3:#1A1A1D`; text `--ink:#F5F5F2` (off-white, not pure white) with `--ink2`/`--ink3` at .64/.42 alpha; borders `--line`/`--line2`; accent `--red:#E8192C` (unchanged hue — brand equity) with `--red-d` hover and `--red-soft` for rare tinted fills.
- **Red-usage rule** (also written as a CSS comment in each file): red only on interactive elements (CTAs, active nav/tab/chip state, link hovers), on numerals inside stat/case-study callouts, and at most one thin accent rule/marker per section — never a background fill, never a glow color.
- **Surfaces**: `--card-bg`/`--glass-blur`/`--glass-border`/`--glass-shadow` token *names* were kept (so every component that referenced them didn't need individual edits) but now resolve to solid values — `--card-bg:var(--p2)`, `--glass-blur:none`, `--glass-border:var(--line)`, `--glass-shadow:none`. `.ambient-glow` (the old animated color-blob background) is now `display:none` everywhere; large photography with a `.media-duo` duotone filter is the replacement decorative texture on index.html.
- **Radius**: `--r:10px` (cards/images), `--rs:4px` (buttons/small UI), `--rp:4px` (repurposed from the old 999px pill value — this one change is what removed most pill-shaped buttons/badges/chips across the site; circular icon buttons like the WhatsApp float or social icons use a literal `border-radius:50%` and were unaffected).
- **Typography**: `IBM Plex Sans Arabic` (400/500/700) for all Arabic text, `Inter Tight` (`--font-lat`) for numerals/stat callouts — replaces the previous `Zain` font, loaded the same way (one Google Fonts `<link>` per file).
- **Legacy theme/template toggle**: `ao_settings.site_theme_mode` (dark/light) and `site_template` (glass/flat) admin dropdowns and columns still exist and still save correctly — they were deliberately left alone per the "never touch admin/schema for a frontend redesign" rule — but each public page now has `:root[data-theme="light"],:root[data-template="flat"]{}` (an intentionally empty override) so picking either setting no longer visually changes anything. If a light theme is ever wanted again, this is the block to give real values back.
- **Nav**: no longer a floating blurred pill. On `index.html` (the only page with hero content behind it) the nav is transparent over the hero and turns solid (`nav.solid`, toggled by the pre-existing scroll listener) once scrolled past. On `catalog.html`/`catalog-marketing.html`/`product.html`/`page.html` (no hero to float over) the nav is simply always solid — these pages never had a scroll listener for it, so making it conditionally-transparent there would have left it unreadable; keep it unconditionally solid if touching this again.

### Motion system
- The IntersectionObserver-based reveal engine (`initReveal()`, `.fade-up`/`.fade-up.visible`, `.stagger>:is(...):nth-child(n)` stagger delays) originally lived only in `index.html`; it's now ported to all five files (each has its own small copy — there's no shared JS file in this project). Two additional presentation variants exist on index.html: `.fade-up-lg` (larger translate, big editorial statements) and `.reveal-mask` (`clip-path` wipe, used for image/before-after reveals).
- **`.prod-card` is deliberately excluded** from the reveal observer on `catalog.html`/`catalog-marketing.html` — `renderGrid()` does a full `innerHTML` rebuild of `#prodGrid`/`#bsGrid` on every cart interaction (add/qty-change), so observing cards there would replay the fade-in on every click. Only the stable, non-reregenerated wrappers (`.cat-header-inner`, `.bs-sec`) get the reveal treatment on those two pages.
- `index.html`'s hero has its own dedicated entrance sequence, independent of the scroll-reveal observer, because it must animate on page load (it's already in view) not on scroll-into-view: `revealHeroStats()` adds `.lines-in`/`.media-in` classes to `#home` once real Supabase hero data has replaced the placeholder text, which drives CSS transitions on the h1/sub/buttons (see `.hero.lines-in ...` rules) and the hero-image scale-in.
- `initHeroParallax()` (index.html only) is an IntersectionObserver-gated `scroll` listener — the listener is only attached while `#home` intersects the viewport, and detached the moment it doesn't — that fades/lifts `.hero-inner` slightly as the hero scrolls past. It deliberately does not transform the hero background image itself (the image is sized exactly to its container; translating it would expose an empty edge without giving it deliberate oversize headroom).
- Portfolio editorial layout: `workItemHtml()` in `index.html` cycles every work item through 4 layout slots (`slot-0` full-width featured — always forced for the first item so there's one clear opener — `slot-1` offset two-column alternating side, `slot-2` full-width cinematic strip, `slot-3` split two-image pair) keyed by `index % 4`. Shared by both the grouped ads-collage (`renderAdsGroups()`) and the flat marketing-portfolio list — the underlying Supabase queries/grouping (`group_label`, `is_cover`, `sort_order`) are untouched, only the render template changed.

### Layout
- RTL (`dir="rtl"`) throughout, mobile-first CSS (base rules target ~390px, `min-width` media queries layer up tablet/desktop) for every section rebuilt in this redesign.
- `.container` centers content at a constrained max-width; full-bleed imagery (portfolio work media, hero background) is allowed to break out of it; body copy stays capped at a readable measure even on wide desktop.

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
