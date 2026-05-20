import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["200", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cryptalic",
  description: "Sell and shop software with blockchain licenses",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23a855f7' /%3E%3Cstop offset='100%25' stop-color='%23ec4899' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='24' height='24' rx='6' fill='url(%23grad)' /%3E%3Csvg x='4' y='4' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/%3E%3Cpolyline points='7.5 4.21 12 6.81 16.5 4.21'/%3E%3Cpolyline points='7.5 19.79 7.5 14.6 3 12'/%3E%3Cpolyline points='21 12 16.5 14.6 16.5 19.79'/%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'/%3E%3Cline x1='12' x2='12' y1='22.08' y2='12'/%3E%3C/svg%3E%3C/svg%3E"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
