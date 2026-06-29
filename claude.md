# Ahmed Omani Auto Marketing — Portfolio Website

## Project Overview

Complete B2B automotive marketing portfolio website for Ahmed Omani (automotive marketing specialist in Egypt). Single-file architecture with dynamic content management via Supabase.

- **Live Site**: Deployed on Vercel with auto-deploy from GitHub branch `claude/portfolio-website-redesign-y8p4kd`
- **Tech Stack**: HTML/CSS/JS (no build tools) + Supabase + Vercel
- **Language**: Arabic (RTL) with Noto Kufi Arabic font
- **Branding**: Red accent (#E8192C), dark/light hybrid theme

---

## Key Files

### Frontend (Static)
- **`index.html`** — Main landing page with hero, services, portfolio, testimonials, clients, FAQ, contact
  - Dynamic content loading from Supabase
  - Fixed sidebar (desktop) + responsive mobile nav
  - Published pages auto-inject into nav + footer
  - IDs: `#navLinks`, `#mobileNavList`, `#ftLinks` for dynamic content

- **`page.html`** — Dynamic page template for user-created pages
  - URL: `page.html?slug={slug}`
  - Loads published pages from `ao_pages` table
  - Render functions: `renderHeroSec()`, `renderTextSec()`, `renderCtaSec()`
  - **Critical Fix**: Render functions read from `s.data||s` (nested structure) + normalize `btn_link`/`btn_href` and `body`/`content` field names

- **`admin.html`** — Admin CMS panel
  - Sidebar with grouped navigation (240px, SVG icons)
  - Dashboard with colored stat cards
  - Sections: hero, stats, features, WA messages, portfolio, clients, testimonials, FAQ, pages, page texts, settings
  - Client logo upload to Supabase Storage (`ao-images/clients/`)
  - Pages quick-publish toggle

### Assets
- **`assets/logo.svg`** — Professional AO logo (SVG, used as favicon + footer)
- **`assets/og.png`** — OG image for social sharing (not yet created)

---

## Database (Supabase)

### Tables

All tables have RLS enabled with `FOR ALL USING (true)` (permissive, anon can read/write).

#### `ao_settings`
Central configuration table. Columns:
- `whatsapp` (TEXT) — WhatsApp number for all WA buttons
- `phone`, `email` (TEXT) — Contact info in footer
- `site_title`, `site_description` (TEXT) — Meta tags
- `footer_text` (TEXT) — Footer copyright text
- `meta_pixel_id`, `google_tag_id`, `tiktok_pixel_id` (TEXT) — Tracking pixels
- `stats_data` (JSONB) — Array of stats: `[{icon, num, label}]`
- `features_data` (JSONB) — Array of features: `[{label, icon, title, desc}]`
- `testimonials_data` (JSONB) — Array of testimonials: `[{name, title, quote, avatar}]`
- `page_texts` (JSONB) — Section headings: `{srv_title, srv_sub, port_title, cl_title, cl_sub, faq_title, faq_sub, ct_title, ct_desc}`
- `wa_digital`, `wa_offline`, `wa_full` (TEXT) — WA message templates for each service

#### `ao_pages`
User-created pages. Columns:
- `id` (UUID, PK)
- `title`, `slug` (TEXT)
- `meta_description` (TEXT)
- `sections` (JSONB) — Array of sections: `[{type: 'hero'|'text'|'cta', data: {...}}]`
- `is_published` (BOOLEAN) — Default: `false` (toggle in admin)
- `created_at`, `updated_at` (TIMESTAMP)

#### `ao_portfolio`, `ao_clients`, `ao_faq`
Static seed data. Columns:
- `id`, `title`, `description`, `is_active`, `sort_order`, etc.
- Portfolio: `category`, `image_url`, `stat_badge`, `tags`
- Clients: `name`, `logo_url`
- FAQ: `question`, `answer`

#### `ao_hero`
Hero section text (optional, can override in admin). Columns:
- `badge`, `title`, `subtitle` (TEXT)
- `btn1_text`, `btn2_text` (TEXT)

### Storage
- **Bucket**: `ao-images` (public)
- **Paths**:
  - `clients/{logo_name}` — Client logos uploaded from admin

---

## Critical Bugs (Fixed)

### Bug 1: Page Content Not Rendering ✅
**Cause**: `page.html` render functions read directly from `s.title`, `s.body` but admin saves nested in `s.data.title`, `s.data.content`.

**Fix** (page.html):
```js
function renderHeroSec(s){
  var d = s.data || s;           // Read from nested structure
  var btnHref = d.btn_href || d.btn_link || '';  // Normalize field name
  // Use d.title, d.subtitle, btnHref instead of s.*
}
```

### Bug 2: Pages Not in Header Nav ✅
**Cause**: `renderPagesLinks()` only added to footer, not nav.

**Fix** (index.html):
```html
<ul class="nav-links" id="navLinks">...</ul>
<ul id="mobileNavList">...</ul>
```

Updated `renderPagesLinks()` to inject into all three targets:
```js
function renderPagesLinks(list){
  var ft = document.getElementById('ftLinks');
  var nl = document.getElementById('navLinks');
  var mn = document.getElementById('mobileNavList');
  list.forEach(function(p){
    var href = 'page.html?slug=' + encodeURIComponent(p.slug);
    if(ft) ft.appendChild(a);      // Footer
    if(nl) nl.appendChild(li);     // Desktop nav
    if(mn) mn.appendChild(li);     // Mobile nav
  });
}
```

---

## Development Workflow

### Local Testing
```bash
# No build step required — serve index.html directly
python -m http.server 8000
# Visit http://localhost:8000
```

### Making Changes
1. Edit `.html` files locally
2. Test with live Supabase (real DB)
3. Commit to `claude/portfolio-website-redesign-y8p4kd`
4. Push to GitHub — auto-deploys to Vercel

### Adding Features
- New sections/components: Edit `index.html` HTML + CSS
- New admin controls: Add form inputs + JS handlers in `admin.html`
- New Supabase fields: Update table schema in `setup.sql`, then apply via Supabase dashboard or MCP tools

---

## Design & Styling

### Color Palette
```css
--red: #E8192C              /* Primary action, accent */
--red-d: #C0111F            /* Hover state */
--red-a: rgba(232,25,44,.1) /* Background tint */
--black: #0A0A0A            /* Dark mode bg */
--white: #FFFFFF            /* Text, cards */
--text2: #555555            /* Secondary text */
--text3: #999999            /* Tertiary text */
```

### Layout
- **Desktop** (≥768px): Fixed left sidebar (62px) + full nav + 2-col layouts
- **Tablet** (≥600px): Single column, no sidebar, collapsed nav
- **Mobile**: Single column, hamburger menu, stacked buttons
- **Container**: `max-width: 1200px` centered with 5% padding

### Typography
- Font: Noto Kufi Arabic (wght 400–900)
- Headings: 900 weight, clamp() for fluid sizing
- Body: 400–600 weight, 1.8–1.9 line height

### Animations
- **Entrance**: `fade-up` class with IntersectionObserver (300ms delay)
- **Hover**: Transform + shadow on buttons, cards
- **Scroll**: Fixed sidebar active state follows scroll position
- **GSAP**: Skill available for advanced animations (installed but not yet used)

---

## WhatsApp Integration

Centralized WhatsApp number in `_waNum` variable. Updated dynamically from Supabase `ao_settings.whatsapp`.

**Message Templates** (in `ao_settings`):
- `wa_digital` — Service inquiry: Digital marketing
- `wa_offline` — Service inquiry: Offline advertising
- `wa_full` — Service inquiry: Full package

**Button Locations**:
- Hero section call-to-action
- Service pillar CTAs
- Contact section WA options
- Floating WA button (bottom right)
- Footer social links

---

## Deployment

### GitHub → Vercel
- Branch: `claude/portfolio-website-redesign-y8p4kd`
- Auto-deploy enabled
- Latest deployment: `dpl_GpCr6uk6szna2SCcpiPnnMuPfVMJ`

### Vercel Config
- No build step required
- Framework: Static HTML
- Environment: Node 24.x

---

## Known Limitations & TODOs

### Not Yet Implemented
- [ ] `assets/og.png` — Create OG image for social sharing
- [ ] Contact form — Currently all contact via WhatsApp only
- [ ] Blog/News section — Not in scope
- [ ] Analytics dashboard — Supabase logs only
- [ ] Email notifications — WhatsApp only
- [ ] Multi-language — Arabic only

### Nice-to-Haves
- [ ] Page slug validation (alphanumeric only)
- [ ] Bulk client logo upload
- [ ] Portfolio image optimization (next/image)
- [ ] Service-specific landing pages (e.g., `/services/digital`)
- [ ] Client testimonial form (public submission)
- [ ] SEO sitemap + robots.txt

---

## Troubleshooting

### Pages not showing content?
1. Check `ao_pages` table — ensure `sections` JSON is valid
2. Verify `is_published = true`
3. Inspect page.html render functions — look for `s.data||s` fallback

### Pages not in nav?
1. Verify `#navLinks` and `#mobileNavList` exist in index.html
2. Check `renderPagesLinks()` is called in `loadSite()`
3. Supabase query: `SELECT title, slug FROM ao_pages WHERE is_published=true`

### WhatsApp buttons broken?
1. Check `_waNum` value in console
2. Verify `ao_settings.whatsapp` is set in Supabase
3. Test URL: `https://wa.me/{number}?text={message}`

### Supabase not loading?
1. Check network tab in DevTools
2. Verify anon key in `SB_KEY` (should match `.env` if exists)
3. Check RLS policies — should be `FOR ALL USING (true)`

---

## Security Notes

- **Supabase Anon Key**: Embedded in HTML (intentional for static site, uses RLS for auth)
- **RLS Policies**: All permissive (`USING (true)`) — data is public
- **Client Uploads**: Stored in public bucket, validated by file extension
- **Admin Panel**: No authentication (assumed internal use only)

---

## Getting Started (New Dev)

1. **Clone & install**: `git clone ... && cd website`
2. **Run locally**: `python -m http.server 8000` → `localhost:8000`
3. **Edit**:
   - Landing page: `index.html`
   - New pages template: `page.html`
   - Admin CMS: `admin.html`
4. **Test with live Supabase**: All changes sync in real-time
5. **Commit & push**: Vercel deploys automatically

---

## Files & Directories

```
website/
├── index.html           Main landing page
├── page.html           Dynamic page template
├── admin.html          Admin CMS panel
├── setup.sql           Database schema (reference only)
├── claude.md           This file
├── .agents/
│   └── skills/
│       └── gsap-animated-frontend/  GSAP animation skill
├── skills-lock.json    Skill dependencies
└── assets/
    └── logo.svg        Brand logo
```

---

## Contact & Support

- **Client**: Ahmed Omani (ahmedomani.mkt@gmail.com)
- **WhatsApp**: +201152501056
- **Supabase Project**: knwnviglquxvvwknxbqa
- **Vercel Team**: ahmed-omani-s-projects
