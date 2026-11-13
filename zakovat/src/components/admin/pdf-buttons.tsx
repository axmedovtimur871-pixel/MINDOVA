"use client";

import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { IconDownload } from "@/components/site/icons";
import { ICopy, IPrinter } from "./admin-icons";

export function PdfButtons({ id, verifyLink, size = "md" }: { id: string; verifyLink: string; size?: "sm" | "md" }) {
  const toast = useToast();
  const [printing, setPrinting] = useState(false);

  function print() {
    const url = `/api/admin/certificates/${id}/pdf?inline=1`;
    // Phones cannot print from a hidden frame – open the PDF instead.
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return void window.open(url, "_blank");
    setPrinting(true);
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    frame.src = url;
    frame.onload = () => {
      setPrinting(false);
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
      setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(verifyLink);
      toast("Tekshirish havolasi nusxalandi");
    } catch {
      toast(verifyLink, "info");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/api/admin/certificates/${id}/pdf`} className={buttonClass("primary", size)}><IconDownload className="size-5" /> PDF yuklab olish</a>
      <Button variant="outline" size={size} onClick={print} loading={printing}><IPrinter className="size-5" /> Chop etish</Button>
      <Button variant="outline" size={size} onClick={copy}><ICopy className="size-5" /> Havolani nusxalash</Button>
    </div>
  );
}
