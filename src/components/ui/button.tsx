import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--teal-700)] text-white shadow-sm hover:bg-[var(--ink)]",
  secondary: "border border-[var(--teal-700)] bg-transparent text-[var(--teal-700)] hover:bg-[var(--surface-low)]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--surface-low)]",
  danger: "bg-[var(--danger)] text-white shadow-sm hover:brightness-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref,
) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)] disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      data-variant={variant}
      ref={ref}
      {...props}
    />
  );
});
