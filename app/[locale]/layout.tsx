import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider, hasLocale, useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from "@/components/sections/Navbar";
import WavesBackground from "@/components/ui/waves/waves-background";
import FooterSection from "@/components/sections/Footer";
import { ThemeProvider } from "@/components/theme-provider"
import { getTranslations } from 'next-intl/server';
import { Toaster } from "@/components/ui/sonner"
import LiquidEther from "@/components/ui/liquidether/LiquidEther";
import LiquidEtherBackground from "@/components/ui/liquidether/LiquidEtherBackground";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import UnderConstructionWrapper from "@/components/UnderConstructionWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // This ensures relative URLs (like '/IMG_7827_cropped.jpg') are turned into absolute URLs.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wiebevandendriessche.tech'),

  title: "Wiebe",
  description: "Wiebe Vandendriessche: Portfolio Website",

  // Use your photo as the site icon (favicon) and Apple touch icon.
  // Add a version query to bust aggressive browser caches of favicons.
  icons: {
    icon: [
      { url: '/IMG_7827_cropped.jpg?v=2', type: 'image/jpeg', rel: 'icon', sizes: 'any' }
    ],
    shortcut: [
      { url: '/IMG_7827_cropped.jpg?v=2', type: 'image/jpeg' }
    ],
    apple: [
      { url: '/IMG_7827_cropped.jpg?v=2', type: 'image/jpeg' }
    ]
  },

  // Default Open Graph image (used by social platforms and sometimes search engines)
  openGraph: {
    title: "Wiebe",
    description: "Wiebe Vandendriessche: Portfolio Website",
    url: '/',
    siteName: 'Wiebe Vandendriessche',
    type: 'website',
    images: ['/IMG_7827_cropped.jpg?v=2']
  },

  // Default Twitter card
  twitter: {
    card: 'summary_large_image',
    title: 'Wiebe',
    description: 'Wiebe Vandendriessche: Portfolio Website',
    images: ['/IMG_7827_cropped.jpg?v=2']
    // site: '@yourhandle' // Optional if you have one
  },

  // Helpful hint for Google to allow large previews
  robots: {
    index: true,
    follow: true,
    googleBot: 'index, follow, max-image-preview:large'
  }
};


export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const { locale } = resolvedParams;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // useTranslations is a client hook, so for server layout, use a fallback or static text for Footer
  // If you need translations, fetch them server-side or pass them as props to client components
  // For now, we'll use static text for Footer
  const t = await getTranslations('Footer');

  return (
    <html lang={locale} suppressHydrationWarning className={geistSans.variable + ' ' + geistMono.variable}>
      <body className="h-full">
        {/* ThemeProvider will apply .dark class to <html> when dark mode is active */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative bg-secondary min-h-screen">
            {/* Absolutely positioned waves background that covers the full content height */}
            {/*<WavesBackground />*/}
            <LiquidEtherBackground />
            <div className="relative z-10 flex flex-col min-h-screen">
              <NextIntlClientProvider locale={locale}>
                <Navbar />
                <main className="flex-1 flex flex-col relative z-10 pt-10">
                  <UnderConstructionWrapper>
                    {children}
                  </UnderConstructionWrapper>
                </main>
                <div className="z-20 backdrop-blur-md">
                  <FooterSection
                    bottomOnly
                    copyright={t('copyright')}
                    policies={[
                      { text: t('privacy'), href: "" },
                      { text: t('terms'), href: "" },
                    ]}
                    showModeToggle={false}
                  />
                </div>
              </NextIntlClientProvider>
            </div>
          </div>
          <Toaster position="bottom-right" className="z-50" />
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
