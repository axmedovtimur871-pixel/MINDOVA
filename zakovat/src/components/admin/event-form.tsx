"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ImageUploadField } from "./image-upload-field";
import { saveEvent, deleteEvent } from "@/app/admin/(panel)/events/actions";
import { slugify } from "@/lib/slug";
import type { EventRow } from "@/lib/types";

// datetime-local works in local time; store as ISO with the Tashkent offset.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const t = new Date(d.getTime() + 5 * 3600_000);
  return t.toISOString().slice(0, 16);
}
function fromLocalInput(v: string) {
  return v ? new Date(`${v}:00+05:00`).toISOString() : null;
}

export function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!event);
  const [v, setV] = useState({
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    summary: event?.summary ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    starts_at: toLocalInput(event?.starts_at ?? null),
    ends_at: toLocalInput(event?.ends_at ?? null),
    registration_url: event?.registration_url ?? "",
    cover_image_path: event?.cover_image_path ?? null,
    status: event?.status ?? "draft",
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveEvent({
        ...v,
        id: event?.id,
        slug: v.slug || slugify(v.title),
        starts_at: fromLocalInput(v.starts_at),
        ends_at: fromLocalInput(v.ends_at),
      });
      if (!res.ok) return setError(res.error);
      toast(event ? "Tadbir saqlandi" : "Tadbir yaratildi");
      router.push("/admin/events");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]" noValidate>
      <Card className="space-y-4 p-5 sm:p-6">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Tadbir nomi" required>
          {(p) => <Input {...p} value={v.title} maxLength={200} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="Masalan: Zakovat Andijon kubogi — 2026" />}
        </Field>
        <Field label="Qisqa tavsif" hint="Tadbirlar roʻyxatida koʻrinadi (400 belgigacha).">
          {(p) => <Textarea {...p} value={v.summary} maxLength={400} onChange={(e) => set("summary", e.target.value)} className="min-h-20" />}
        </Field>
        <Field label="Toʻliq maʼlumot" hint="Xatboshilarni boʻsh qator bilan ajrating.">
          {(p) => <Textarea {...p} value={v.description} maxLength={8000} onChange={(e) => set("description", e.target.value)} className="min-h-48" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Boshlanish vaqti" hint="Toshkent vaqti">{(p) => <Input {...p} type="datetime-local" value={v.starts_at} onChange={(e) => set("starts_at", e.target.value)} />}</Field>
          <Field label="Tugash vaqti (ixtiyoriy)">{(p) => <Input {...p} type="datetime-local" value={v.ends_at} onChange={(e) => set("ends_at", e.target.value)} />}</Field>
        </div>
        <Field label="Manzil">{(p) => <Input {...p} value={v.location} maxLength={200} onChange={(e) => set("location", e.target.value)} placeholder="Masalan: Andijon shahri, …" />}</Field>
        <Field label="Roʻyxatdan oʻtish havolasi (ixtiyoriy)" hint="Masalan, Telegram yoki Google Forms havolasi.">
          {(p) => <Input {...p} type="url" value={v.registration_url} onChange={(e) => set("registration_url", e.target.value)} placeholder="https://" />}
        </Field>
      </Card>
      <div className="space-y-4">
        <Card className="space-y-4 p-5 sm:p-6">
          <Field label="Holati" hint="Faqat “Eʼlon qilingan” tadbirlar saytda koʻrinadi.">
            {(p) => (
              <Select {...p} value={v.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
                <option value="draft">Qoralama (saytda koʻrinmaydi)</option>
                <option value="published">Eʼlon qilingan</option>
                <option value="archived">Arxiv</option>
              </Select>
            )}
          </Field>
          <Field label="Sahifa havolasi" hint={<>Sayt manzili: /events/<b>{v.slug || slugify(v.title) || "…"}</b></>}>
            {(p) => <Input {...p} value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} maxLength={80} />}
          </Field>
          <ImageUploadField label="Muqova rasmi" folder="events" value={v.cover_image_path} onChange={(path) => set("cover_image_path", path)} hint="16:9 nisbatdagi rasm yaxshi koʻrinadi." />
        </Card>
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" loading={pending}>{event ? "Saqlash" : "Tadbirni yaratish"}</Button>
          {event && <Button variant="ghost" className="text-danger-700" onClick={() => setConfirm(true)}>Tadbirni oʻchirish</Button>}
        </div>
      </div>
      {event && (
        <Modal
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Tadbirni oʻchirish"
          description="Agar bu tadbir boʻyicha sertifikat berilgan boʻlsa, uni oʻchirib boʻlmaydi — “Arxiv” holatiga oʻtkazing."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(false)}>Bekor</Button>
              <Button variant="danger" loading={pending} onClick={() => start(async () => {
                const res = await deleteEvent(event.id);
                setConfirm(false);
                if (!res.ok) return setError(res.error);
                toast("Tadbir oʻchirildi");
                router.push("/admin/events");
                router.refresh();
              })}>Oʻchirish</Button>
            </>
          }
        />
      )}
    </form>
  );
}
