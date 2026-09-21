import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { JsonLd } from "@/components/JsonLd";
import { CookieBanner } from "@/components/CookieBanner";
import { CloudflareWebAnalytics } from "@/components/CloudflareWebAnalytics";
import { GoogleAdsSnippet } from "@/components/GoogleAdsSnippet";
import { GoogleAdsTag } from "@/components/GoogleAdsTag";
import { MetaPixel } from "@/components/MetaPixel";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { localBusinessSchema } from "@/lib/structured-data";
import { isValidCfWebAnalyticsToken } from "@/lib/cloudflare-web-analytics";
import { isValidClarityId } from "@/lib/clarity";
import { isValidGoogleAdsId } from "@/lib/google-ads";
import { isValidPixelId } from "@/lib/pixel";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Yoga Experiences in Lisbon`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "yoga Lisbon",
    "sunrise yoga Lisbon",
    "sunset yoga Lisbon",
    "beach yoga Lisbon",
    "corporate yoga Lisbon",
    "private yoga Lisbon",
    "yoga classes Lisbon",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Yoga Experiences in Lisbon`,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Yoga Experiences in Lisbon`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: { index: true, follow: true },
  verification: {
    google: "CB0B9TEHyF_ua_LWLRmBEhO-GPkNp9TnG3BYgdPwTcU",
  },
  appleWebApp: {
    title: siteConfig.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.locale}
      data-scroll-behavior="smooth"
      className={`${body.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream">
        <JsonLd data={localBusinessSchema()} />
        {process.env.NODE_ENV === "production" &&
        isValidCfWebAnalyticsToken(siteConfig.cfWebAnalyticsToken) ? (
          <CloudflareWebAnalytics token={siteConfig.cfWebAnalyticsToken} />
        ) : null}
        {process.env.NODE_ENV === "production" &&
        isValidPixelId(siteConfig.metaPixelId) ? (
          <MetaPixel pixelId={siteConfig.metaPixelId} />
        ) : null}
        {process.env.NODE_ENV === "production" &&
        isValidClarityId(siteConfig.clarityId) ? (
          <MicrosoftClarity projectId={siteConfig.clarityId} />
        ) : null}
        {process.env.NODE_ENV === "production" &&
        isValidGoogleAdsId(siteConfig.googleAdsId) ? (
          <>
            <GoogleAdsSnippet conversionId={siteConfig.googleAdsId} />
            <GoogleAdsTag
              conversionId={siteConfig.googleAdsId}
              purchaseLabel={siteConfig.googleAdsPurchaseLabel}
            />
          </>
        ) : null}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <CookieBanner />
      </body>
    </html>
  );
}
