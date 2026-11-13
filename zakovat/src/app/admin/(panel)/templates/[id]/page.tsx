import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/admin-shell";
import { TemplateEditor } from "@/components/admin/template-editor";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TemplateRow } from "@/lib/types";

export const metadata: Metadata = { title: "Shablonni sozlash" };

export default async function TemplatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  await requireAdminPage("manageTemplates");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("certificate_templates").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { count } = await supabase.from("certificates").select("id", { count: "exact", head: true }).eq("template_id", id);
  return (
    <>
      <PageTitle
        title={data.name}
        description="Matn, sana, tashkilotchi va QR kod joylashuvini sozlang. Oʻzgarishlar “Saqlash” bosilgandan keyin yangi sertifikatlarga qoʻllanadi."
        actions={<Link href="/admin/templates" className="text-sm font-semibold text-navy-700 hover:text-gold-600">← Barcha shablonlar</Link>}
      />
      <TemplateEditor template={data as TemplateRow} isNew={(await searchParams).new === "1"} certificateCount={count ?? 0} />
    </>
  );
}
