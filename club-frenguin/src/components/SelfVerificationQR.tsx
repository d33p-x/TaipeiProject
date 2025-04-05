"use client";

import { useEffect, useState } from "react";
import SelfQRcodeWrapper, { SelfApp, SelfAppBuilder } from "@selfxyz/qrcode";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";

export default function SelfVerificationQR() {
  const { verificationId, isVerifying } = useAgeVerification();
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);

  useEffect(() => {
    if (!verificationId || !isVerifying) return;

    const app = new SelfAppBuilder({
      appName: "Club Frenguin",
      scope: "club-frenguin",
      endpoint: `https://0703-138-199-60-32.ngrok-free.app/api/verify`,
      endpointType: "https",
      logoBase64: "https://i.imgur.com/Rz8B3s7.png", //
      userId: verificationId,
      disclosures: {
        minimumAge: 18, // Only verify if user is 18+
      },
      //   devMode: process.env.NODE_ENV === "development",
    } as Partial<SelfApp>).build();

    setSelfApp(app);
  }, [verificationId, isVerifying]);

  if (!isVerifying || !selfApp) {
    return null;
  }

  return (
    <div className="bg-purple-900 bg-opacity-80 p-8 rounded-xl shadow-2xl border-4 border-purple-600 max-w-md w-full backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 text-center text-purple-100 font-pixel drop-shadow-lg">
        Scan QR Code to Verify
      </h2>
      <p className="mb-6 text-center text-white">
        Use the Self app to scan this QR code to verify your age.
      </p>
      <ul className="list-disc pl-8 mb-6 text-white">
        <li className="mb-2">You are 18+ years old</li>
      </ul>
      <div className="flex justify-center bg-white p-4 rounded-lg">
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={() => {
            console.log("QR code scanned successfully");
          }}
        />
      </div>
      <p className="mt-4 text-center text-gray-400 text-sm">
        Don't have the Self app?{" "}
        <a
          href="https://www.joinself.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:underline font-pixel"
        >
          Download here
        </a>
      </p>
    </div>
  );
}
