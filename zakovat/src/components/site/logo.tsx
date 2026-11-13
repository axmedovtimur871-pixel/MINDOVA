import { cn } from "@/lib/cn";

/** ZAKOVAT ANDIJON mark: an eight-pointed star (Central Asian geometric motif) framing a "Z". */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const z = tone === "dark" ? "#0f2044" : "#f6edd5";
  return (
    <svg viewBox="0 0 48 48" className={cn("shrink-0", className)} aria-hidden="true">
      <g fill="none" stroke="#c29a3e" strokeWidth="2.2">
        <rect x="11" y="11" width="26" height="26" />
        <rect x="11" y="11" width="26" height="26" transform="rotate(45 24 24)" />
      </g>
      <path d="M18.2 17.8h11.6l-9.4 12.4h11.2" fill="none" stroke={z} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ tone = "dark", className, compact }: { tone?: "dark" | "light"; className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-10" tone={tone} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[19px] font-bold tracking-[0.06em]", tone === "dark" ? "text-navy-900" : "text-cream-50")}>
            ZAKOVAT
          </span>
          <span className={cn("mt-1 text-[10.5px] font-semibold tracking-[0.42em]", tone === "dark" ? "text-gold-600" : "text-gold-400")}>
            ANDIJON
          </span>
        </span>
      )}
    </span>
  );
}
