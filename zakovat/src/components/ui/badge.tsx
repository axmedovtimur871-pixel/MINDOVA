import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "warning" | "neutral" | "gold" | "navy";
const tones: Record<Tone, string> = {
  success: "bg-success-100 text-success-700 ring-success-700/15",
  danger: "bg-danger-100 text-danger-700 ring-danger-700/15",
  warning: "bg-warning-100 text-warning-700 ring-warning-700/15",
  neutral: "bg-cream-100 text-muted ring-muted/15",
  gold: "bg-gold-100 text-gold-700 ring-gold-600/20",
  navy: "bg-navy-100 text-navy-800 ring-navy-700/15",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export function CertificateStatusBadge({ status }: { status: "active" | "revoked" }) {
  return status === "active" ? (
    <Badge tone="success"><span className="size-1.5 rounded-full bg-current" />Faol</Badge>
  ) : (
    <Badge tone="danger"><span className="size-1.5 rounded-full bg-current" />Bekor qilingan</Badge>
  );
}

export function ResultBadge({ result }: { result: "verified" | "revoked" | "not_found" }) {
  if (result === "verified") return <Badge tone="success">Tasdiqlandi</Badge>;
  if (result === "revoked") return <Badge tone="danger">Bekor qilingan</Badge>;
  return <Badge tone="warning">Topilmadi</Badge>;
}
