import Link from "next/link";
import { cn } from "@/lib/cn";

export function Pagination({ page, pageSize, total, makeHref }: { page: number; pageSize: number; total: number; makeHref: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="px-5 py-4 text-sm text-muted sm:px-6">Jami: {total} ta</p>;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium";
  return (
    <nav aria-label="Sahifalar" className="flex flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row sm:px-6">
      <p className="text-sm text-muted">{from}–{to} / jami {total} ta</p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? <Link className={cn(btn, "bg-white hover:bg-cream-50")} href={makeHref(page - 1)}>← Oldingi</Link> : <span className={cn(btn, "opacity-40")}>← Oldingi</span>}
        <span className="px-2 text-sm text-muted">{page} / {pages}</span>
        {page < pages ? <Link className={cn(btn, "bg-white hover:bg-cream-50")} href={makeHref(page + 1)}>Keyingi →</Link> : <span className={cn(btn, "opacity-40")}>Keyingi →</span>}
      </div>
    </nav>
  );
}

export function searchTerms(q: string): string[] {
  return q
    .replace(/[,()%_\\*"]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 5);
}
