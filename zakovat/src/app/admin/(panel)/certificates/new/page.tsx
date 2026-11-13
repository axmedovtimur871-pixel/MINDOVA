import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { SingleCertificateForm } from "@/components/admin/single-certificate-form";
import { requireAdminPage } from "@/lib/auth";
import { loadIssuingData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Sertifikat yaratish" };

export default async function NewCertificatePage() {
  await requireAdminPage("issueCertificates");
  const { templates, events } = await loadIssuingData();
  return (
    <>
      <PageTitle title="Sertifikat yaratish" description="Ism va familiyani kiriting — raqam, QR kod va PDF avtomatik tayyorlanadi." />
      <SingleCertificateForm templates={templates} events={events} />
    </>
  );
}
