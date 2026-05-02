"use client";

import { cn } from "@/lib/utils";
import { Stethoscope } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  /** Wider form column for long flows (e.g. registration). */
  formWidth?: "md" | "2xl";
}

export function AuthPageLayout({
  children,
  title,
  subtitle,
  formWidth = "md",
}: AuthPageLayoutProps) {
  const col =
    formWidth === "2xl"
      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)]"
      : "lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]";
  const innerMax = formWidth === "2xl" ? "max-w-2xl" : "max-w-md";

  return (
    <div className={cn("relative min-h-screen lg:grid", col)}>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 px-10 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary-400/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/4 translate-y-1/4 rounded-full bg-cyan-400/20 blur-3xl" />
        <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </span>
          CareSlot
        </Link>
        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-base leading-relaxed text-teal-100/90">{subtitle}</p>
        </div>
        <p className="relative z-10 text-xs text-teal-200/70">
          Secure scheduling · HIPAA-minded design patterns
        </p>
      </div>

      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className={cn("mx-auto w-full animate-in", innerMax)}>{children}</div>
      </div>
    </div>
  );
}
