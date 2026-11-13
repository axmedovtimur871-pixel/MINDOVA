"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { IBan, IRestore } from "./admin-icons";

/** Revoke (with mandatory reason) or restore a certificate. */
export function StatusToggle({ id, status, number, size = "sm", canRevoke }: { id: string; status: "active" | "revoked"; number: string; size?: "sm" | "md"; canRevoke: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!canRevoke) return null;

  const target = status === "active" ? "revoked" : "active";

  async function submit() {
    if (target === "revoked" && !reason.trim()) return setError("Sababni yozing — bu tarixda saqlanadi.");
    setLoading(true);
    const res = await fetch(`/api/admin/certificates/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target, reason: reason.trim() || undefined }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(json.error ?? "Xatolik");
    setOpen(false);
    setReason("");
    toast(target === "revoked" ? `${number} bekor qilindi` : `${number} qayta tiklandi`);
    router.refresh();
  }

  return (
    <>
      {status === "active" ? (
        <Button variant="outline" size={size} onClick={() => setOpen(true)} className="text-danger-700 hover:border-danger-700 hover:bg-danger-100">
          <IBan className="size-4" /> Bekor qilish
        </Button>
      ) : (
        <Button variant="outline" size={size} onClick={() => setOpen(true)}>
          <IRestore className="size-4" /> Qayta tiklash
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={target === "revoked" ? "Sertifikatni bekor qilish" : "Sertifikatni qayta tiklash"}
        description={
          target === "revoked"
            ? <>Bekor qilingan <b className="font-mono">{number}</b> sertifikat tekshirilganda “BEKOR QILINGAN” deb koʻrsatiladi va PDF yuklab boʻlmaydi. Keyinroq qayta tiklash mumkin.</>
            : <><b className="font-mono">{number}</b> yana “TASDIQLANDI” holatiga qaytadi.</>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button variant={target === "revoked" ? "danger" : "primary"} loading={loading} onClick={submit}>
              {target === "revoked" ? "Ha, bekor qilish" : "Ha, tiklash"}
            </Button>
          </>
        }
      >
        {target === "revoked" && (
          <Field label="Sabab" required error={error} hint="Masalan: ism xato yozilgan, tadbirda qatnashmagan.">
            {(p) => <Textarea {...p} value={reason} maxLength={500} onChange={(e) => { setReason(e.target.value); setError(null); }} />}
          </Field>
        )}
        {target === "active" && error && <p className="text-sm text-danger-700">{error}</p>}
      </Modal>
    </>
  );
}
