"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { SelfVerification } from "@/components/SelfVerification";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [step, setStep] = useState<"connect" | "verify" | "avatar">("connect");

  // Handle successful verification
  const handleVerificationSuccess = (data: any) => {
    setVerificationData(data);
    setStep("avatar");
  };

  // Proceed to verification step after wallet connection
  const handleConnected = () => {
    if (isConnected) {
      setStep("verify");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-emerald-600">
            Club Frenguin
          </h1>
          <h2 className="text-lg md:text-xl text-gray-600">The Gardenverse</h2>
          <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
            An identity-aware, privacy-preserving social world built onchain.
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step Indicator */}
          <div className="flex border-b">
            <div
              className={`flex-1 p-4 text-center ${
                step === "connect" ? "bg-blue-50 font-semibold" : ""
              }`}
            >
              1. Connect Wallet
            </div>
            <div
              className={`flex-1 p-4 text-center ${
                step === "verify" ? "bg-blue-50 font-semibold" : ""
              }`}
            >
              2. Verify Identity
            </div>
            <div
              className={`flex-1 p-4 text-center ${
                step === "avatar" ? "bg-blue-50 font-semibold" : ""
              }`}
            >
              3. Create Avatar
            </div>
          </div>

          {/* Content based on current step */}
          <div className="p-6 md:p-8">
            {step === "connect" && (
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 text-center max-w-md">
                  To get started with Club Frenguin, connect your wallet to
                  verify your identity.
                </p>
                <ConnectWallet />

                {isConnected && (
                  <button
                    onClick={handleConnected}
                    className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                  >
                    Continue to Verification
                  </button>
                )}
              </div>
            )}

            {step === "verify" && (
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Verify Your Identity
                </h2>
                <SelfVerification onSuccess={handleVerificationSuccess} />
              </div>
            )}

            {step === "avatar" && (
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Create Your Avatar
                </h2>
                <p className="text-gray-600 text-center">
                  Verification successful! Now create your avatar to join the
                  Gardenverse.
                </p>
                <div className="p-6 bg-green-50 rounded-lg w-full">
                  <h3 className="font-semibold text-green-800">
                    Verification Data
                  </h3>
                  <pre className="mt-2 p-3 bg-white rounded text-sm overflow-auto">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </div>
                <p className="text-sm text-gray-500">
                  Avatar creation coming in next step!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
