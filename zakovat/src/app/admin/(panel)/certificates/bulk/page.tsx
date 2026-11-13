import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { BulkGenerator } from "@/components/admin/bulk-generator";
import { requireAdminPage } from "@/lib/auth";
import { loadIssuingData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Ommaviy sertifikat yaratish" };

export default async function BulkPage() {
  await requireAdminPage("issueCertificates");
  const { templates, events } = await loadIssuingData();
  return (
    <>
      <PageTitle title="Ommaviy sertifikat yaratish" description="Excel yoki CSV roʻyxatni yuklang — har bir ishtirokchi uchun alohida sertifikat, QR kod va PDF yaratiladi, oxirida hammasini ZIP qilib yuklab olasiz." />
      <BulkGenerator templates={templates} events={events} />
    </>
  );
}
