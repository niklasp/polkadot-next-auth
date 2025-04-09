import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Loader } from "lucide-react";

import { Providers } from "@/providers/providers";

import { fontSans, fontMono, fontUnbounded } from "@/fonts";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { ChainInfo } from "@/components/chain/chain-info";

import "./globals.css";
import "@/lib/worker-manager";

export const metadata: Metadata = {
  title: "Polka Auth",
  description: "A simple auth example for Polkadot dApps with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontUnbounded.variable} font-[family-name:var(--font-sans)] antialiased`}
      >
        <Providers>
          <Nav />
          <div className="min-h-screen">{children}</div>
          <Footer />
          <ChainInfo />

          <Toaster position="bottom-center" icons={{ loading: <Loader /> }} />
        </Providers>
      </body>
    </html>
  );
}
