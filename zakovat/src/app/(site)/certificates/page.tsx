import type { Metadata } from "next";
import { PageHeader, VerifyCtaSection } from "@/components/site/sections";
import { IconDownload, IconQr, IconShield } from "@/components/site/icons";
import { t } from "@/i18n";

export const metadata: Metadata = { title: t.certificates.title };

export default function CertificatesPage() {
  const steps = [
    { Icon: IconDownload, title: t.certificates.step1, text: t.certificates.step1Text },
    { Icon: IconQr, title: t.certificates.step2, text: t.certificates.step2Text },
    { Icon: IconShield, title: t.certificates.step3, text: t.certificates.step3Text },
  ];
  return (
    <>
      <PageHeader eyebrow={t.nav.certificates} title={t.certificates.title} intro={t.certificates.intro} />
      <section className="container-page py-16 sm:py-20">
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={i} className="relative rounded-2xl border border-line bg-white p-6 shadow-soft">
              <span className="absolute top-5 right-5 font-display text-5xl font-semibold text-gold-100">{i + 1}</span>
              <span className="grid size-12 place-items-center rounded-xl bg-navy-900 text-gold-300"><Icon className="size-6" /></span>
              <h2 className="mt-5 font-display text-xl font-semibold text-navy-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-4 rounded-2xl border border-line bg-cream-100 p-6 text-sm leading-6 text-muted sm:grid-cols-3">
          <p><strong className="text-navy-900">TASDIQLANDI</strong> — sertifikat bazada mavjud va amalda.</p>
          <p><strong className="text-danger-700">BEKOR QILINGAN</strong> — sertifikat administrator tomonidan bekor qilingan.</p>
          <p><strong className="text-navy-900">TOPILMADI</strong> — bunday raqamli sertifikat bazada yoʻq.</p>
        </div>
      </section>
      <VerifyCtaSection />
    </>
  );
}
