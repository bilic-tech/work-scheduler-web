import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { FlashToasts } from "@/components/shared/flash-toasts";
import { Toaster } from "@/components/ui/sonner";
import { localeFromHints, LOCALE_COOKIE } from "@/i18n/config";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} · Leave & HR Management`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = localeFromHints(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language"),
  );

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full light antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders initialLocale={locale}>
          {children}
          <FlashToasts />
          <Toaster position="top-right" richColors={false} closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
