"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { ImageUploadField } from "./image-upload-field";
import { IPlus, ITrash } from "./admin-icons";
import { saveContent } from "@/app/admin/(panel)/settings/actions";
import { uploadMedia } from "@/lib/upload-client";
import { publicMediaUrl } from "@/lib/env";
import type { ContentKey, SiteContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const TABS: { key: ContentKey; label: string }[] = [
  { key: "hero", label: "Bosh ekran" },
  { key: "about", label: "Biz haqimizda" },
  { key: "activities", label: "Faoliyat" },
  { key: "stats", label: "Statistika" },
  { key: "gallery", label: "Galereya" },
  { key: "contact", label: "Bogʻlanish" },
  { key: "social", label: "Ijtimoiy tarmoqlar" },
  { key: "general", label: "Umumiy" },
];

export function ContentEditor({ content }: { content: SiteContent }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<ContentKey>("hero");
  const [data, setData] = useState<SiteContent>(content);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends ContentKey>(key: K, value: SiteContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveContent(tab, data[tab]);
      if (!res.ok) return setError(res.error);
      toast("Saqlandi — saytda bir necha soniyada yangilanadi");
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3 sm:px-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setError(null); }}
            className={cn("shrink-0 rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium", tab === t.key ? "border-gold-500 text-navy-900" : "border-transparent text-muted hover:text-navy-900")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {tab === "hero" && (
          <>
            <Field label="Kichik sarlavha">{(p) => <Input {...p} value={data.hero.eyebrow} onChange={(e) => set("hero", { ...data.hero, eyebrow: e.target.value })} />}</Field>
            <Field label="Katta nom">{(p) => <Input {...p} value={data.hero.title} onChange={(e) => set("hero", { ...data.hero, title: e.target.value })} />}</Field>
            <Field label="Shior (slogan)">{(p) => <Input {...p} value={data.hero.slogan} onChange={(e) => set("hero", { ...data.hero, slogan: e.target.value })} />}</Field>
            <Field label="Qisqa tanishtiruv">{(p) => <Textarea {...p} value={data.hero.intro} onChange={(e) => set("hero", { ...data.hero, intro: e.target.value })} />}</Field>
            <ImageUploadField label="Oʻng tomondagi rasm (ixtiyoriy)" folder="site" value={data.hero.image_path} onChange={(path) => set("hero", { ...data.hero, image_path: path })} hint="Rasm boʻlmasa, sertifikat namunasi koʻrsatiladi." />
          </>
        )}

        {tab === "about" && (
          <>
            <Field label="Sarlavha">{(p) => <Input {...p} value={data.about.title} onChange={(e) => set("about", { ...data.about, title: e.target.value })} />}</Field>
            <Field label="Asosiy jumla">{(p) => <Textarea {...p} value={data.about.lead} onChange={(e) => set("about", { ...data.about, lead: e.target.value })} className="min-h-16" />}</Field>
            <Field label="Matn" hint="Xatboshilarni boʻsh qator bilan ajrating.">{(p) => <Textarea {...p} value={data.about.body} onChange={(e) => set("about", { ...data.about, body: e.target.value })} className="min-h-40" />}</Field>
            <ListEditor
              label="Qadriyatlar"
              items={data.about.values}
              max={6}
              empty={{ title: "", text: "" }}
              onChange={(values) => set("about", { ...data.about, values })}
              render={(item, update) => (
                <>
                  <Input aria-label="Nomi" placeholder="Nomi" value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} />
                  <Input aria-label="Izoh" placeholder="Izoh" value={item.text} onChange={(e) => update({ ...item, text: e.target.value })} />
                </>
              )}
            />
          </>
        )}

        {tab === "activities" && (
          <>
            <Field label="Sarlavha">{(p) => <Input {...p} value={data.activities.title} onChange={(e) => set("activities", { ...data.activities, title: e.target.value })} />}</Field>
            <Field label="Kirish matni">{(p) => <Textarea {...p} value={data.activities.intro} onChange={(e) => set("activities", { ...data.activities, intro: e.target.value })} className="min-h-16" />}</Field>
            <ListEditor
              label="Yoʻnalishlar"
              items={data.activities.items}
              max={12}
              empty={{ title: "", text: "" }}
              onChange={(items) => set("activities", { ...data.activities, items })}
              render={(item, update) => (
                <>
                  <Input aria-label="Nomi" placeholder="Nomi" value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} />
                  <Textarea aria-label="Tavsif" placeholder="Tavsif" value={item.text} onChange={(e) => update({ ...item, text: e.target.value })} className="min-h-16" />
                </>
              )}
            />
          </>
        )}

        {tab === "stats" && (
          <>
            <Alert tone="info">Faqat haqiqiy raqamlarni kiriting. Boʻsh qoldirilgan qatorlar saytda koʻrinmaydi.</Alert>
            <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
              <input type="checkbox" className="size-4 accent-navy-900" checked={data.stats.show_computed} onChange={(e) => set("stats", { ...data.stats, show_computed: e.target.checked })} />
              Bazadan avtomatik hisoblangan raqamlarni koʻrsatish (tadbirlar va berilgan sertifikatlar soni)
            </label>
            <ListEditor
              label="Qoʻshimcha raqamlar"
              items={data.stats.items}
              max={8}
              empty={{ value: "", label: "" }}
              onChange={(items) => set("stats", { ...data.stats, items })}
              render={(item, update) => (
                <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                  <Input aria-label="Qiymat" placeholder="Masalan: 120+" value={item.value} onChange={(e) => update({ ...item, value: e.target.value })} />
                  <Input aria-label="Izoh" placeholder="Masalan: ishtirokchi jamoalar" value={item.label} onChange={(e) => update({ ...item, label: e.target.value })} />
                </div>
              )}
            />
          </>
        )}

        {tab === "gallery" && (
          <>
            <Field label="Sarlavha">{(p) => <Input {...p} value={data.gallery.title} onChange={(e) => set("gallery", { ...data.gallery, title: e.target.value })} />}</Field>
            <Field label="Kirish matni">{(p) => <Input {...p} value={data.gallery.intro} onChange={(e) => set("gallery", { ...data.gallery, intro: e.target.value })} />}</Field>
            <GalleryEditor items={data.gallery.items} onChange={(items) => set("gallery", { ...data.gallery, items })} />
          </>
        )}

        {tab === "contact" && (
          <>
            <Field label="Sarlavha">{(p) => <Input {...p} value={data.contact.title} onChange={(e) => set("contact", { ...data.contact, title: e.target.value })} />}</Field>
            <Field label="Kirish matni">{(p) => <Input {...p} value={data.contact.intro} onChange={(e) => set("contact", { ...data.contact, intro: e.target.value })} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Manzil">{(p) => <Input {...p} value={data.contact.address} onChange={(e) => set("contact", { ...data.contact, address: e.target.value })} />}</Field>
              <Field label="Xaritadagi havola" hint="Google/Yandex xarita havolasi">{(p) => <Input {...p} value={data.contact.map_url} onChange={(e) => set("contact", { ...data.contact, map_url: e.target.value })} placeholder="https://" />}</Field>
              <Field label="Telefon">{(p) => <Input {...p} type="tel" value={data.contact.phone} onChange={(e) => set("contact", { ...data.contact, phone: e.target.value })} placeholder="+998 …" />}</Field>
              <Field label="Email">{(p) => <Input {...p} type="email" value={data.contact.email} onChange={(e) => set("contact", { ...data.contact, email: e.target.value })} />}</Field>
              <Field label="Ish vaqti">{(p) => <Input {...p} value={data.contact.working_hours} onChange={(e) => set("contact", { ...data.contact, working_hours: e.target.value })} placeholder="Du–Ju, 9:00–18:00" />}</Field>
            </div>
            <p className="text-xs text-muted">Boʻsh qoldirilgan maydonlar saytda koʻrsatilmaydi.</p>
          </>
        )}

        {tab === "social" && (
          <>
            {(["telegram", "instagram", "youtube", "facebook"] as const).map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                {(p) => <Input {...p} type="url" value={data.social[k]} onChange={(e) => set("social", { ...data.social, [k]: e.target.value })} placeholder={k === "telegram" ? "https://t.me/…" : "https://"} />}
              </Field>
            ))}
            <p className="text-xs text-muted">Faqat toʻldirilgan tarmoqlar saytning pastki qismida koʻrsatiladi.</p>
          </>
        )}

        {tab === "general" && (
          <>
            <Field label="Sayt nomi">{(p) => <Input {...p} value={data.general.site_name} onChange={(e) => set("general", { ...data.general, site_name: e.target.value })} />}</Field>
            <Field label="Qisqa tavsif (pastki qismda)">{(p) => <Input {...p} value={data.general.tagline} onChange={(e) => set("general", { ...data.general, tagline: e.target.value })} />}</Field>
            <Field label="Pastki izoh">{(p) => <Input {...p} value={data.general.footer_note} onChange={(e) => set("general", { ...data.general, footer_note: e.target.value })} />}</Field>
          </>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={save} loading={pending}>Saqlash</Button>
        </div>
      </div>
    </Card>
  );
}

function ListEditor<T>({ label, items, onChange, render, empty, max }: {
  label: string; items: T[]; onChange: (v: T[]) => void; render: (item: T, update: (v: T) => void) => React.ReactNode; empty: T; max: number;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-navy-900">{label}</legend>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-lg border border-line bg-cream-50 p-3">
          <div className="flex flex-1 flex-col gap-2">{render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}</div>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-danger-100 hover:text-danger-700" aria-label="Oʻchirish"><ITrash className="size-4" /></button>
        </div>
      ))}
      {items.length < max && <Button variant="ghost" size="sm" onClick={() => onChange([...items, structuredClone(empty)])}><IPlus className="size-4" /> Qoʻshish</Button>}
    </fieldset>
  );
}

function GalleryEditor({ items, onChange }: { items: SiteContent["gallery"]["items"]; onChange: (v: SiteContent["gallery"]["items"]) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-navy-900">Rasmlar ({items.length}/40)</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g, i) => (
          <li key={g.path} className="overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicMediaUrl(g.path) ?? ""} alt="" className="aspect-square w-full object-cover" />
            <div className="space-y-1 p-2">
              <input aria-label="Izoh" value={g.caption} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} placeholder="Izoh" className="h-8 w-full rounded border border-line px-2 text-xs" />
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-danger-700">Olib tashlash</button>
            </div>
          </li>
        ))}
      </ul>
      {items.length < 40 && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-cream-50">
          <IPlus className="size-4" /> {loading ? "Yuklanmoqda…" : "Rasm qoʻshish"}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={loading}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 40 - items.length);
              e.target.value = "";
              setLoading(true);
              setError(null);
              const added: SiteContent["gallery"]["items"] = [];
              for (const f of files) {
                try { added.push({ path: (await uploadMedia(f, "gallery")).path, caption: "" }); }
                catch (err) { setError(err instanceof Error ? err.message : "Xatolik"); }
              }
              onChange([...items, ...added]);
              setLoading(false);
            }}
          />
        </label>
      )}
      {error && <p className="text-sm text-danger-700">{error}</p>}
      <p className="text-xs text-muted">Rasm qoʻshgandan yoki olib tashlagandan keyin “Saqlash”ni bosing.</p>
    </div>
  );
}
