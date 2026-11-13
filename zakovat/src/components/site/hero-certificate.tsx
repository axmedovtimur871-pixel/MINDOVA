"use client";

import { CertificatePreview } from "@/components/certificate/certificate-preview";
import { SAMPLE_DATA, defaultLayout } from "@/lib/certificates/layout";

/** Decorative sample certificate (clearly marked "NAMUNA" – sample). */
export function HeroCertificate() {
  return (
    <div className="relative [perspective:1600px]">
      <div className="absolute inset-x-8 -bottom-6 h-10 rounded-[50%] bg-black/40 blur-2xl" aria-hidden="true" />
      <div className="relative origin-center rotate-[-2.5deg] overflow-hidden rounded-md shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-gold-400/40 transition-transform duration-700 hover:rotate-0 [transform-style:preserve-3d]">
        <CertificatePreview
          template={{ background_path: "builtin/zakovat-certificate.jpg", page_size: "A4_LANDSCAPE", background_fit: "cover", layout: defaultLayout() }}
          data={{ ...SAMPLE_DATA, issue_date: "2026-01-01", certificate_number: "ZA-NAMUNA" }}
          qrValue="https://zakovat-andijon.uz/verify"
          watermark="Namuna"
        />
      </div>
      <p className="mt-6 text-center text-xs tracking-[0.16em] text-cream-100/50 uppercase">QR kod orqali tekshiriladigan sertifikat</p>
    </div>
  );
}
