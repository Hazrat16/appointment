import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import React, { forwardRef } from "react";

const selectFieldClasses =
  "peer flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-white/90 py-2 pl-3.5 pr-10 text-sm text-foreground shadow-inner shadow-black/[0.02] transition-[border-color,box-shadow,color] placeholder:text-muted-foreground focus-visible:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 disabled:cursor-not-allowed disabled:opacity-50 hover:border-secondary-300";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className, id, children, ...props }, ref) => {
    const selectId = id || `select-${React.useId()}`;

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              selectFieldClasses,
              error &&
                "border-error-400 focus-visible:border-error-500 focus-visible:ring-error-200",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground peer-disabled:opacity-50"
            aria-hidden
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-sm font-medium text-error-600">{error}</p>
        ) : null}
        {helperText && !error ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
