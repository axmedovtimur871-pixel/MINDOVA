# ZAKOVAT ANDIJON — website, certificates and verification

Public website, admin panel, certificate generator (single + bulk Excel/CSV),
template manager and public QR verification portal for **Zakovat Andijon**.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage, RLS) ·
pdf-lib + fontkit (vector PDFs with embedded fonts) · qrcode · jsQR (camera scanning) · JSZip · read-excel-file / PapaParse.

```
Admin:        Login → enter name → “Sertifikat yaratish” → Download PDF
Participant:  Receives PDF → scans QR → /verify/<token> → sees VERIFIED → downloads PDF
Visitor:      Home → About / Events → Verify a certificate
```

---

## 1. What is where

| Path | Purpose |
|---|---|
| `/` `/about` `/events` `/events/[slug]` `/certificates` `/contact` | Public site (Uzbek, content editable in admin) |
| `/verify` | Enter a certificate ID, scan a QR with the camera, or scan a QR from a photo |
| `/verify/[token]` | Page opened by the QR code — always checks the database |
| `/admin/login` | Admin sign-in (public sign-up is disabled) |
| `/admin` | Dashboard · Create certificate · Bulk generator · All certificates · Templates · Events · Verification logs · Users & admins · Settings |
| `supabase/migrations/` | Complete database schema, RLS policies, storage buckets, seed template |
| `scripts/create-admin.mjs` | Creates the first (super) administrator |
| `src/lib/certificates/` | Layout model, PDF renderer, ID/token generator, issuing service |
| `public/builtin/zakovat-certificate.jpg` | Starter certificate background (3508×2480, A4 @ 300 dpi) |
| `design/certificate-background.html` | Source of the starter background |

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where it is used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (RLS applies) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** (`src/lib/supabase/admin.ts`, `import "server-only"`) | **yes** |
| `NEXT_PUBLIC_SITE_URL` | printed into every QR code | no |
| `VERIFY_LOG_SALT` | hashing visitor IPs in verification logs | yes |

> ⚠️ `NEXT_PUBLIC_SITE_URL` is embedded in each QR code. Set the final production domain **before** issuing real certificates.

## 3. Local development

Requirements: Node.js 20–24, Docker (for the local Supabase stack).

```bash
cd zakovat
npm install
npx supabase start          # local Postgres + Auth + Storage; applies supabase/migrations
```

Copy the printed `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` into `.env.local` (see `.env.example`), then:

```bash
node --env-file=.env.local scripts/create-admin.mjs admin@example.com 'A-strong-password-1' "Ism Familiya"
npm run dev                 # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

To test the QR code with a real phone during development, set `NEXT_PUBLIC_SITE_URL` to your computer’s LAN
address (e.g. `http://192.168.1.20:3000`) and run `npm run dev -- -H 0.0.0.0`.

## 4. Production setup (Supabase Cloud + Vercel)

### 4.1 Supabase
1. Create a **new** project at supabase.com (do not reuse the MINDOVA project — it already has
   `certificates` tables with a different schema).
2. Apply the schema — either
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   - **Dashboard:** SQL Editor → run the files in `supabase/migrations/` in order (`…000001`, `…000002`, `…000003`).
3. **Authentication → Providers → Email:** keep Email enabled, turn **“Allow new users to sign up” OFF**
   (admins are created only by a super admin or the script).
4. **Authentication → URL configuration:** Site URL = your domain.
5. Storage buckets `media` (public) and `certificates` (private) are created by the migration — check they exist.

### 4.2 Vercel (or any Node host)
1. Import the repository, set **Root Directory = `zakovat`**.
2. Add the environment variables from section 2 (Production + Preview).
3. Deploy. PDF routes run on the Node.js runtime; fonts and the built-in background are bundled via
   `outputFileTracingIncludes` in `next.config.ts`.
4. Bulk ZIP export of very large batches can take a while — on Vercel Hobby the function limit is 60 s;
   use Pro (300 s, as configured) for batches of several hundred certificates.

Other hosts: `npm run build && npm start` (port 3000) behind HTTPS.

### 4.3 First administrator
```bash
node --env-file=.env.production.local scripts/create-admin.mjs you@domain.uz 'Strong-Password-2026' "Ism Familiya" super_admin
```
Then sign in at `/admin/login`. Further admins are added in **Admin → Foydalanuvchilar**.

## 5. Roles

| | Super Admin | Admin | Certificate Manager |
|---|:-:|:-:|:-:|
| Create certificates (single / bulk), download, print | ✓ | ✓ | ✓ |
| View certificates & verification logs | ✓ | ✓ | ✓ |
| Revoke / restore certificates | ✓ | ✓ | – |
| Templates, events, website content | ✓ | ✓ | – |
| Activity (audit) history | ✓ | ✓ | – |
| Create admins, change roles, reset passwords | ✓ | – | – |

The same rules are enforced three times: in the UI, in every API route (`requireAdmin`) and in PostgreSQL RLS.

## 6. Security model
- **Public visitors** can only read published events, site content and call `verify_certificate()` —
  an exact-match (token or ID) SECURITY DEFINER function that returns only display fields and logs the lookup.
  The `certificates` table itself is not readable by `anon`.
- Verification **always** queries the database; a QR code alone never shows VERIFIED.
- Tokens: 192-bit random (`crypto.randomBytes(24)`, base64url). IDs: `ZA-YYYY-XXXX-XXXX` (31⁸ combinations/year, no look-alike characters).
- Issued names, ID, token, event and date are **immutable** (DB trigger) — mistakes are fixed by revoking and re-issuing.
- Certificates are never deleted (no DELETE policy); revocation requires a reason and is audited.
- PDFs live in a **private** bucket; the public download route serves a PDF only for an exact token of an **active** certificate.
- Every upload is checked by magic bytes, size and dimensions (`src/lib/image-info.ts`), not by file extension.
- State-changing admin endpoints reject cross-origin requests; public verification and PDF routes are rate-limited.
- Audit trail (`activity_logs`) is written by database triggers, so it cannot be skipped by the app.
- Visitor IPs are stored only as salted SHA-256 hashes.

## 7. Certificates, templates, PDF
- Templates are **background image + separate layers** (name, type, event text, description, date, organizer,
  certificate number, QR code, optional signature/stamp image). Positions are % of the page, so the on-screen preview
  and the PDF match exactly.
- Backgrounds are never stretched: “Toʻliq koʻrsatish” (contain) or “Sahifani toʻldirish” (cover).
- Text automatically shrinks to fit its max width (long Uzbek names).
- `o'` / `g'` typed with an ASCII apostrophe are converted to proper **oʻ / gʻ** (U+02BB); other apostrophes to **ʼ**.
- Fonts (Playfair Display, Noto Serif, Noto Sans — SIL OFL, see `src/assets/fonts/`) are pre-subset to Latin + Latin
  Extended + Cyrillic and embedded in every PDF, so Uzbek (and future Russian) text never loses letters.
- Output: real vector PDF, A4 landscape by default (portrait available), 300 dpi background, clickable QR link,
  document metadata (title, subject, author).
- **Official ZAKOVAT design:** the repository did not contain the official certificate artwork, so a starter background
  is shipped. Upload the official design (an empty version without names/dates/QR) in **Admin → Sertifikat shablonlari →
  Yangi shablon**, position the layers, then click **“Asosiy shablon qilish”**.

## 8. Translations
UI strings live in `src/i18n/uz.ts`. To add Russian/English, create `ru.ts` / `en.ts` with the same shape, add the locale
to `LOCALES` in `src/i18n/index.ts` and resolve it (cookie or URL prefix). Site content in the database is currently
single-language (Uzbek).

## 9. Tests that were run
End-to-end in Chromium against a local Supabase stack (real Postgres, Auth, Storage):
admin login (incl. wrong password), single certificate creation, PDF download (`%PDF`, A4, fonts embedded, text
extractable), QR decoded from the rendered PDF → correct `/verify/<token>` URL, verification page on an emulated iPhone,
public PDF download, manual lookup (case-insensitive), NOT FOUND, duplicate warning, bulk upload of `.xlsx`
(two-column and single “F.I.Sh.” column), validation of empty names, in-file + database duplicate detection,
bulk generation with progress, ZIP download (individual PDFs + CSV), revoke with mandatory reason, REVOKED status
publicly + PDF download blocked (HTTP 410), template upload/drag/save, fake image rejected, events, site content,
admin creation, role restrictions (API 401/403, UI redirects), cross-origin rejection, 28 RLS checks with anon and
certificate-manager sessions, no service key in browser bundles, no horizontal scroll on phone width.

**Not yet tested:** scanning a printed QR with a physical phone camera against the deployed domain (requires the
production URL), and the Supabase Cloud deployment itself (no project credentials were available).

---

## Admin uchun qisqa qoʻllanma (Uzbek)

1. **Kirish:** `/admin/login` → email va parol.
2. **Bitta sertifikat:** “Sertifikat yaratish” → ism va familiya → “Sertifikat yaratish” → “PDF yuklab olish”.
   Tadbir, sana va tashkilotchi eslab qolinadi — keyingi ishtirokchi uchun faqat ismni yozasiz.
3. **Koʻp sertifikat:** “Ommaviy yaratish” → Excel (.xlsx) yoki CSV faylni tashlang → roʻyxatni tekshiring →
   “… ta sertifikat yaratish” → oxirida “Barchasini ZIP qilib yuklab olish”.
   Takrorlangan va allaqachon sertifikat olgan ishtirokchilar avtomatik belgilanmaydi.
4. **Bekor qilish:** “Barcha sertifikatlar” → sertifikat → “Bekor qilish” → sababni yozing.
   Tekshirish sahifasida “BEKOR QILINGAN” chiqadi. Kerak boʻlsa, “Qayta tiklash”.
5. **Shablon:** “Sertifikat shablonlari” → “Yangi shablon” → boʻsh dizayn rasmini yuklang → matnlarni sudrab joylang → “Saqlash”.
6. **Sayt matnlari:** “Sozlamalar” → boʻlimni tanlang → tahrirlang → “Saqlash”.
