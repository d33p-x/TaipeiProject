import type { Metadata } from "next";
import { Inter, Pixelify_Sans } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/providers/WalletProvider";
import { AgeVerificationProvider } from "@/providers/AgeVerificationProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const pixelifySans = Pixelify_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club Frenguin",
  description:
    "A fun virtual world with age verification based on passport scans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${pixelifySans.variable} font-sans`}>
        <WalletProvider>
          <AgeVerificationProvider>{children}</AgeVerificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
