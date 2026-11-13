import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "gold" | "outline" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 select-none disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-cream-50 hover:bg-navy-800 active:bg-navy-950 shadow-soft",
  gold: "bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-soft",
  outline: "border border-navy-200 bg-white text-navy-900 hover:border-navy-600 hover:bg-navy-50",
  ghost: "text-navy-800 hover:bg-navy-50",
  danger: "bg-danger-700 text-white hover:bg-[#8a2222] shadow-soft",
  light: "border border-white/25 bg-white/5 text-cream-50 hover:bg-white/12 hover:border-white/45 backdrop-blur",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
