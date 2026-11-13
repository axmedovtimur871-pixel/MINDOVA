import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { IPlus } from "@/components/admin/admin-icons";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = { title: "Tadbirlar" };
const STATUS = { draft: { label: "Qoralama", tone: "neutral" }, published: { label: "Eʼlon qilingan", tone: "success" }, archived: { label: "Arxiv", tone: "navy" } } as const;

export default async function EventsAdminPage() {
  await requireAdminPage("manageEvents");
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: false, nullsFirst: true });
  const events = (data ?? []) as EventRow[];
  return (
    <>
      <PageTitle title="Tadbirlar" description="Saytdagi “Tadbirlarimiz” boʻlimi va sertifikat formalaridagi tadbirlar roʻyxati shu yerdan boshqariladi." actions={<LinkButton href="/admin/events/new"><IPlus className="size-5" /> Yangi tadbir</LinkButton>} />
      <Card>
        {events.length === 0 ? (
          <EmptyState title="Hali tadbir yoʻq" text="Birinchi tadbirni qoʻshing — u saytda va sertifikat yaratishda koʻrinadi." action={<LinkButton href="/admin/events/new" size="sm"><IPlus className="size-4" /> Tadbir qoʻshish</LinkButton>} />
        ) : (
          <ul className="divide-y divide-line">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-cream-50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy-900">{e.title}</p>
                    <p className="text-sm text-muted">{e.starts_at ? formatDateTime(e.starts_at) : "Sana belgilanmagan"}{e.location ? ` · ${e.location}` : ""}</p>
                  </div>
                  <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
