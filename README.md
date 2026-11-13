# MINDOVA

Yoshlar uchun tadbirlar, imkoniyatlar, QR chiptalar, sertifikatlar va
`Mindova Connect` chatini birlashtirgan platforma.

## Ishga tushirish

```bash
npm install
npm start
```

Brauzerda: `http://localhost:3000`

Supabase sozlamalari `assets/js/index.js` va boshqa sahifa skriptlaridagi
`CFG` / `createClient(...)` qatorlarida. To'lov usullari uchun
`payment-providers.sql` faylini Supabase SQL Editor'da bir marta ishga
tushiring (batafsil: `PAYMENTS.md`).

## Papka tuzilishi

```
.
├── index.html            # bosh sahifa: tadbirlar, imkoniyatlar, FAQ, kirish
├── dashboard.html        # shaxsiy kabinet: chipta QR, sertifikat, to'lovlar
├── admin.html            # admin panel
├── connect.html          # Mindova Connect chat
├── scan.html             # QR skaner (davomat)
├── verify.html           # sertifikat / a'zolikni tekshirish
├── login.html            # /login -> bosh sahifaga yo'naltiradi
├── server.js             # Express server
├── payment-providers.sql # Click/Payme/boshqa to'lov sozlamalari (Supabase)
├── PAYMENTS.md           # to'lov tizimi hujjati
└── assets/
    ├── css/              # har bir sahifa uchun alohida uslub fayli
    │   ├── index.css
    │   ├── admin.css
    │   ├── dashboard.css
    │   ├── connect.css
    │   ├── scan.css
    │   ├── verify.css
    │   └── login.css
    ├── js/               # har bir sahifa uchun alohida skript
    │   ├── index.js
    │   ├── admin.js
    │   ├── dashboard.js
    │   ├── connect.js
    │   ├── scan.js
    │   ├── verify.js
    │   └── login.js
    └── img/              # logotiplar va fon rasmlari
```

## Kabinet

- **Profilim** bo'limida faqat ism-familiya va Telegram username tahrirlanadi.
  Saqlanganda ma'lumotlar profilga, QR chiptaga va admin ro'yxatlariga bir
  vaqtda yoziladi.
- Email ro'yxatdan o'tishda kiritiladi va profil sahifasida faqat ko'rsatiladi.
- Telefon, yosh, shahar, bio va qiziqishlar ro'yxatdan o'tishda to'ldiriladi;
  ular profil sahifasida ko'rsatilmaydi.

## To'lov

- Narxi bor tadbirga yozilishda avval profil to'ldiriladi, so'ng to'lov oynasi
  ochiladi.
- To'lov usullari: **bank karta**, **Click**, **Payme** va admin qo'shgan
  boshqa usul.
- Click/Payme to'lovidan keyin admin tasdiqlaydi va QR chipta kabinetda
  ochiladi.
- Standart tadbir narxi: **35 000 so'm** (admin panelda o'zgartiriladi).
