import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "arabic"],
});

export const metadata: Metadata = {
  title: "وكالة الأنباء العالمية | Global News Agency",
  description: "موقع إخباري آلي يغطي العالم بأربع لغات على مدار الساعة - أخبار السياسة والاقتصاد والرياضة والتكنولوجيا",
  keywords: ["أخبار", "news", "عالمية", "سياسة", "اقتصاد", "رياضة", "تكنولوجيا"],
  authors: [{ name: "Global News Agency" }],
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
