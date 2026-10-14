# UNIWAY Web

واجهة UNIWAY مبنية بـ HTML وCSS وJavaScript عادي، وكل شاشة صفحة HTML مستقلة.
افتح `index.html` (صفحة تسجيل الدخول) عبر Live Server أو أي سيرفر محلي؛ لا يحتاج build أو npm.

## الحسابات التجريبية

| الدور | الكود | كلمة المرور | يفتح |
| --- | --- | --- | --- |
| دكتور | `DR1001` | `123456` | `doctor/dashboard.html` |
| شؤون الطلاب | `SA2001` | `123456` | `affairs/dashboard.html` |
| أدمن | `AD3001` | `123456` | `admin/dashboard.html` |

الدور يتحدد من الحساب اللي سجّلت به (مفيش اختيار دور داخل الصفحات). لو فتحت صفحة دور
غير دورك أو من غير تسجيل دخول، بيرجعك لصفحتك أو لصفحة الدخول. زر "خروج" في الشريط العلوي.

## هيكل المشروع

```text
index.html                  # تسجيل الدخول
css/  style.css, login.css
js/
  login.js                  # منطق صفحة الدخول
  core/  auth.js            # الحسابات والجلسة وحماية الصفحات
         shell.js           # القائمة الجانبية والمستخدم والخروج
         data.js, ui.js     # بيانات تجريبية ومكونات مشتركة
  roles/ doctor|affairs|admin/pages.js   # منطق صفحات كل دور
doctor/   dashboard, courses, course-add, course-detail, grades, lectures, chats, profile
affairs/  dashboard, requests, request-detail, admissions, admission-detail, grade-appeals,
          grade-appeal-detail, students, student-detail, documents, conversations, military-education
admin/    dashboard, users
```

الصفحات اللي فيها id بتاخده من الرابط: `course-detail.html?code=COMP301`، `student-detail.html?id=...`.

## ملاحظة أمان

الحسابات وكلمات المرور موجودة في `js/core/auth.js` للعرض التجريبي فقط، ومين يفتح الملف يشوفها.
عند الربط بخادم لازم التحقق من الدخول والصلاحيات على الخادم.
