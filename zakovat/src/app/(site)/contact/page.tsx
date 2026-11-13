import type { Metadata } from "next";
import { ContactSection, PageHeader } from "@/components/site/sections";
import { getSiteContent } from "@/lib/public-data";
import { t } from "@/i18n";

export const revalidate = 60;
export const metadata: Metadata = { title: t.nav.contact };

export default async function ContactPage() {
  const content = await getSiteContent();
  return (
    <>
      <PageHeader eyebrow={content.general.site_name} title={content.contact.title} intro={content.contact.intro} />
      <ContactSection contact={{ ...content.contact, intro: "" }} social={content.social} />
    </>
  );
}
