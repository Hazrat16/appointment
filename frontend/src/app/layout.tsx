import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const AppProviders = dynamic(
  () =>
    import("@/components/AppProviders").then((mod) => ({
      default: mod.AppProviders,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="app-surface min-h-screen"
        aria-busy="true"
        aria-label="Loading application"
      />
    ),
  }
);

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareSlot — Appointments made simple",
  description: "Book verified doctors, manage visits, and stay on top of your care.",
  keywords: ["doctor", "appointment", "booking", "healthcare", "medical"],
  authors: [{ name: "Your Name" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontSans.variable} h-full`}>
      <body className={`${fontSans.className} app-surface min-h-full text-foreground`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
