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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wiebe",
  description: "Wiebe Vandendriessche: Portfolio Website",
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
          <div
            className="relative bg-secondary z-1 min-h-screen"
          >
            {/* Absolutely positioned waves background that covers the full content height */}
            <WavesBackground />
            <div className="relative flex flex-col min-h-screen">
              <NextIntlClientProvider locale={locale}>
                <Navbar />
                <main className="flex-1 flex flex-col relative z-10 pt-[64px]">
                  {children}
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
        </ThemeProvider>
      </body>
    </html>
  );
}
