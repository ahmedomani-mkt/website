-- ============================================================
-- Ahmed Omani Website — Database Schema Reference
-- This is a best-effort snapshot for bootstrapping a FRESH copy of this
-- project's schema (e.g. if migrating off the current shared Supabase
-- project — see claude.md → Security Notes). It is NOT the source of
-- truth for the live database; use the Supabase MCP `list_tables` /
-- `get_advisors` tools (or the dashboard) to inspect the real live schema.
-- ============================================================

-- SETTINGS (single row, id=1). No password column — admin auth is
-- handled entirely by Supabase Auth (auth.users), never store a
-- plaintext/hashed admin password in an app table again.
CREATE TABLE IF NOT EXISTS ao_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  meta_pixel_id TEXT DEFAULT '',
  google_tag_id TEXT DEFAULT '',
  tiktok_pixel_id TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  site_title TEXT DEFAULT '',
  site_description TEXT DEFAULT '',
  footer_text TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  logo_dark_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  stats_data JSONB DEFAULT '[]',
  page_texts JSONB DEFAULT '{}',
  section_colors JSONB DEFAULT '{}',
  global_colors JSONB DEFAULT '{}',
  wa_digital TEXT DEFAULT '', -- WhatsApp cart-order greeting, marketing catalog
  wa_offline TEXT DEFAULT '', -- WhatsApp cart-order greeting, ads catalog
  wa_full TEXT DEFAULT '',    -- WhatsApp single-product inquiry template ({product} placeholder)
  show_marketing_portfolio BOOLEAN DEFAULT TRUE,
  catalog_ads_image TEXT DEFAULT '',
  catalog_marketing_image TEXT DEFAULT '',
  site_bg_image TEXT DEFAULT '',
  site_theme_mode TEXT DEFAULT 'dark', -- 'dark' | 'light'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HERO (single row, id=1). title/subtitle are a legacy fallback used only
-- when text_blocks is empty.
CREATE TABLE IF NOT EXISTS ao_hero (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  badge TEXT DEFAULT '',
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  text_blocks JSONB DEFAULT '[]', -- [{tag:'h1'|'h2'|'h3'|'p', text}]
  bg_image_url TEXT DEFAULT '',
  hide_text BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIO (ads collage + marketing catalog, split by `catalog`)
CREATE TABLE IF NOT EXISTS ao_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  catalog TEXT DEFAULT 'ads', -- 'ads' | 'marketing'
  category TEXT DEFAULT 'digital',
  group_label TEXT, -- client/collection name; ads-collage groups by this on the live site
  stat_badge TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS (catalog.html / catalog-marketing.html / product.html)
CREATE TABLE IF NOT EXISTS ao_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  catalog TEXT DEFAULT 'ads', -- 'ads' | 'marketing'
  category TEXT DEFAULT 'digital',
  image_url TEXT DEFAULT '',
  price NUMERIC,
  price_note TEXT DEFAULT '',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS ao_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- BEFORE / AFTER showcase
CREATE TABLE IF NOT EXISTS ao_before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  before_image_url TEXT DEFAULT '',
  after_image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- FAQ — feature removed from the live site. Table kept for history but
-- intentionally has NO RLS policy at all (see below), so it's fully
-- locked/orphaned rather than deleted.
CREATE TABLE IF NOT EXISTS ao_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- PAGES (generic published pages, page.html?slug=...)
CREATE TABLE IF NOT EXISTS ao_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT DEFAULT '',
  sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEOS (فيديوهاتنا) ──────────────────────────────
CREATE TABLE IF NOT EXISTS ao_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  video_url TEXT NOT NULL,   -- YouTube / TikTok / Instagram / Facebook link
  thumb_url TEXT DEFAULT '', -- optional cover; YouTube auto-derives when empty
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CASE STUDIES (نتائج حقيقية بالأرقام) ─────────────
CREATE TABLE IF NOT EXISTS ao_case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  campaign_type TEXT DEFAULT 'paid', -- 'paid' | 'organic'
  metrics JSONB DEFAULT '[]',        -- up to 3 of {num, label}
  description TEXT DEFAULT '',
  proof_images JSONB DEFAULT '[]',   -- screenshot URLs (Ads Manager / Insights)
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANALYTICS EVENTS (dashboard: visits / cart-adds / orders) ────
-- Lightweight event log, NOT a full analytics product. Anyone (including
-- anonymous site visitors) may INSERT an event, but only the admin may
-- SELECT/DELETE — this is the opposite of every other table's RLS shape
-- above (public-read/admin-write), so it is NOT part of the generic
-- DO $$ loop below and gets its own policies.
CREATE TABLE IF NOT EXISTS ao_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('visit','add_to_cart','order')),
  product_id UUID REFERENCES ao_products(id) ON DELETE SET NULL,
  page TEXT DEFAULT '', -- 'index' | 'catalog' | 'catalog-marketing' | 'product'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ao_analytics_events_type_idx ON ao_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS ao_analytics_events_product_idx ON ao_analytics_events(product_id);

-- ── ADMIN USER ───────────────────────────────────────
-- Create exactly ONE dedicated Supabase Auth user for this site's admin
-- (do NOT gate write policies on "any authenticated user" if this project
-- is ever shared with another app again — always pin to one specific uid).
--
-- insert into auth.users (
--   instance_id, id, aud, role, email, encrypted_password,
--   email_confirmed_at, created_at, updated_at,
--   raw_app_meta_data, raw_user_meta_data,
--   confirmation_token, recovery_token, email_change_token_new, email_change,
--   is_sso_user, is_anonymous
-- ) values (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),           -- save this id, you'll need it below
--   'authenticated', 'authenticated',
--   'admin@example.com',
--   crypt('CHOOSE_A_STRONG_PASSWORD', gen_salt('bf')),
--   now(), now(), now(),
--   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
--   '', '', '', '', false, false
-- );
-- insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
-- values (gen_random_uuid(), '<the id above>', '<the id above>',
--   jsonb_build_object('sub','<the id above>','email','admin@example.com','email_verified',true),
--   'email', now(), now());

-- ── RLS ──────────────────────────────────────────────
-- Replace '<ADMIN_UID>' everywhere below with the auth.users.id created above.
ALTER TABLE ao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_faq ENABLE ROW LEVEL SECURITY; -- no policies created for this one — fully locked
ALTER TABLE ao_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_analytics_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE admin_id uuid := '<ADMIN_UID>';
BEGIN
  EXECUTE format('CREATE POLICY ao_analytics_events_insert ON public.ao_analytics_events FOR INSERT WITH CHECK (true)');
  EXECUTE format('CREATE POLICY ao_analytics_events_select ON public.ao_analytics_events FOR SELECT USING (auth.uid() = %L)', admin_id);
  EXECUTE format('CREATE POLICY ao_analytics_events_delete ON public.ao_analytics_events FOR DELETE USING (auth.uid() = %L)', admin_id);
END $$;

DO $$
DECLARE
  t text;
  admin_id uuid := '<ADMIN_UID>';
BEGIN
  FOREACH t IN ARRAY ARRAY['ao_settings','ao_hero','ao_portfolio','ao_products','ao_clients','ao_before_after','ao_pages','ao_videos','ao_case_studies'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = %L)', t || '_insert', t, admin_id);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = %L) WITH CHECK (auth.uid() = %L)', t || '_update', t, admin_id, admin_id);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = %L)', t || '_delete', t, admin_id);
  END LOOP;
END $$;

-- ── STORAGE BUCKET ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('ao-images', 'ao-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket is public, so object GET via the public URL bypasses these
-- policies entirely. These only gate the storage API (list/upload/
-- update/delete), which must stay admin-only.
DO $$
DECLARE admin_id uuid := '<ADMIN_UID>';
BEGIN
  EXECUTE format('CREATE POLICY ao_storage_select ON storage.objects FOR SELECT USING (bucket_id = ''ao-images'' AND auth.uid() = %L)', admin_id);
  EXECUTE format('CREATE POLICY ao_storage_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''ao-images'' AND auth.uid() = %L)', admin_id);
  EXECUTE format('CREATE POLICY ao_storage_update ON storage.objects FOR UPDATE USING (bucket_id = ''ao-images'' AND auth.uid() = %L) WITH CHECK (bucket_id = ''ao-images'' AND auth.uid() = %L)', admin_id, admin_id);
  EXECUTE format('CREATE POLICY ao_storage_delete ON storage.objects FOR DELETE USING (bucket_id = ''ao-images'' AND auth.uid() = %L)', admin_id);
END $$;

-- ── SEED DATA ────────────────────────────────────────
INSERT INTO ao_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO ao_hero (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Real client list as of this writing — safe to re-seed on a fresh project.
INSERT INTO ao_clients (name, sort_order) VALUES
('KSH',1),('Nakamichi',2),('CARiMUSiC',3),('AL OSTORA',4),('MB WORLD',5),
('DR.BM',6),('ALPINA',7),('EL BARRAMY',8),('Sound Power',9),('AUTO GO',10),
('Cardiff',11),('EL-ARABY',12),('American Zone',13),('El Fayrouz',14),('EL KOPTAN',15),
('AL KHALIFA',16),('CARBENZ',17),('Engineering Ctr',18),('المتخصص',19),('Mnhena',20),
('M.HANAFY',21),('CRACKLE',22),('Motor Dynamics',23),('GT',24),('Ayman El-Husaini',25),
('ELSISI',26),('Three A Shell',27),('EL EMAN',28),('MECCA',29),('STG',30),
('التوأم',31),('EL-Sherif',32),('الدمياطي',33),('EL NASR',34)
ON CONFLICT DO NOTHING;

-- Portfolio, products, before/after, and pages all contain real client work
-- and are not reproduced here as fabricated seed data — populate them
-- through admin.html after the schema is created.
