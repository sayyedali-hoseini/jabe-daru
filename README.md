<div dir="rtl">

# 💊 جعبه داروی من (My Medicine Box)

یک وب‌اپلیکیشن متن‌باز، **۱۰۰٪ آفلاین (PWA)** و بدون نیاز به ثبت‌نام یا سرور برای مدیریت هوشمند داروهای خانگی، جلوگیری از خرید داروهای تکراری و آماده‌سازی سریع لیست مطب دکتر و داروخانه.

### ✨ ویژگی‌های کلیدی
- **۱۰۰٪ آفلاین و خصوصی:** تمام اطلاعات شما فقط روی مرورگر خودتان (`localStorage`) ذخیره می‌شود و هیچ داده‌ای به سرور ارسال نمی‌شود.
- **بانک ۱۲۰+ داروی رایج ایران:** افزودن سریع داروهای پرمصرف، پک‌های آماده (عمومی خانه، کودک، کمک‌های اولیه) و پیشنهاد خودکار هنگام تایپ.
- **تقویم شمسی و میلادی واقعی:** ثبت تاریخ انقضا به هر دو تقویم و هشدار خودکار داروهای نزدیک به انقضا یا منقضی‌شده.
- **تشخیص ورق نصفه و شربت درب‌باز:** علامت‌گذاری اقلام بازشده برای اولویت در مصرف.
- **🩺 حالت مطب دکتر:** نمایش دسته‌بندی‌شده داروهای سالم و موجود در منزل با قابلیت بزرگ‌نمایی متن (`A+`/`A-`) و کپی سریع برای پزشک.
- **👓 حالت ساده (سالمندان) و حالت شب (Dark Mode):** طراحی خوانا با دکمه‌های بزرگ و کنتراست بالا.
- **👨‍👩‍👧‍👦 اشتراک‌گذاری خانوادگی بدون سرور:** ارسال لینک فشرده (`#share=...`) با امکان ادغام یا جایگزینی در گوشی اعضای خانواده، ارسال متنی برای واتساپ/ایتا/تلگرام و خروجی/بازیابی فایل `JSON`.

</div>

---

## English Overview

**My Medicine Box (جعبه داروی من)** is a 100% client-side, offline-first Persian RTL Progressive Web App built with React, TypeScript, Tailwind CSS v4, and `vite-plugin-pwa`. It requires **zero backend, zero login, and zero external CDNs** at runtime.

### 🚀 Deploying to GitHub Pages

The project is pre-configured with relative base paths (`base: './'` in `vite.config.ts` and relative `./` PWA manifest URLs), so it works seamlessly on any `https://<username>.github.io/<repo-name>/` subpath or custom domain.

1. **Install dependencies & build:**
   ```bash
   npm install
   npm run build
   ```
2. **Deploy `dist/` to GitHub Pages** (via GitHub Actions or `gh-pages`):
   - In your repository **Settings → Pages**, set Source to **GitHub Actions** (or deploy the `dist/` folder to the `gh-pages` branch).
   - No environment variables or API keys are required.

### 🛠 Local Development
```bash
npm install
npm run dev
```

### 📄 License
Released under the **MIT License** — free to use, modify, and share to reduce household medicine waste.
