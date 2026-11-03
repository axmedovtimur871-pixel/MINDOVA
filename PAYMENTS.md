# MINDOVA — to'lov usullari

## 1. Supabase sozlamasi

Supabase Dashboard → **SQL Editor** bo'limida `payment-providers.sql` faylini bir marta ishga tushiring.

Bu fayl:
- `payment_settings` jadvaliga Click/Payme/boshqa usul ustunlarini qo'shadi;
- admin panelning saqlash huquqini beradi;
- foydalanuvchiga o'z to'lov usulini yozish uchun `set_payment_method` funksiyasini yaratadi;
- kutilayotgan to'lovga chek biriktirish uchun `submit_payment_receipt` funksiyasini yaratadi.

## 2. Admin panel

Admin → **To'lov usullari** bo'limida:

- **Bank karta**: karta raqami, egasi va bank.
- **Click**: `service_id` va `merchant_id`, so'ng “Clickni yoqish”.
- **Payme**: `merchant ID` (kassa ID), so'ng “Paymeni yoqish”.
- **Boshqa usul**: nom (masalan, Paynet, Uzum) va to'lov havolasi. Havolada
  `{amount}`, `{order_id}`, `{return_url}` o'rniga qiymatlar qo'yiladi.

Saqlangandan keyin foydalanuvchining to'lov oynasida faqat yoqilgan va to'liq
sozlangan usullar chiqadi.

## 3. To'lov qanday ishlaydi

1. Yangi foydalanuvchi ro'yxatdan o'tib, profili to'liq bo'lgach tadbirga
   yoziladi. Narxi bor tadbirda to'lov oynasi ochiladi.
2. To'lov oynasida **Click** yoki **Payme** (agar admin yoqqan bo'lsa) yoki
   bank karta tanlanadi.
3. Click/Payme tanlansa, ro'yxatdan o'tish `pending` holatda yaratiladi.
4. Click havolasi: `my.click.uz/services/pay`, `transaction_param` — ro'yxatdan
   o'tish IDsi.
5. Payme: `checkout.paycom.uz` ga forma yuboriladi, `account[order_id]` —
   ro'yxatdan o'tish IDsi, summa tiyinda.
6. To'lovdan keyin admin **To'lovlar** bo'limida ID bo'yicha tekshiradi va
   “Tasdiqlash”ni bosadi. Shundan keyin chipta (QR) kabinetda ochiladi.
7. Agar foydalanuvchi Click/Payme sahifasini yopib qo'ysa, kabinetdagi
   **“Mening tadbirlarim” → “Click/Payme orqali to'lash”** tugmasi orqali
   to'lovni davom ettirishi mumkin.

> **Narx:** tadbir narxi admin panelda belgilanadi. Yangi tadbir formasi
> standart holatda **35 000 so'm** bilan to'ldirilgan; bepul tadbir uchun `0`
> qo'yiladi. To'lov oynasidagi summa shu narxdan olinadi.

## 4. Avtomatik tasdiqlash

Hozir to'lovlar admin tomonidan qo'lda tasdiqlanadi. To'liq avtomatik tasdiqlash
uchun Click Merchant API va Payme Merchant API callbacklarini qabul qiladigan
backend kerak. Buning uchun merchant kabinetidagi maxfiy kalitlar va Supabase
service-role kaliti talab qilinadi. Ular frontendga joylanmaydi.

## 5. Xavfsizlik

Frontendda faqat ommaviy checkout havolalari uchun kerak bo'ladigan
`service_id`, `merchant_id` va `merchant ID` saqlanadi. Maxfiy merchant kalitlari
saqlanmaydi.
