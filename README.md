<<<<<<< HEAD
# French Pronunciation Coach

اپ تمرین تلفظ فرانسه — React + Vite.

## راه‌اندازی محلی (اختیاری، برای تست قبل از آپلود)

```bash
npm install
npm run dev
```

بعد آدرس `http://localhost:5173` رو باز کن.

---

## آپلود روی GitHub

1. یه ریپازیتوری جدید بساز روی [github.com/new](https://github.com/new) — مثلاً اسمش `french-pronunciation-coach` (public یا private، فرقی نداره).
2. **مهم:** موقع ساخت ریپو، تیک "Add a README" رو **نزن** (چون خودمون README داریم).
3. توی ترمینال، داخل همین پوشه پروژه:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main
```

به جای `USERNAME` و `REPO-NAME` اسم خودت و ریپو رو بذار.

---

## آنلاین کردن (Deploy) — دو راه

### راه ۱: GitHub Pages (رایگان، خودکار)

توی این پروژه یه فایل `.github/workflows/deploy.yml` هست که خودش بعد از هر push، اپ رو build و deploy می‌کنه. فقط باید یه بار GitHub Pages رو فعال کنی:

1. توی ریپوی GitHub برو به **Settings → Pages**
2. زیر "Build and deployment" → Source رو بذار روی **GitHub Actions**
3. صبر کن تا اولین push (که همین الان کردی) اجرا بشه — توی تب **Actions** ریپو می‌تونی پیشرفتش رو ببینی
4. بعد از اتمام، آدرس اپت این شکلیه:
   `https://USERNAME.github.io/REPO-NAME/`

هر بار که بعداً کد رو عوض کنی و `git push` کنی، خودش دوباره deploy می‌شه.

### راه ۲: Vercel (رایگان، ساده‌تر و سریع‌تر)

1. برو [vercel.com](https://vercel.com) و با اکانت GitHub وارد شو
2. **Add New → Project** رو بزن
3. ریپوی `french-pronunciation-coach` رو انتخاب کن → **Import**
4. تنظیمات پیش‌فرض (Vite رو خودش تشخیص می‌ده) رو نگه دار → **Deploy**
5. چند ثانیه بعد یه لینک مثل `https://french-pronunciation-coach.vercel.app` بهت می‌ده

Vercel معمولاً سریع‌تر و بی‌دردسرتره؛ GitHub Pages رایگان‌تر و کاملاً داخل خود GitHub می‌مونه. هر دو کار می‌کنن.

---

## نکات مهم درباره این نسخه

- **ذخیره‌سازی:** پیشرفت کاربر (streak، امتیازها، تاریخچه) با `localStorage` مرورگر ذخیره می‌شه — یعنی روی هر دستگاه/مرورگر جدا ذخیره می‌شه، نه روی سرور مشترک. اگه کاربر کش مرورگرش رو پاک کنه، پیشرفتش از بین می‌ره.
- **تحلیل تلفظ شبیه‌سازی‌شده‌ست:** این نسخه به یه API واقعی تشخیص گفتار وصل نیست. امتیازها بر اساس تاریخچه تمرین کاربر تولید می‌شن، نه تحلیل واقعی صدا. تابع `analyzeRecording` توی `src/App.jsx` تنها جاییه که باید برای اتصال به یه API واقعی (مثل Azure Pronunciation Assessment) عوض بشه.
- **دسترسی به میکروفون:** روی GitHub Pages / Vercel (چون HTTPS هستن) میکروفون به‌درستی کار می‌کنه. اگه لوکال تست می‌کنی، `localhost` هم مشکلی نداره.
=======
# french-pronunciation-coach
>>>>>>> 26a95fac59c60390f82ce3ee351c04875160ad98
