import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { ContentEditor } from "@/components/admin/content-editor";
import { PasswordForm } from "@/components/admin/password-form";
import { ROLE_LABELS, can, requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mergeContent } from "@/lib/content";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const admin = await requireAdminPage();
  const canContent = can(admin.role, "manageContent");
  let content = null;
  if (canContent) {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("key, value");
    content = mergeContent(data ?? []);
  }
  return (
    <>
      <PageTitle title="Sozlamalar" description={canContent ? "Saytdagi barcha matnlar, kontaktlar, galereya va ijtimoiy tarmoqlar shu yerda tahrirlanadi." : "Hisobingiz sozlamalari."} />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {content ? <ContentEditor content={content} /> : <Card className="p-6 text-sm text-muted">Sayt matnlarini tahrirlash Administrator va Bosh administrator uchun.</Card>}
        <Card className="self-start">
          <CardHeader title="Mening hisobim" description={`${admin.email} · ${ROLE_LABELS[admin.role]}`} />
          <div className="p-5 sm:p-6"><PasswordForm /></div>
        </Card>
      </div>
    </>
  );
}
