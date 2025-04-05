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
      endpoint: `${window.location.origin}/api/verify`,
      endpointType: "https",
      logoBase64: "https://i.imgur.com/Rz8B3s7.png", // Replace with actual logo
      userId: verificationId,
      disclosures: {
        minimumAge: 18, // Only verify if user is 18+
      },
      devMode: process.env.NODE_ENV === "development",
    } as Partial<SelfApp>).build();

    setSelfApp(app);
  }, [verificationId, isVerifying]);

  if (!isVerifying || !selfApp) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-center">
          Age Verification Required
        </h2>
        <p className="mb-4 text-center">
          Scan this QR code with the Self app to verify your age. You must be
          18+ to access restricted areas.
        </p>
        <div className="flex justify-center">
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={() => {
              console.log("QR code scanned successfully");
            }}
          />
        </div>
      </div>
    </div>
  );
}
