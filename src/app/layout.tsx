import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: `${config.siteName} — Grow on every platform`,
  description:
    "Get your first 100,000 views for free. Real growth services for Instagram, Facebook, TikTok, YouTube, Threads, Twitch and LinkedIn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} bg-background`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
