import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "arabic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "وكالة الأنباء العالمية | Global News Agency",
    template: "%s | وكالة الأنباء العالمية",
  },
  description: "موقع إخباري آلي يغطي العالم بأربع لغات على مدار الساعة - أخبار السياسة والاقتصاد والرياضة والتكنولوجيا والصحة",
  keywords: ["أخبار", "news", "عالمية", "سياسة", "اقتصاد", "رياضة", "تكنولوجيا", "صحة", "كرة قدم", "أسعار"],
  authors: [{ name: "Global News Agency" }],
  creator: "Global News Agency",
  publisher: "Global News Agency",
  manifest: "/manifest.json",
  applicationName: "وكالة الأنباء العالمية",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Global News",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    alternateLocale: ["en_US", "fr_FR", "es_ES"],
    url: "/",
    siteName: "وكالة الأنباء العالمية",
    title: "وكالة الأنباء العالمية | Global News Agency",
    description: "موقع إخباري آلي يغطي العالم بأربع لغات على مدار الساعة",
  },
  twitter: {
    card: "summary_large_image",
    title: "وكالة الأنباء العالمية",
    description: "آخر أخبار العالم في السياسة والاقتصاد والرياضة والتكنولوجيا",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss',
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B2A4A" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-white text-slate-900`}>
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
