"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { IPlus } from "./admin-icons";
import { uploadMedia } from "@/lib/upload-client";

export function NewTemplateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (name.trim().length < 2) return setError("Shablon nomini kiriting.");
    if (!file) return setError("Sertifikat fon rasmini tanlang (PNG yoki JPG).");
    setLoading(true);
    setError(null);
    try {
      const up = await uploadMedia(file, "templates");
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), background_path: up.path, background_width: up.width, background_height: up.height }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Saqlanmadi");
      router.push(`/admin/templates/${json.id}?new=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><IPlus className="size-5" /> Yangi shablon</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yangi shablon"
        description="Sertifikat dizaynini ism, sana va QR kodsiz “boʻsh” fon sifatida yuklang. Matnlar keyingi qadamda alohida qatlam sifatida joylashtiriladi."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Bekor</Button><Button loading={loading} onClick={submit}>Yuklash va davom etish</Button></>}
      >
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Shablon nomi" required>
            {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Zakovat kubogi 2026" maxLength={120} />}
          </Field>
          <Field label="Fon rasmi (PNG yoki JPG)" required hint="Tavsiya: A4 nisbatida (masalan 3508×2480 px), 10 MB gacha. Rasm hech qachon choʻzilmaydi.">
            {(p) => (
              <input
                {...p}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : null);
                }}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-4 file:py-2.5 file:font-semibold file:text-cream-50 hover:file:bg-navy-800"
              />
            )}
          </Field>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Tanlangan rasm" className="w-full rounded-lg ring-1 ring-line" />}
        </div>
      </Modal>
    </>
  );
}
