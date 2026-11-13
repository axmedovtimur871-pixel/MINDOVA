"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IUpload } from "./admin-icons";
import { uploadMedia } from "@/lib/upload-client";
import { publicMediaUrl } from "@/lib/env";

export function ImageUploadField({ label, value, onChange, folder, hint }: {
  label: string; value: string | null; onChange: (path: string | null) => void;
  folder: "events" | "gallery" | "site"; hint?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = publicMediaUrl(value);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-navy-900">{label}</span>
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-20 rounded-lg object-cover ring-1 ring-line" />
        ) : (
          <div className="pattern-octagram size-20 rounded-lg bg-cream-100 ring-1 ring-line" />
        )}
        <div className="flex flex-col items-start gap-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 hover:bg-cream-50">
            <IUpload className="size-4" /> {loading ? "Yuklanmoqda…" : url ? "Almashtirish" : "Rasm yuklash"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={loading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setLoading(true);
                setError(null);
                try { onChange((await uploadMedia(f, folder)).path); } catch (err) { setError(err instanceof Error ? err.message : "Xatolik"); } finally { setLoading(false); }
              }}
            />
          </label>
          {url && <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="text-danger-700">Olib tashlash</Button>}
        </div>
      </div>
      {error ? <p className="text-sm text-danger-700">{error}</p> : hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  );
}
