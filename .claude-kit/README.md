# Claude Kit — نظام العمل المستخلص

مستخرج من جلسة بناء موقع Ahmed Omani (25 سبتمبر ← 17 أكتوبر 2026) + git history (75 commit من أغسطس). **مش ملخص محادثة**: قواعد وإجراءات مع مصدر وثقة لكل واحدة. حدود الأدلة في `docs/evidence-and-gaps.md`.

## المحتوى
```
CLAUDE.md                      تعليمات عامة قصيرة فقط
.claude/rules/                 قواعد حسب نوع الملف (rtl-arabic, visual-consistency, tracking-and-ads)
.claude/skills/                7 مهارات (كل واحدة لها دليل في السجل)
  brief-to-requirements · design-direction · ui-build · fix-and-verify · visual-qa · ship-and-verify · ads-tracking-audit
scripts/visual-qa.js           فحص Playwright بـ wheel حقيقي (جُرّب فعلًا)
docs/                          المنهج، سجل التصحيحات، الأنماط والتعارضات، checklists، قوالب، workflow، prompts، الأدلة
```
**ليه مفيش Skills للـ Architecture / Backend / Database / Security / Code Review / Performance؟** ما ظهرش في الأدلة طلب ولا إجراء متكرر لها، فمخلقتهاش. بيتضافوا لما يظهر دليل في مشروع جديد (§الصيانة).

## الاستخدام في مشروع جديد
```bash
cp -r .claude-kit/CLAUDE.md .claude-kit/.claude .claude-kit/scripts .claude-kit/docs <مشروع-جديد>/
mkdir -p <مشروع-جديد>/projects/<اسم>   # وحط فيه NOTES.md من docs/templates.md
```
لو المشروع فيه `CLAUDE.md` أو `.claude/` بالفعل: **ادمج يدويًا ولا تستبدل** (الـ skills بأسمائها فريدة؛ CLAUDE.md اقرأه وأضف الأقسام الناقصة).
بعدها اتبع `docs/project-bootstrap.md` من المرحلة 0. لتجربة الاستدعاء: اطلب بالاسم ("استخدم fix-and-verify على…") أو سيختارها Claude من الوصف.

## كيف تعمل الأجزاء مع بعض
- `CLAUDE.md` يُحمَّل دائمًا: قواعد عامة قصيرة (التواصل، النطاق، قواعد الأدلة، التحقق).
- `rules/` تنطبق تلقائيًا على أنواع ملفات معينة (`paths:` في الرأس).
- `skills/` تُحمَّل عند الحاجة حسب الوصف، وتشير للـ rules والـ docs والسكربت.
- `docs/` مرجع وقوالب؛ مش بيتحمّل تلقائيًا.

## الصيانة (منع التراكم المتضارب)
1. بعد كل مشروع: املأ `projects/<name>/NOTES.md`. فيه أي قاعدة جديدة.
2. **ترقية قاعدة لـ `CLAUDE.md`/`rules`** بشرط: ظهرت في مشروعين، أو تصحيح صريح متكرر. تُكتب مع (المصدر · النطاق · الثقة · التاريخ).
3. عند تعارض: وثّقه في `docs/recurring-patterns.md` مع السياق، ولا تعدّل الاثنين بصمت.
4. مرة كل مشروع: احذف قواعد بلا حقول المصدر/الثقة، وقواعد ثبت إنها خاصة بمشروع.
5. مهارة جديدة فقط لو في إجراء متكرر + دليل. وصفها يتحقق بـ: "هل هتتشغّل لوحدها صح من الوصف؟".
6. غيّر `evidence-and-gaps.md` في كل مراجعة (إيه اللي فحصته، وإيه اللي لأ).
