# Telemetry Design System — Ahmed Omani Auto Marketing

نظام تصميم عربي (RTL) لمواقع السيارات. الفكرة: **لوحة قياس سباقات (telemetry)** — أسود، أحمر متدرج، أخضر نيون للتفاصيل الحية فقط، شبكة هندسية خفيفة، أقواس حمراء على الألواح، أزرار مائلة.

## 1. المبادئ
1. **الأسود هو الأرضية.** الأقسام تتناوب بين `--p1` (#000) و`--gray` (#1b1b1b) لخلق كونتراست بين السيكشنات.
2. **الأحمر للتفاعل والتأكيد فقط** (أزرار، كلمة مميزة في العنوان، أقواس الألواح). دائمًا كتدرج `--rg`.
3. **الأخضر النيون للقراءات الصغيرة فقط:** تاجات (`FILE 01`, `ITEM 01`, `LAP 01`)، نقطة LIVE، الإكوالايزر. لا يُستخدم كخلفية.
4. **نص عربي لا يأخذ letter-spacing أبدًا** (يكسر وصل الحروف). التباعد للنصوص اللاتينية الصغيرة (mono) فقط.
5. **حواف شبه مربعة** (radius 2px)، خطوط رفيعة `rgba(255,255,255,.14)`، لا ظلال ولا زجاج.
6. **الحركة قليلة ومقصودة**، وتحترم `prefers-reduced-motion`.

## 2. Tokens (انسخها كما هي)

```css
:root{
  /* surfaces */
  --p1:#000; --p2:#0a0a0a; --p3:#111; --gray:#1b1b1b;
  /* ink */
  --ink-rgb:245,245,242; --ink:rgb(var(--ink-rgb));
  --ink2:rgba(var(--ink-rgb),.64); --ink3:rgba(var(--ink-rgb),.42);
  --line:rgba(var(--ink-rgb),.14); --line2:rgba(var(--ink-rgb),.24);
  /* red (accent) */
  --red-rgb:255,10,10; --red:rgb(255,10,10); --red-d:#b80000; --red-soft:rgba(255,10,10,.14);
  --rg:linear-gradient(135deg,#ff4a3a 0%,#ff0000 45%,#8f0000 100%);
  --race-red:#ff0a0a;
  /* neon / teal (readouts only) */
  --neon:#04F06A; --teal:#06A77D;
  /* misc */
  --wa:#25D366;
  --r:2px; --pad:clamp(20px,5vw,64px); --measure:640px;
  --ease:cubic-bezier(.16,1,.3,1);
  --mono:'Share Tech Mono',ui-monospace,Consolas,monospace;
  --font:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif;
  --font-display:'Big Shoulders Display','Archivo',sans-serif;
  --font-lat:'Archivo','Segoe UI',sans-serif;
}
```

> ملاحظة: الموقع الحالي لسه فيه أسماء قديمة (`--orange*`, `--race-orange`) قيمتها دلوقتي الأخضر. في مشروع جديد استخدم `--neon` و`--teal` مباشرة.

## 3. الخطوط
```html
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Share+Tech+Mono&family=Big+Shoulders+Display:wght@800;900&family=Archivo:wght@500;700&display=swap" rel="stylesheet">
```
| الدور | الخط | الاستخدام |
|---|---|---|
| عربي (عناوين ونص) | Tajawal 400/500/700/900 | كل النص العربي |
| قراءات / تاجات | Share Tech Mono | `ITEM 01`، `LAP 02`، التوقيتات، الأسعار |
| أرقام عدادات كبيرة | Big Shoulders Display | اختياري |
| لاتيني | Archivo | شعارات نصية ولاتيني |

**سلم العناوين:** `.sec-title` = `clamp(38px,7vw,84px)` وزن 700 وارتفاع سطر 1.02 · عنوان كتالوج = `clamp(26px,5.2vw,48px)` · نص فقرة 15px وارتفاع 1.75 بلون `--ink2`.

## 4. الخلفية والشبكة
```css
body,.tone-black,.tone-gray{
  background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
  background-size:64px 64px; background-position:-1px -1px;
}
.tone-black{background-color:var(--p1)} .tone-gray{background-color:var(--gray)}
```
تناوب الأقسام: عنصر يضيف `.tone-black` / `.tone-gray` بالتبادل على الأقسام المرئية.

## 5. المكوّنات

**كلمة مميزة في العنوان (تدرج أحمر)** — لازم padding رأسي وإلا الهمزة تتقص:
```css
.hl,.r{background:var(--rg);-webkit-background-clip:text;background-clip:text;color:transparent;padding:.32em 0 .06em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.sec-title{letter-spacing:0}
```

**أقواس الألواح** (أعلى يمين + أسفل شمال):
```css
.panel{position:relative;background:var(--p2);border:1px solid rgba(255,255,255,.14)}
.panel::before,.panel::after{content:'';position:absolute;width:18px;height:18px;border:2px solid var(--race-red);pointer-events:none;z-index:4}
.panel::before{top:-1px;right:-1px;border-left:0;border-bottom:0}
.panel::after{bottom:-1px;left:-1px;border-right:0;border-top:0}
```

**أزرار مائلة:**
```css
.btn{padding:14px 38px;border:0;color:#fff;font-weight:700;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%)}
.btn-primary{background:var(--rg)} .btn-secondary{background:rgba(255,255,255,.13)}
.btn-primary:hover{filter:brightness(1.12)}
```

**Eyebrow (شريطين أحمر + أخضر مائلين):**
```css
.eyebrow::before{content:'';width:22px;height:11px;transform:skewX(-22deg);
 background:linear-gradient(90deg,var(--race-red) 0 9px,transparent 9px 12px,var(--neon) 12px 22px)}
```

**رأس القسم:** خط `--teal` رفيع تحت العنوان: `.sec-head{border-bottom:1px solid var(--teal);padding-bottom:22px}`

**تاج قراءة (mono):**
```css
.tag{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--neon);background:rgba(0,0,0,.85);padding:5px 10px}
```

**كارت مشروع/منتج ("ملف"):** صورة 4:5 أو 1:1 + تاج `FILE 01` فوق + جسم فيه عنوان وصفوف `border-top:1px dashed rgba(255,255,255,.16)` + شريط تقدم `linear-gradient(90deg,#7a0000,#ff0000 72%,var(--neon))`.

**لوحة إحصائيات:** عدّاد بخط كبير أبيض + تاج `LAP 01` أخضر mono فوقه (بـ CSS counter).

**HUD للهيرو:** إطار رفيع فوق الصورة، تسمية `LIVE` (نقطة خضراء) و`REC 00:00:00` (عدّاد زمن الزيارة) و`CAM 01`.

**شريط التمرير = تاكومتر:** `linear-gradient(90deg,#fff,var(--neon) 55%,#ff0000)` بارتفاع 4px مع ترقيم خفيف.

**اللوجو:** يتحول وقت التشغيل لأبيض مع الإبقاء على الجزء الأحمر (canvas recolour في `racing.js` → `whitenLogo`).

**بلاطة لوجوهات العملاء:** خلفية بيضاء + `box-shadow:0 0 0 1px rgba(255,255,255,.18)` عشان أي لوجو يظهر.

## 6. الهيدر والمنيو
- ثابت، ارتفاع 64px، خلفية `rgba(0,0,0,.94)`، خط سفلي `--line`.
- نفس المنيو في كل الصفحات: الرئيسية · أعمالنا · خدماتنا · نبذة عنا · الكتالوج (قايمة منسدلة).
- القايمة المنسدلة: hover على الديسكتوب، وضغط/لمس على الموبايل (class `.open`)، حد علوي أحمر 2px.

## 7. الحركة والصوت
- **Reveal:** `IntersectionObserver` يضيف `.visible` على `.fade-up` (opacity + translateY(24px)، 0.8s بـ `--ease`).
- **موسيقى خلفية:** Web Audio (140 BPM، A-minor) بدون ملفات، تبدأ تلقائيًا أو عند أول لمسة، زرار عائم للكتم، وتخفت أثناء الفيديو.
- **عربية دريفت:** SVG مرسوم بالكود تعدّي كل ~15 ثانية سكرول، دخان canvas محدود عند العجل الخلفي، صوت موتور وصرير بالتحريك بين السماعتين.
- كل ده في `racing.js`، ويتحكم فيه من لوحة التحكم (كارت "المؤثرات").

## 8. قواعد الاستخدام
- نص عربي: لا letter-spacing. العناوين `letter-spacing:0`.
- أي عنصر بـ `overflow:hidden` وفيه نص متدرج: أضف padding رأسي (`.line-mask{padding-block:.36em;margin-block:-.36em}`).
- لا تضع الأخضر كخلفية ولا الأحمر كلون نص عادي طويل.
- موبايل: الهيرو يبقى تدفق عادي (بدون pin أو parallax) تحت 640px.
- كل صورة لازم أبعاد ثابتة (aspect-ratio) عشان الكروت تبقى متساوية.

## 9. هيكل الملفات
| ملف | الدور |
|---|---|
| `racing.css` | الثيم كله (tokens + مكوّنات) ويُحمَّل بعد CSS الصفحة فيعيد تلوين كل شيء |
| `racing.js` | الموسيقى، عربية الدريفت، تحويل اللوجو لأبيض، قايمة الكتالوج، روابط الصفحات |
| `index.html`, `catalog*.html`, `product.html`, `page.html` | الصفحات، وكلها تربط الملفين |
| `admin.html` | لوحة تحكم بنفس الهوية |
| `claude.md` | وصف قاعدة البيانات والـ CMS |

## 10. لبدء موقع جديد
1. انسخ `racing.css` + `racing.js` + `assets/logo.png` (غيّر اللوجو).
2. ضع الخطوط (القسم 3) و`<html lang="ar" dir="rtl">`.
3. ابنِ الأقسام بـ `<section class="tone-black|tone-gray">` و`.sec-head` + `.sec-title` (كلمة مميزة داخل `<span class="r">`).
4. الألواح بـ `.panel`، الأزرار بـ `.btn-primary`.
5. غيّر اللون الرئيسي من `--rg` و`--race-red` فقط لو عايز هوية تانية (الأخضر يفضل للقراءات).
6. شغّل `racing.js` أو احذف منه الموسيقى/الدريفت لو مش مناسبين للمجال.
