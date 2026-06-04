import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus League — Fantasy Universitário",
  description:
    "Palpites, rankings e estatísticas do esporte universitário brasileiro. Represente sua faculdade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-white pb-20 lg:pb-0 lg:pl-[var(--sidebar-width)]">
        <Nav />
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
