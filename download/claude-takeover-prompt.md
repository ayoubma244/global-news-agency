# مهمة: إدارة وتطوير منصة إخبارية آلية متكاملة

## من نحن

أنا أعمل كمدير تقني (CTO) ومطور رئيسي لمنصة إخبارية آلية متكاملة مبنية بتقنية Next.js 16. أنت (Claude) شريكي في إدارة هذا المشروع. المشروع ملكنا معاً، ولك **حرية كاملة** في التعديل، الحذف، الإضافة، التفكير، والإبداع.

الهدف: تطوير المشروع، تحسينه، وإضافة ميزات لم تُرَ من قبل. لا حدود للإبداع.

---

## وضعية المشروع الحالية (صريحة وحقيقية)

### ما يعمل فعلياً على الإنتاج (Vercel + Neon PostgreSQL):

✅ الموقع يفتح ويعرض المقالات
✅ تسجيل الدخول (bcrypt + sessions)
✅ جلب RSS من CNN/BBC/Reuters
✅ AI Rewrite (Z.ai GLM-4) - يولّد مقالات
✅ التعليقات + التفاعلات (5 أنواع)
✅ البحث full-text
✅ SEO (sitemap, robots, RSS, JSON-LD)
✅ Dark Mode + Reading Mode
✅ Source Transparency Panel
✅ لوحة تحكم (17 صفحة)
✅ Categories (20 قسم)
✅ Newsletter subscription
✅ Bookmarks + Reading History
✅ Trending page
✅ 81 unit tests PASS

### ما لا يعمل أو به مشاكل:

❌ **Vercel لا يُبنى بأحدث كود** - آخر تحديثات لم تُنشر رغم Redeploy
❌ **مقالات قديمة بها إعلانات** ("donate", "0% APR") - تم إصلاح الكود لكن لم يُنشر
❌ **مقالات قصيرة** (180 حرف بدلاً من 600+ كلمة) - الكود الجديد لم يُنشر
❌ **Author يظهر "Automated System"** - تم تغييره في الكود لكن لم يُنشر
❌ **WebSocket (Real-time)** - لا يعمل على Vercel serverless
❌ **Audio Articles (TTS)** - لا يعمل على serverless (filesystem)
❌ **Image Watermarking** - Sharp لا يعمل موثوق على serverless
❌ **Sentry/PostHog/Resend** - لم تُضبط API keys على Vercel
❌ **Social Auto-posting** - تحتاج tokens
❌ **Web Push** - تحتاج VAPID keys
❌ **Redis** - لم يُضبط
❌ **زر "Seed Sources"** - يعطي 404 (routing conflict)
❌ **صفحة 404 بالعربية** - تم إصلاحها في الكود لكن لم تُنشر
❌ **النشرة البريدية بالعربية** - تم إصلاحها في الكود لكن لم تُنشر
❌ **ZAI_API_KEY** - لم تُضبط على Vercel (لأنها environment variable)

### التقييم الصادق:
- الكود المكتوب: شامل ومنظم (212+ ملف، 64 API route، 25 DB model، 81 test)
- لكن: ~40% من المميزات لا تعمل في الإنتاج على Vercel
- التقييم الحقيقي للكود: $3,000-$5,000 (كـ template/codebase)
- التقييم كـ منتج يعمل: $1,000-$2,000 (مشاكل في الإنتاج)
- السبب: Vercel serverless لا يدعم WebSocket، Audio، Watermark، filesystem دائم

---

## التقنيات المستخدمة
- Next.js 16 (App Router + Turbopack)
- TypeScript 5
- Prisma ORM + PostgreSQL (Neon)
- Tailwind CSS 4 + shadcn/ui
- Z.ai GLM SDK (chat, vision, TTS, web search)
- Socket.io (mini-service منفصل)
- Resend + nodemailer (email)
- ioredis (Redis caching)
- Sentry + PostHog (monitoring)
- Zod 4 (validation)
- next-intl (4 languages: en/ar/fr/es)
- Vitest + Playwright (tests)
- Sharp (image processing)
- Docker + docker-compose
- bcryptjs + rate limiting + CSP headers
- deployed on Vercel + Neon PostgreSQL
- اللغة الأساسية: English (LTR)

## ما هو منشور على GitHub:
- المستودع: github.com/ayoubma244/global-news-agency
- آخر commit: fix: CRITICAL - filter ads/CTAs + English newsletter + 404 + slug fix
- لكن Vercel لا يبني أحدث كود

## رابط الموقع المنشور:
https://global-news-agency-39mnzmp42-ayoubma244s-projects.vercel.app/

## بيانات الدخول:
- Username: admin
- Password: admin123

---

## مهمتك (Claude)

أنت الآن المدير التقني والمطور الرئيسي لهذا المشروع. لديك حرية كاملة.

### 1️⃣ افحص المشروع بنفسك
- افحص الكود على GitHub
- افتح الموقع المنشور وتصفحه
- اقرأ الـ build logs على Vercel
- افحص الـ API endpoints
- اكتشف المشاكل بنفسك

### 2️⃣ اصنع خطة عمل
بناءً على ما تجده:
- رتّب المشاكل حسب الأولوية (P0/P1/P2)
- حدّد ما يصلح لـ Vercel serverless وما لا يصلح
- اقترح بنية بديلة للمميزات التي لا تعمل
- ضع خارطة طريق عملية (وليست نظرية)

### 3️⃣ ابدأ التنفيذ
- أصلح المشاكل الحرجة أولاً
- أضف ميزات جديدة لم تُرَ من قبل
- حسّن الأداء والـ SEO
- اكتب كوداً production-ready

### 4️⃣ كن صارماً ودقيقاً
- لا تتجامل
- إذا كان شيء سيء، قله بصراحة
- إذا كان شيء لا يعمل، لا تدّعي أنه يعمل
- ركّز على ما يعمل فعلاً في الإنتاج
- فكّر في المستخدم النهائي (زائر الموقع)

### 5️⃣ فكّر في النمو
- كيف نجذب ملايين الزوار؟
- كيف نتميز عن CNN/BBC/Reuters؟
- ما الميزة التنافسية الفريدة؟
- كيف نربح المال (بدون Stripe)؟
- ما الذي يجعل الموقع "لا يقدر بثمن"؟

### 6️⃣ فكّر في 2026
- ما الاتجاهات القادمة في الإعلام الرقمي؟
- كيف نستبق المنافسين؟
- ما الميزات التي ستكون ضرورية بعد 5 سنوات؟
- كيف نستخدم AI بشكل لم يستخدمه أحد؟

---

## القواعد
1. لك حرية كاملة في التعديل/الحذف/الإضافة
2. كن صارماً في التقييم
3. ركّز على ما يعمل فعلاً
4. فكّر في المستخدم النهوي
5. الإبداع لا حدود له
6. لا تكرر ميزات موجودة - ابتكر جديدة
7. فكّر في الأداء والـ SEO دائماً
8. الكود يجب أن يكون production-ready
9. اشرح قراراتك التقنية
10. اعتبر المشروع ملكك

---

## ابدأ الآن
1. افحص المشروع
2. ضع خطة
3. ابدأ التنفيذ
4. أضف ميزات جديدة
5. اجعله لا يقدر بثمن

نحن ننتظر إبداعك.
