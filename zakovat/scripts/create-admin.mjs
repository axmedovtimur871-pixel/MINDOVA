#!/usr/bin/env node
// Creates (or promotes) an administrator account.
//
//   node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<Full name>" [role]
//
// role: super_admin (default) | admin | certificate_manager
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server secret – never commit it).
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = "", role = "super_admin"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error('Foydalanish: node --env-file=.env.local scripts/create-admin.mjs <email> <parol> "<Ism Familiya>" [super_admin|admin|certificate_manager]');
  process.exit(1);
}
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY muhit oʻzgaruvchilari kerak.");
  process.exit(1);
}
if (!["super_admin", "admin", "certificate_manager"].includes(role)) {
  console.error("Rol notoʻgʻri:", role);
  process.exit(1);
}
if (password.length < 10) {
  console.error("Parol kamida 10 belgidan iborat boʻlsin.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

let userId;
const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
if (created.error) {
  if (!/already|exists|registered/i.test(created.error.message)) {
    console.error("Xato:", created.error.message);
    process.exit(1);
  }
  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle();
  if (!profile) {
    console.error("Foydalanuvchi mavjud, lekin profil topilmadi.");
    process.exit(1);
  }
  userId = profile.id;
  await supabase.auth.admin.updateUserById(userId, { password });
  console.log("Mavjud foydalanuvchi topildi, parol yangilandi.");
} else {
  userId = created.data.user.id;
}

await supabase.from("profiles").upsert({ id: userId, email: email.toLowerCase(), full_name: fullName });
const { error } = await supabase.from("administrators").upsert({ user_id: userId, role, is_active: true });
if (error) {
  console.error("Administrator qoʻshilmadi:", error.message);
  process.exit(1);
}
console.log(`✓ ${email} — ${role}. Endi /admin/login sahifasidan kiring.`);
