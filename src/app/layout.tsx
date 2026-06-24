import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { initSentry } from "@/lib/sentry";
import { ThemeProvider } from "@/lib/theme-provider";

// Initialize Sentry (no-op if not configured)
initSentry();

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
      <head>
        {/* PostHog Analytics */}
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:1,hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
                })(window,document,'https://app.posthog.com/static/array.js','?v=');
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1])}t.set=a?t.get:function(t,e){if(t=e?g(e,t):t,"string"==typeof t)return function(){};if(void 0===t)return function(){};for(var o=arguments.length,n=Array(o>1?o-1:0),p=1;p<o;p++)n[p-1]=arguments[p];return t.apply(e,n)},t.get=function(){},e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', {api_host: '${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}'})
              `,
            }}
          />
        )}
      </head>
      <body className={`${geistSans.variable} antialiased bg-white text-slate-900`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
