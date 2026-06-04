import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import { PostHogProvider } from "@/components/analytics/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unicartola — Palpites Universitários",
  description:
    "Palpites, rankings e estatísticas do esporte universitário brasileiro. NDU, futsal, futebol e basquete.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-16 sm:pb-0">
        <PostHogProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        </PostHogProvider>
      </body>
    </html>
  );
}
