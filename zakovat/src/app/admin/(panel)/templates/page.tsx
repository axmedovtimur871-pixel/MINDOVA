import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { NewTemplateButton } from "@/components/admin/new-template-button";
import { CertificatePreview } from "@/components/certificate/certificate-preview";
import { IEdit } from "@/components/admin/admin-icons";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_DATA } from "@/lib/certificates/layout";
import type { TemplateRow } from "@/lib/types";

export const metadata: Metadata = { title: "Sertifikat shablonlari" };

export default async function TemplatesPage() {
  await requireAdminPage("manageTemplates");
  const supabase = await createClient();
  const { data } = await supabase.from("certificate_templates").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: false });
  const templates = (data ?? []) as TemplateRow[];
  return (
    <>
      <PageTitle
        title="Sertifikat shablonlari"
        description="Fon rasmini yuklang va ism, sana, tashkilotchi hamda QR kod qayerda turishini belgilang."
        actions={<NewTemplateButton />}
      />
      {templates.length === 0 ? (
        <Card><EmptyState title="Shablon yoʻq" text="Birinchi shablonni yuklang." /></Card>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Card className="overflow-hidden">
                <div className="border-b border-line bg-cream-100 p-3">
                  <CertificatePreview template={t} data={SAMPLE_DATA} qrValue="https://zakovat-andijon.uz/verify/namuna" className="rounded shadow-soft" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-navy-900">{t.name}</h2>
                    <div className="flex shrink-0 gap-1">
                      {t.is_default && <Badge tone="gold">Asosiy</Badge>}
                      {t.is_active ? <Badge tone="success">Faol</Badge> : <Badge>Faol emas</Badge>}
                    </div>
                  </div>
                  {t.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{t.description}</p>}
                  <Link href={`/admin/templates/${t.id}`} className={buttonClass("outline", "sm", "mt-4 w-full")}><IEdit className="size-4" /> Sozlash</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
