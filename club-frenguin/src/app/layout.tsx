import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/providers/WalletProvider";
import { AgeVerificationProvider } from "@/providers/AgeVerificationProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Club Frenguin",
  description: "A fun age-verified virtual world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <AgeVerificationProvider>{children}</AgeVerificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
