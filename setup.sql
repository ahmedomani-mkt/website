-- ============================================================
-- Ahmed Omani Website — Database Setup
-- افتح Supabase Dashboard → SQL Editor → الصق وشغّل
-- ============================================================

-- SETTINGS (row واحدة ثابتة)
CREATE TABLE IF NOT EXISTS ao_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone TEXT DEFAULT '+20 100 000 0000',
  whatsapp TEXT DEFAULT '201000000000',
  email TEXT DEFAULT 'info@ahmedomani.com',
  meta_pixel_id TEXT DEFAULT '',
  google_tag_id TEXT DEFAULT '',
  tiktok_pixel_id TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  admin_password TEXT DEFAULT 'omani2025',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HERO (row واحدة ثابتة)
CREATE TABLE IF NOT EXISTS ao_hero (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  badge TEXT DEFAULT 'متخصصون في قطاع السيارات منذ 2015',
  title TEXT DEFAULT 'شريكك في التسويق والدعاية لعالم الأوتوموتيف',
  subtitle TEXT DEFAULT 'تسويق إلكتروني متكامل + دعاية وإعلان أوفلاين من يافطة مركزك لحد الكرت الشخصي',
  btn1_text TEXT DEFAULT 'اكتشف خدماتنا',
  btn2_text TEXT DEFAULT 'واتساب مباشر',
  stat1_num TEXT DEFAULT '10+',
  stat1_label TEXT DEFAULT 'سنوات خبرة في السوق المصري',
  stat2_num TEXT DEFAULT '30+',
  stat2_label TEXT DEFAULT 'عميل في قطاع السيارات',
  stat3_num TEXT DEFAULT '500+',
  stat3_label TEXT DEFAULT 'مشروع منجز',
  stat4_num TEXT DEFAULT '2',
  stat4_label TEXT DEFAULT 'خدمة متكاملة رقمي + أوفلاين',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIO
CREATE TABLE IF NOT EXISTS ao_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'digital',
  stat_badge TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
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

-- FAQ
CREATE TABLE IF NOT EXISTS ao_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- PAGES (صفحات ديناميكية)
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

-- ── RLS ──────────────────────────────────────────────
ALTER TABLE ao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE ao_pages ENABLE ROW LEVEL SECURITY;

-- Public read + anon write (password gate في الـ UI)
CREATE POLICY "ao_settings_all" ON ao_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ao_hero_all" ON ao_hero FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ao_portfolio_all" ON ao_portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ao_clients_all" ON ao_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ao_faq_all" ON ao_faq FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ao_pages_all" ON ao_pages FOR ALL USING (true) WITH CHECK (true);

-- ── STORAGE BUCKET ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('ao-images', 'ao-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ao_storage_all" ON storage.objects
FOR ALL USING (bucket_id = 'ao-images') WITH CHECK (bucket_id = 'ao-images');

-- ── SEED DATA ────────────────────────────────────────
INSERT INTO ao_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO ao_hero (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO ao_clients (name, sort_order) VALUES
('KSH',1),('Nakamichi',2),('CARiMUSiC',3),('AL OSTORA',4),('MB WORLD',5),
('DR.BM',6),('ALPINA',7),('EL BARRAMY',8),('Sound Power',9),('AUTO GO',10),
('Cardiff',11),('EL-ARABY',12),('American Zone',13),('El Fayrouz',14),('EL KOPTAN',15),
('AL KHALIFA',16),('CARBENZ',17),('Engineering Ctr',18),('المتخصص',19),('Mnhena',20),
('M.HANAFY',21),('CRACKLE',22),('Motor Dynamics',23),('GT',24),('Ayman El-Husaini',25),
('ELSISI',26),('Three A Shell',27),('EL EMAN',28),('MECCA',29),('STG',30),
('التوأم',31),('EL-Sherif',32),('الدمياطي',33),('EL NASR',34)
ON CONFLICT DO NOTHING;

INSERT INTO ao_faq (question, answer, sort_order) VALUES
('هل تشتغلوا على مراكز الصيانة بس؟','لأ. بنشتغل مع كل قطاعات السيارات — مراكز صيانة، معارض سيارات، تجار قطع غيار، محلات اكسسوارات، وأي نشاط تجاري في عالم الأوتوموتيف.',1),
('إيه الفرق بين الحزمة الكاملة والخدمة الفردية؟','الحزمة الكاملة بتاخد فيها تسويق متكامل (سوشيال + إعلانات + تصميم + تصوير + تقارير) بسعر أفضل وتنسيق كامل. الخدمة الفردية للي محتاج حاجة بعينها.',2),
('إيه اللي بيشمله تجهيز الدعاية والإعلان الكامل للمركز؟','الحزمة بتشمل: يافطة وواجهة، كروت شخصية، Job Orders، يوني فورم، أعلام وبنرات، دواسات، فواحات — وكلها بهوية بصرية موحدة. وكمان بنقدر نساعدك في السيستم الإداري.',3),
('هل ممكن آخد الدعاية الأوفلاين بس من غير تسويق إلكتروني؟','أكيد. الخدمتين منفصلتين تمامًا. ممكن تاخد أي منهم منفردًا.',4),
('كام بيستغرق تنفيذ حزمة الدعاية الكاملة؟','من 10 لـ 21 يوم عمل حسب حجم الطلب ومراحل الموافقة على التصميم.',5),
('إيه هو السيستم الإداري اللي بتقدموه للمراكز؟','بنساعدك تنظم شغل المركز من خلال نماذج Job Order احترافية، جداول المواعيد، فواتير وإيصالات بهوية المركز.',6),
('هل بتشتغلوا برا القاهرة؟','أيوه، بنشتغل مع عملاء في كل أنحاء مصر. التواصل والتصميم أونلاين والمطبوعات بنوصلها لأي محافظة.',7),
('ليه أختارك بدل أي مكتب إعلانات عادي؟','لأننا متخصصين في قطاع السيارات بس — مش وكالة عامة. 10 سنين في السوق ده عارفين فيه احتياجات العميل ومنافسيه.',8),
('عايز أعرف الأسعار — بيبدأ من إيه؟','الأسعار بتختلف حسب حجم المشروع والخدمات المطلوبة. تواصل معنا وهنعملك عرض سعر خلال 24 ساعة.',9)
ON CONFLICT DO NOTHING;

INSERT INTO ao_portfolio (title, description, category, stat_badge, tags, sort_order) VALUES
('حملة Meta — مركز خدمة سيارات','زيادة الحجوزات 320% خلال 30 يوم بميزانية $2,000','digital','+320% مبيعات',ARRAY['Meta Ads','Service Center'],1),
('حملة Google — قطع غيار','1,200 ليد في شهر واحد بتكلفة $1.2 للـ lead','digital','1,200 Lead',ARRAY['Google Ads','Auto Parts'],2),
('سوشيال ميديا — معرض سيارات','نمو 50,000 متابع عضوي في 3 أشهر','digital','50K متابع',ARRAY['Social Media','Showroom'],3),
('حزمة هوية كاملة — مركز صيانة','يافطات + يوني فورم + كروت + job orders بهوية موحدة','print',NULL,ARRAY['Print','Branding'],4),
('يوني فورم ودواسات — سلسلة مراكز','تجهيز كامل لـ 3 فروع بهوية موحدة','print',NULL,ARRAY['Uniform','Floor Mats'],5),
('هوية كاملة — معرض سيارات','لوجو + هوية بصرية متكاملة + تطبيق على كل المواد','branding',NULL,ARRAY['Logo','Brand Identity'],6)
ON CONFLICT DO NOTHING;
