"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconSearch } from "@/components/site/icons";
import { Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export interface FilterDef { name: string; label: string; options: { value: string; label: string }[] }

/** Search box + dropdown filters that live in the URL (shareable, back-button friendly). */
export function ListFilters({ placeholder, filters = [] }: { placeholder: string; filters?: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();
  const first = useRef(true);

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    start(() => router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`));
  }

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => update({ q: q.trim() }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:px-6">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Qidirish"
          className="h-11 w-full rounded-lg border border-line bg-white pr-10 pl-11 text-[15px] focus:border-gold-500 focus:ring-3 focus:ring-gold-300/40 focus:outline-none"
        />
        {pending && <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />}
      </div>
      {filters.map((f) => (
        <Select key={f.name} aria-label={f.label} value={params.get(f.name) ?? ""} onChange={(e) => update({ [f.name]: e.target.value })} className="sm:w-52">
          <option value="">{f.label}: barchasi</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      ))}
    </div>
  );
}
