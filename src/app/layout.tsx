import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Disables auto-zoom on mobile inputs
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mental Health Suite",
  description: "Cross cutting symptoms assessment application.",
  appleWebApp: {
    capable: true,
    title: "MH Suite",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-200 selection:text-blue-900 bg-slate-50 text-slate-900 overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
