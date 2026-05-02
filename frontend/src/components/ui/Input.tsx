import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

const inputFieldClasses =
  "flex h-11 w-full rounded-xl border border-input bg-white/90 px-3.5 py-2 text-sm text-foreground shadow-inner shadow-black/[0.02] transition-shadow placeholder:text-muted-foreground focus-visible:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 disabled:cursor-not-allowed disabled:opacity-50";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Renders inside the field on the right (e.g. password visibility toggle). */
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, suffix, className, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;

    const control = (
      <input
        id={inputId}
        ref={ref}
        className={cn(
          inputFieldClasses,
          suffix && "pr-11",
          error &&
            "border-error-400 focus-visible:border-error-500 focus-visible:ring-error-200",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        {suffix ? (
          <div className="relative">
            {control}
            <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-1">
              {suffix}
            </div>
          </div>
        ) : (
          control
        )}
        {error && (
          <p className="mt-1.5 text-sm font-medium text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
