import type { Metadata } from "next";
import { Caveat, Fraunces, Inter } from "next/font/google";
import { brand } from "@/config/brand";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicMarket } from "@/services/listings";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-heading", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: `${brand.name} | Verified property in ${brand.city}`, template: `%s | ${brand.name}` },
  description: `Physically verified homes in ${brand.city}. Buyers pay no brokerage, and phone numbers stay with ${brand.name}.`,
  applicationName: brand.name,
  openGraph: { type: "website", siteName: brand.name, locale: "en_IN" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const market = await getPublicMarket();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
            Skip to content
          </a>
          <SiteHeader typeCounts={market.typeCounts} />
          <main id="main">{children}</main>
          <SiteFooter localities={market.localities} />
        </Providers>
      </body>
    </html>
  );
}
