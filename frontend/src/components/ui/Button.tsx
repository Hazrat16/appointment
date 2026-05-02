import { cn } from "@/lib/utils";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ring-offset-background active:scale-[0.98]";

  const variantClasses = {
    primary:
      "rounded-xl bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-md shadow-primary-900/15 hover:from-primary-600 hover:to-primary-800 focus-visible:ring-primary-400",
    secondary:
      "rounded-xl bg-secondary-100 text-secondary-900 shadow-soft hover:bg-secondary-200 focus-visible:ring-secondary-400",
    success:
      "rounded-xl bg-success-600 text-white shadow-md shadow-success-900/10 hover:bg-success-700 focus-visible:ring-success-500",
    warning:
      "rounded-xl bg-warning-600 text-white shadow-md hover:bg-warning-700 focus-visible:ring-warning-500",
    error:
      "rounded-xl bg-error-600 text-white shadow-md hover:bg-error-700 focus-visible:ring-error-500",
    outline:
      "rounded-xl border border-input bg-white/90 text-foreground shadow-soft hover:bg-muted hover:border-secondary-300 focus-visible:ring-primary-500",
    ghost:
      "rounded-xl text-foreground hover:bg-muted/80 focus-visible:ring-primary-500",
  };

  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-12 px-8 text-base gap-2 rounded-xl",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

export default Button;
