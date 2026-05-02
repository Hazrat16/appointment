import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        className="min-h-screen bg-gray-50"
        aria-busy="true"
        aria-label="Loading application"
      />
    ),
  }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doctor Appointment Booking",
  description: "Book appointments with doctors easily and efficiently",
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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
