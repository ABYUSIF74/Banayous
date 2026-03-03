# 🚀 خادم Node.js - إعداد وتشغيل

هذا الدليل يساعدك على تشغيل خادم Node.js للوصول للموقع من أجهزة أخرى على نفس الشبكة.

## 📋 المتطلبات

1. **Node.js** (الإصدار 14 أو أحدث)
   - تحميل من: https://nodejs.org/
   
2. **npm** (يأتي مع Node.js تلقائياً)

---

## 🛠️ خطوات الإعداد

### 1️⃣ تثبيت التبعيات

افتح موجه الأوامر (CMD أو PowerShell) في مجلد المشروع وتشغيل:

```bash
npm install
```

سيتم تثبيت الحزم التالية:
- `express` - إطار العمل للخادم
- `cors` - للسماح بالوصول من أجهزة مختلفة
- `body-parser` - لمعالجة البيانات المرسلة

### 2️⃣ تشغيل الخادم

#### الخيار أ: تشغيل عادي
```bash
npm start
```

#### الخيار ب: تشغيل مع إعادة التحميل التلقائي (للتطوير)
```bash
npm run dev
```

### 3️⃣ الوصول للموقع

بعد تشغيل الخادم، سترى رسالة مثل:

```
╔══════════════════════════════════════╗
║     🏫 School Website Server Started      ║
╠══════════════════════════════════════╣
║  Server running on PORT: 3000              ║
║  Local: http://localhost:3000             ║
║  Network: http://192.168.1.5:3000        ║
╚══════════════════════════════════════╝
```

### 4️⃣ الوصول من أجهزة أخرى

#### على نفس الكمبيوتر:
1. افتح المتصفح
2. اذهب إلى: `http://localhost:3000`

#### من موبايل أو لابتوب آخر على نفس الشبكة:
1. افتح المتصفح على الجهاز الآخر
2. استخدم عنوان IP من رسالة الخادم
3. مثال: `http://192.168.1.5:3000`

---

## 🌐 معرفة عنوان IP الخاص بك

### في Windows:

افتح CMD وتشغيل:
```bash
ipconfig
```
ابحث عن **IPv4 Address** تحت قسم الذي تتصل به بالإنترنت

### في Linux/Mac:

افتح Terminal وتشغيل:
```bash
ip addr show
# أو
ifconfig
```

---

## 🔧 التخصيص

### تغيير المنفذ (Port)

افتح [`server.js`](server.js:3) وقم بتغيير السطر:

```javascript
const PORT = process.env.PORT || 3000; // غير 3000 إلى أي منفذ تريده
```

بدلاً من ذلك، يمكنك استخدام متغير البيئة:

```bash
set PORT=8080 && node server.js
# أو في Linux/Mac
PORT=8080 node server.js
```

---

## 📡 واجهة برمجة التطبيقات (API)

الخادم يوفر API endpoints التالية:

### الحصول على المستخدمين
```http
GET /api/users
```

### تسجيل مستخدم جديد
```http
POST /api/register
Content-Type: application/json

Body:
{
  "firstName": "اسم",
  "lastName": "عائلة",
  "phone": "01xxxxxxxxx",
  "email": "user@school.com",
  "password": "password123",
  "role": "student",
  "grade": "1/1"
}
```

### تسجيل الدخول
```http
POST /api/login
Content-Type: application/json

Body:
{
  "email": "user@school.com",
  "password": "password123"
}
```

### تحديث بيانات مستخدم
```http
PUT /api/users/:userId
Content-Type: application/json

Body:
{
  "firstName": "اسم جديد"
}
```

### الحصول على إحصائيات المستخدمين
```http
GET /api/stats
```

---

## 🐛 المشاكل الشائعة

### المشكلة: "EADDRINUSE" - المنفذ مستخدم

**الحل:**
1. قم بإغلاق البرنامج الذي يستخدم المنفذ 3000
2. أو اختر منفذ آخر ( انظر قسم التخصيص)

### المشكلة: "Cannot find module"

**الحل:**
1. تأكد من تشغيل `npm install`
2. تأكد من وجود مجلد `node_modules`

### المشكلة: لا يمكنني الوصول من موبايل آخر

**الحل:**
1. تأكد أن الجهازان على نفس الشبكة (Wi-Fi or Ethernet)
2. تأكد من جدار الحماية (Firewall) يسمح بالوصول على المنفذ 3000
3. تأكد من عنوان IP صحيح
4. حاول باستخدام عنوان بدلاً من localhost

---

## 🔒 الأمان

⚠️ **ملاحظات أمنية مهمة:**

1. **للاستخدام الشخصي فقط**: هذا الخادم مناسب للاستخدام المحلي فقط
2. **للإنتاج العام**: يُنصح باستخدام:
   - HTTPS (SSL/TLS certificate)
   - قاعدة بيانات حقيقية (MongoDB, PostgreSQL, etc.)
   - نظام مصادقة أكثر أماناً (JWT, OAuth)
   - حماية ضد CSRF and XSS attacks
   - Rate limiting للطلبات

3. **كلمات المرور**: في هذا النظام، كلمات المرور تُحفظ كنص عادي
   - للإنتاج: استخدم bcrypt أو مشفرات أخرى

---

## 📱 الوصول من خارج الشبكة المحلية

### لجعل الموقع متاحاً على الإنترنت:

#### الخيار 1: باستخدام ngrok (مجاني وسريع)

1. تحميل ngrok من: https://ngrok.com/download
2. فك الضغط واستخراج ngrok.exe
3. تشغيل:
```bash
ngrok http 3000
```
4. سيعطيك رابط مثل: `https://random-id.ngrok.io`
5. شارك هذا الرابط مع أي شخص!

#### الخيار 2: باستخدام Cloudflare Tunnel

1. تحميل cloudflared من: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. تشغيل:
```bash
cloudflared tunnel --url http://localhost:3000
```

#### الخيار 3: نشر على استضافة مجانية
- **Netlify**: netlify.com
- **Vercel**: vercel.com
- **GitHub Pages**: pages.github.com

---

## 🛑 إيقاف الخادم

اضغط على `Ctrl + C` في موجه الأوامر لإيقاف الخادم

---

## 📊 المراقبة

يمكنك معرفة عدد المستخدمين والأحصائيات عن طريق الذهاب إلى:
```
http://localhost:3000/api/stats
```

---

## ✅ التحقق من العمل

بعد تشغيل الخادم:

1. افتح المتصفح على الجهاز
2. اذهب إلى `http://localhost:3000`
3. حاول تسجيل مستخدم جديد
4. اذهب إلى `http://localhost:3000/api/users` للتأكد من البيانات

---

## 🆘 تحديثات مستقبلية

يمكنك تحديث المشروع:

```bash
# Update Node.js
npm update

# Update dependencies
npm update
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من الملف `SERVER_SETUP.md`
2. تحقق من سجلات الخادم في CMD
3. تأكد من Node.js مثبت بشكل صحيح

---

**ملاحظة**: هذا الخادم للأغراض التعليمية والاختبار فقط. للإنتاج، استخدم خادم احترافي مع أفضل ممارسات الأمان.
