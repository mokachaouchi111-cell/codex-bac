# CODEX-BAC Mini App

منصة CODEX-BAC أصبحت الآن بنمط `SPA Multipage` داخل صفحة واحدة، مع تنقل سفلي احترافي يشبه التطبيقات الأصلية.

## المزايا الحالية

- Bottom Navigation ثابت:
  - `الرئيسية`
  - `المنهج`
  - `التحديات`
  - `الإشعارات`
  - `الملف الشخصي`
- صفحة الرئيسية:
  - عداد البكالوريا
  - إحصائيات التقدم
  - زر استكمال آخر درس (Last Read Lesson)
- صفحة المنهج:
  - اختيار المسار (علوم / رياضيات)
  - بطاقات مواد (حسب المجالات)
  - قائمة وحدات متسلسلة مع قفل/فتح حسب التقدم
  - تفاصيل الوحدة بالأركان الأربعة + منهجية الإجابة
  - بحث ذكي فوري
- صفحة التحديات:
  - Podium للثلاثة الأوائل (Top 3)
  - شارات رتب ديناميكية على الـ Podium + القائمة المحيطة + League Pill
  - Focus Zone يوضح ترتيب الطالب والفارق مع المركز الأعلى
  - قائمة محيطة مركزة (3 فوقك + أنت + 3 تحتك)
  - مؤشرات ضغط تنافسي (من يقترب منك / من يمكنك تجاوزه)
  - تبديل معايير الترتيب: XP / الانضباط / الإتقان / الكويز
- صفحة الإشعارات:
  - وحدات قيد الإطلاق وتواريخ الفتح
- صفحة الملف الشخصي:
  - هوية الطالب من Telegram (الاسم + الصورة عند التوفر)
  - نظام هوية متطور: `مبتدئ` -> `منضبط` -> `محارب دراسة` -> `أسطورة`
  - Badges عائمة لتعديل الشعبة والولاية بسرعة
  - Activity Heatmap لآخر 30 يوم + Streak Tracker
  - خزنة إنجازات بقواعد فتح صارمة
  - تحليلات أداء: Target vs Actual + Skill Radar
  - مهام يومية ذكية تتولد تلقائياً حسب المستوى ونقاط الضعف
  - مهمة تعويض عند كسر السلسلة (Smart Penalty + Recovery Mission)
  - Boss أسبوعي بمكافأة XP كبيرة
  - ملاحظات ذهبية شخصية محفوظة
  - تبديل Dark/Light
- نظام XP جديد:
  - Daily Login: +10 XP
  - قراءة درس (بعد دقيقتين): +20 XP
  - مراجعة ملخص: +10 XP
  - تمرين نموذجي: +30 XP
  - كويز 100%: +100 XP / كويز 80%+: +50 XP
  - إكمال وحدة كاملة: +250 XP
  - Streak Multiplier: 1.2x بعد 5 أيام متتالية
  - معادلة المستوى: `XP_required = 100 * (Level ^ 1.5)`
- Service Worker للتخزين المؤقت وتسريع التنقل.

## تخصيص شارات الرتب

يمكنك استبدال الشارات الحالية مباشرة من هذا المسار:

- `assets/ranks/rank-1-novice.svg`
- `assets/ranks/rank-2-rising.svg`
- `assets/ranks/rank-3-discipline.svg`
- `assets/ranks/rank-4-warrior.svg`
- `assets/ranks/rank-5-elite.svg`
- `assets/ranks/rank-6-legend.svg`

الربط البرمجي موجود في:

- `app.js` داخل `RANK_BADGE_ASSETS`

توزيع الشارات حسب المستوى:

- `1-5` => Novice
- `6-10` => Rising
- `11-15` => Discipline
- `16-22` => Warrior
- `23-29` => Elite
- `30+` => Legend

## تشغيل محلي

```powershell
py -m http.server 8080
```

ثم افتح:

`http://localhost:8080`

## إذا لم تظهر التحديثات في Telegram

1. افتح الرابط مع بارامتر نسخة جديد (مثال):  
   `https://codex-bac.mokachaouchi111.workers.dev/?v=8`
2. اغلق Mini App وافتحه من جديد.
3. عند كل نشر جديد، غيّر قيمة `BUILD_ID` في `app.js` لفرض تحديث Service Worker.

## ربط Telegram Mini App

1. انشر المشروع على استضافة HTTPS (Vercel/Netlify).
2. افتح `@BotFather` ثم إعدادات Mini App للبوت.
3. ضع رابط التطبيق HTTPS.
4. افتح البوت في Telegram واختبر الـ Mini App من الهاتف.

## ملفات المشروع

- `index.html` بنية الصفحات الخمس.
- `styles.css` تصميم الزجاجية الداكنة + Light mode + responsive.
- `data.js` المحتوى والمنهج.
- `app.js` منطق SPA والتفاعل الكامل.
- `sw.js` التخزين المؤقت.
- `achievements.json` مخطط JSON للأوسمة والـ visual unlocks.

## ربط Backend للنقاط (اختياري)

- عرّف endpoint قبل تحميل `app.js`:
  - `window.CODEX_XP_ENDPOINT = "https://your-api/track-xp"`
- عند كل حدث XP، التطبيق يرسل payload تلقائياً إلى backend مع:
  - `event`, `xp_gained`, `total_xp`, `level`, `timestamp`
