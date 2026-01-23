# Ridaa Admin Dashboard

لوحة تحكم منفصلة لإدارة متجر رِداء الإلكتروني.

## المتطلبات

- Node.js >= 18.0.0
- npm أو yarn

## التثبيت

```bash
npm install
```

## التشغيل في بيئة التطوير

```bash
npm run dev
```

سيعمل المشروع على: `http://localhost:3001`

## البناء للإنتاج

```bash
npm run build
npm start
```

## متغيرات البيئة

انسخ ملف `.env.example` إلى `.env` وقم بتحديث القيم:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Ridaa Admin Dashboard
```

## الصلاحيات

هذا المشروع محمي بنظام صلاحيات يتطلب:
- تسجيل دخول بحساب أدمن
- Token مع role: admin

## الميزات

- إدارة المنتجات والأقسام
- إدارة الطلبات والمستخدمين
- الإحصائيات والتقارير التفصيلية
- إدارة الإعلانات والكوبونات
- إدارة التعليقات والعروض
- واجهة عربية/إنجليزية
