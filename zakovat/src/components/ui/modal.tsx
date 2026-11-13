"use client";

import { useEffect, useRef } from "react";
import { IconClose } from "@/components/site/icons";
import { cn } from "@/lib/cn";

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: string; description?: React.ReactNode;
  children?: React.ReactNode; footer?: React.ReactNode; size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, select, button[data-autofocus]")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade bg-navy-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("relative max-h-[92dvh] w-full animate-rise overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl", size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md")}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy-900">{title}</h2>
            {description && <div className="mt-1 text-sm leading-6 text-muted">{description}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-cream-100 hover:text-navy-900">
            <IconClose className="size-5" />
          </button>
        </div>
        {children && <div className="px-5 pt-4 sm:px-6">{children}</div>}
        {footer && <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line bg-cream-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}
