# Pxxl VLESS node — آماده دیپلوی

فایل‌های این پوشه ریپوی گیت‌هاب نود VLESS نادر است؛ از صفر و خوانا نوشته شده،
بدون دانلود فایل از هیچ منبعی. قبل از دیپلوی، `server.js` را بخوان.

## وضعیت تا ۹ نوامبر ۲۰۲۶، ساعت ۱۱:۳۲ تهران

- اکانت Pxxl: `fazel409` — پلن رایگان — ۰ پروژه، ۰ دامین
- گیت‌هاب فقط برای ورود استفاده شده؛ در Settings نوشته «Connected · 0 installations»
  یعنی هنوز هیچ ریپویی برای دیپلوی وصل نیست.
- گام بعدی در داشبورد: Settings > Connected accounts — نصب/وصل کردن گیت‌هاب،
  تا ریپوها دیده شوند. بعد، ساخت پروژه از روی همین ریپو.

## فایل‌ها

- `package.json` — پروژه Node، اسکریپت `start: node server.js`
- `server.js` — سرور VLESS روی WebSocket؛ پورت را از `process.env.PORT` می‌خواند
  (طبق مستندات Pxxl، اپ باید `PORT` را بخواند)، TLS را لبه Pxxl تمام می‌کند.

## متغیرهای محیطی در Pxxl (محرمانه — در ریپو ننویس)

- `UUID` = مقدار محرمانه‌ای که جونو جداگانه به نادر می‌دهد؛ فقط در Environment Variables پروژه Pxxl وارد کن، نه در هیچ فایلی از ریپو.
- `WSPATH` = `vless`

## ساخت ریپو و دیپلوی

1. در گیت‌هاب یک ریپوی جدید بساز، مثلا `pxxl-vless-node`، و همین سه فایل
   (`package.json` ،`server.js` ،`README.md`) را در ریشه آن بگذار.
   `node_modules` را کامیت نکن.
2. در Pxxl: Settings > Connected accounts — گیت‌هاب را نصب/وصل کن.
3. New Project > از گیت‌هاب همین ریپو را انتخاب کن.
4. مقدار `UUID` محرمانه و `WSPATH=vless` را در بخش Environment Variables پروژه بگذار.
5. دیپلوی کن و آدرس دامنه Pxxl را بگیر (مثلا `xxx.pxxl.app`).

## کانفیگ کلاینت (Hiddify / v2ray)

```
vless://UUID@DOMAIN:443?encryption=none&security=tls&sni=DOMAIN&type=ws&host=DOMAIN&path=%2Fvless#Pxxl-VLESS
```

به‌جای `UUID` مقدار محرمانه و به‌جای `DOMAIN` دامنه‌ای که Pxxl داد بگذار.

## نکته امنیتی

- این UUID و WSPATH را جایی عمومی پست نکن؛ هرکس آن‌ها را داشته باشد
  می‌تواند از نودت استفاده کند. اگر لو رفت، یک UUID تازه بساز و در
  متغیرهای Pxxl عوضش کن.
- این نود فقط TCP را پشتیبانی می‌کند (UDP/MUX نه) — برای وب‌گردی معمولی کافی است.
