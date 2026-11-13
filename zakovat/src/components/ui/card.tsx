import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-soft", className)}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: string; text?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-300/60">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="6" y="6" width="12" height="12" />
            <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
          </svg>
        )}
      </div>
      <p className="font-semibold text-navy-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
