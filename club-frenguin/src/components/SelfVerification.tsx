"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SCOPES } from "@/lib/wagmi";
import dynamic from "next/dynamic";

// Dynamically import the Self QR code component with SSR disabled
const DynamicSelfQRcode = dynamic(
  () => import("@selfxyz/qrcode").then((mod) => mod.default),
  { ssr: false }
);

interface SelfVerificationProps {
  onSuccess: (verificationData: any) => void;
}

// For development mode - simulated verification data
const DEV_VERIFICATION_DATA = {
  success: true,
  userId: "0x123...abc",
  data: {
    nationality: "USA",
    gender: "M",
    dateOfBirth: "01-01-1990",
    ageVerified: true,
    olderThan: "18",
  },
};

export function SelfVerification({ onSuccess }: SelfVerificationProps) {
  const { address, isConnected } = useAccount();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selfApp, setSelfApp] = useState<any>(null);
  const [isDev, setIsDev] = useState(false);

  // Initialize the Self app after component mounts (client-side only)
  useEffect(() => {
    // Check if we're in development environment
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    setIsDev(isLocalhost);

    if (isConnected && address && typeof window !== "undefined") {
      try {
        import("@selfxyz/qrcode").then(({ SelfAppBuilder }) => {
          const app = new SelfAppBuilder({
            appName: "Club Frenguin",
            scope: SCOPES.APP_SCOPE,
            // For development, use a dummy HTTPS URL
            endpoint: isLocalhost
              ? "https://example.com/api/verify" // Dummy endpoint for local development
              : `${window.location.origin}/api/verify`,
            endpointType: "https",
            userId: address,
            disclosures: {
              minimumAge: 13,
              nationality: true,
              gender: true,
              date_of_birth: true,
            },
          }).build();
          setSelfApp(app);
        });
      } catch (error) {
        console.error("Error initializing Self app:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }, [isConnected, address]);

  const handleSuccess = (data: any) => {
    setVerificationStatus("success");
    onSuccess(data);
  };

  const handleError = (error: Error) => {
    console.error("Verification error:", error);
    setVerificationStatus("error");
    setErrorMessage(error.message);
  };

  // For development mode - simulate verification success
  const handleDevModeVerify = () => {
    setVerificationStatus("success");
    onSuccess(DEV_VERIFICATION_DATA);
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-amber-50 rounded-lg text-center">
        <h2 className="text-lg font-semibold text-amber-800">
          Wallet Required
        </h2>
        <p className="mt-2 text-amber-700">
          Please connect your wallet first to verify your identity.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-center mb-4">
          Scan Your Passport
        </h2>

        {isDev && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg">
            <p className="text-amber-800 font-medium">Development Mode</p>
            <p className="text-amber-700 text-sm mt-1">
              Running on localhost. Self Protocol requires HTTPS.
            </p>
            <button
              onClick={handleDevModeVerify}
              className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md"
            >
              Simulate Successful Verification
            </button>
          </div>
        )}

        {!isDev && (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Use the Self app to scan your passport and verify your identity.
            </p>

            {selfApp && (
              <div className="flex justify-center">
                <DynamicSelfQRcode
                  selfApp={selfApp}
                  onSuccess={handleSuccess}
                  size={250}
                />
              </div>
            )}
          </>
        )}

        {verificationStatus === "success" && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-green-700 font-medium text-center">
              ✅ Identity verified successfully!
            </p>
          </div>
        )}

        {verificationStatus === "error" && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-700 font-medium text-center">
              ❌ Verification failed: {errorMessage}
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800">How it works:</h3>
        <ol className="mt-2 list-decimal list-inside text-blue-700 space-y-2">
          <li>Scan the QR code with the Self app</li>
          <li>Scan your passport with your phone's NFC reader</li>
          <li>Generate a privacy-preserving ZK proof</li>
          <li>Get verified without revealing your personal data</li>
        </ol>
      </div>
    </div>
  );
}
