import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = { title: "Tadbirni tahrirlash" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("manageEvents");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageTitle title="Tadbirni tahrirlash" actions={<Link href="/admin/events" className="text-sm font-semibold text-navy-700 hover:text-gold-600">← Barcha tadbirlar</Link>} />
      <EventForm event={data as EventRow} />
    </>
  );
}
