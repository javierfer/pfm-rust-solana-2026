import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/context/WalletProvider";
import { ProgramProvider } from "@/lib/context/ProgramProvider";
import { WalletChangeDetector } from "@/components/WalletChangeDetector";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaféChain — Coffee Traceability on Solana",
  description: "End-to-end coffee traceability on the Solana blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <WalletProvider>
          <WalletChangeDetector />
          <ProgramProvider>{children}</ProgramProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
