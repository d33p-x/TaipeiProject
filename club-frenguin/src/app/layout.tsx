import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WagmiProvider from "@/components/providers/WagmiProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Club Frenguin: The Gardenverse",
  description:
    "An identity-aware, privacy-preserving social world built onchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}
