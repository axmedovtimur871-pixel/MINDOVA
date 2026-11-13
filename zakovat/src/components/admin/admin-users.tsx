"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { IPlus } from "./admin-icons";
import type { AdminRole } from "@/lib/types";

export interface AdminListItem { user_id: string; role: AdminRole; is_active: boolean; full_name: string; email: string; created_at: string }

const ROLES: { value: AdminRole; label: string; text: string }[] = [
  { value: "certificate_manager", label: "Sertifikat menejeri", text: "Faqat sertifikat yaratadi va koʻradi." },
  { value: "admin", label: "Administrator", text: "Sertifikatlar, bekor qilish, shablonlar, tadbirlar va sayt matnlari." },
  { value: "super_admin", label: "Bosh administrator", text: "Hammasi + administratorlarni boshqarish." },
];
export const roleLabel = (r: AdminRole) => ROLES.find((x) => x.value === r)?.label ?? r;

function randomPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Xatolik");
  return json;
}

export function AdminUsers({ admins, currentId, canManage }: { admins: AdminListItem[]; currentId: string; canManage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: randomPassword(), role: "certificate_manager" as AdminRole });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetFor, setResetFor] = useState<AdminListItem | null>(null);
  const [newPass, setNewPass] = useState("");

  async function create() {
    setLoading(true); setError(null);
    try {
      await call("/api/admin/users", "POST", form);
      toast(`${form.email} qoʻshildi. Parolni unga xavfsiz yoʻl bilan yetkazing.`);
      setCreating(false);
      setForm({ full_name: "", email: "", password: randomPassword(), role: "certificate_manager" });
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Xatolik"); } finally { setLoading(false); }
  }

  async function update(a: AdminListItem, body: Record<string, unknown>, ok: string) {
    try { await call(`/api/admin/users/${a.user_id}`, "PATCH", body); toast(ok); router.refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : "Xatolik", "error"); }
  }

  return (
    <>
      {canManage && (
        <div className="flex justify-end border-b border-line px-5 py-3 sm:px-6">
          <Button size="sm" onClick={() => setCreating(true)}><IPlus className="size-4" /> Administrator qoʻshish</Button>
        </div>
      )}
      <ul className="divide-y divide-line">
        {admins.map((a) => (
          <li key={a.user_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <p className="font-semibold text-navy-900">{a.full_name || a.email} {a.user_id === currentId && <span className="text-xs font-normal text-muted">(siz)</span>}</p>
              <p className="truncate text-sm text-muted">{a.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!a.is_active && <Badge tone="danger">Oʻchirilgan</Badge>}
              {canManage && a.user_id !== currentId ? (
                <>
                  <Select aria-label="Rol" value={a.role} onChange={(e) => update(a, { role: e.target.value }, "Rol oʻzgartirildi")} className="h-9 w-48 text-sm">
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => { setResetFor(a); setNewPass(randomPassword()); }}>Parol</Button>
                  {a.is_active ? (
                    <Button variant="ghost" size="sm" className="text-danger-700" onClick={() => update(a, { is_active: false }, "Kirish huquqi olib qoʻyildi")}>Oʻchirish</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => update(a, { is_active: true }, "Qayta faollashtirildi")}>Faollashtirish</Button>
                  )}
                </>
              ) : (
                <Badge tone={a.role === "super_admin" ? "gold" : "navy"}>{roleLabel(a.role)}</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Yangi administrator"
        description="Hisob darhol yaratiladi. Email va parolni xodimga xavfsiz yoʻl bilan yetkazing; u kirgach Sozlamalarda parolni almashtirishi mumkin."
        footer={<><Button variant="ghost" onClick={() => setCreating(false)}>Bekor</Button><Button loading={loading} onClick={create}>Qoʻshish</Button></>}
      >
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Ism-familiya" required>{(p) => <Input {...p} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />}</Field>
          <Field label="Email" required>{(p) => <Input {...p} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
          <Field label="Vaqtinchalik parol" required hint="Kamida 10 belgi. Avtomatik yaratildi — nusxalab oling.">
            {(p) => <Input {...p} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-mono" />}
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Rol</legend>
            <div className="mt-2 space-y-2">
              {ROLES.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setForm({ ...form, role: r.value })} className="mt-1 accent-navy-900" />
                  <span><span className="block text-sm font-semibold text-navy-900">{r.label}</span><span className="text-xs text-muted">{r.text}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>

      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title="Parolni almashtirish"
        description={resetFor && <>Yangi parol <b>{resetFor.email}</b> uchun oʻrnatiladi.</>}
        footer={<><Button variant="ghost" onClick={() => setResetFor(null)}>Bekor</Button><Button onClick={async () => { if (resetFor) { await update(resetFor, { password: newPass }, "Parol yangilandi"); setResetFor(null); } }}>Saqlash</Button></>}
      >
        <Field label="Yangi parol" hint="Kamida 10 belgi">{(p) => <Input {...p} value={newPass} onChange={(e) => setNewPass(e.target.value)} className="font-mono" />}</Field>
      </Modal>
    </>
  );
}
