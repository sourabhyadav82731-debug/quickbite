import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

// Poppins for headings (editorial, premium weight) and Manrope for body
// copy/UI text — both loaded once at the root and exposed as CSS variables
// so every portal picks them up via the --font-heading/--font-body tokens
// in globals.css, with zero per-page changes.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quickbits",
  description: "Bites that reach you quick! Quickbits multi-portal food delivery platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable} ${manrope.variable}`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
