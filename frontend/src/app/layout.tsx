import AppProvider from "@/components/app-provider";
import "@/styles/global.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

const underdog = localFont({
  src: [
    {
      path: "../assets/fonts/underdog-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-underdog",
  display: "swap",
});

const inter = localFont({
  src: [
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-500.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-700.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-700.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-900.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../assets/fonts/inter-v20-cyrillic_latin-900.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "title",
  description: "description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${underdog.variable} ${inter.variable} antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
