import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "warning" | "info";
const tones: Record<Tone, string> = {
  success: "border-success-700/20 bg-success-100 text-success-700",
  danger: "border-danger-700/20 bg-danger-100 text-danger-700",
  warning: "border-warning-700/20 bg-warning-100 text-warning-700",
  info: "border-navy-700/15 bg-navy-50 text-navy-800",
};

export function Alert({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm leading-6", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5", "opacity-95")}>{children}</div>}
    </div>
  );
}
