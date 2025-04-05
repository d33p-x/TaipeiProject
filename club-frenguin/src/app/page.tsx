"use client";

import { useAccount } from "wagmi";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";
import WalletConnect from "@/components/WalletConnect";
import GameWorld from "@/components/GameWorld";
import Chat from "@/components/Chat";
import SelfVerificationQR from "@/components/SelfVerificationQR";
import { useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import Image from "next/image";

export default function Home() {
  const { address } = useAccount();
  const { connect } = useConnect();
  const { isAdult, isVerifying, startVerification } = useAgeVerification();
  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [showingWelcome, setShowingWelcome] = useState(true);

  // Connect wallet function
  const handleConnectWallet = () => {
    connect({ connector: injected() });
    setShowingWelcome(false);
  };

  // Sync currentRoom with GameWorld
  useEffect(() => {
    const handleRoomChange = (e: MessageEvent) => {
      if (e.data && e.data.type === "ROOM_CHANGE") {
        setCurrentRoom(e.data.room);
      }
    };

    window.addEventListener("message", handleRoomChange);
    return () => window.removeEventListener("message", handleRoomChange);
  }, []);

  // Prevent scrolling on the body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <main className="h-screen overflow-hidden relative">
      {/* Game World Background - Always visible */}
      <div className="w-full h-full">
        {/* Game world is always rendered but inactive until connected */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/grass.png"
            alt="Garden Background"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* Active Game World (only when connected and verified) */}
        {address && isAdult !== null && <GameWorld />}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 py-2 bg-black bg-opacity-50 text-center shadow-md">
        <h1 className="text-xl font-bold text-white">Club Frenguin</h1>
        <p className="text-xs text-gray-300">
          A fun age-verified virtual world
        </p>
      </div>

      {/* Welcome Screen (when not connected) */}
      {!address && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black bg-opacity-80 p-8 rounded-xl shadow-2xl border-4 border-yellow-600 max-w-md w-full text-center transform transition-all">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">
              Welcome to Club Frenguin
            </h2>
            <p className="mb-8 text-white text-lg">
              Connect your wallet to enter this fun age-verified virtual world!
            </p>
            <button
              onClick={handleConnectWallet}
              className="relative px-8 py-4 bg-gradient-to-r from-green-500 to-green-700 text-white text-lg font-bold rounded-xl shadow-lg border-2 border-green-800 transform transition-transform hover:scale-105 hover:shadow-xl"
            >
              <span className="relative z-10">Connect Wallet</span>
              <span className="absolute inset-0 bg-white opacity-10 rounded-lg"></span>
            </button>
          </div>
        </div>
      )}

      {/* Age Verification Screen */}
      {address && isAdult === null && !isVerifying && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black bg-opacity-80 p-8 rounded-xl shadow-2xl border-4 border-blue-600 max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-4 text-blue-400">
              Age Verification Required
            </h2>
            <p className="mb-6 text-white text-lg">
              To access all areas of Club Frenguin, please verify your age using
              Self Protocol.
            </p>
            <button
              onClick={() => startVerification && startVerification()}
              className="relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg border-2 border-blue-800 transform transition-transform hover:scale-105 hover:shadow-xl"
            >
              <span className="relative z-10">Verify My Age</span>
              <span className="absolute inset-0 bg-white opacity-10 rounded-lg"></span>
            </button>
          </div>
        </div>
      )}

      {/* Verification indicator */}
      {address && isAdult && (
        <div className="absolute top-3 left-3 z-20">
          <div className="flex items-center bg-green-500 bg-opacity-70 text-white px-2 py-1 rounded-full shadow-md">
            <span className="mr-1 text-lg">✓</span>
            <span className="font-medium">Age Verified</span>
          </div>
        </div>
      )}

      {/* Room Status with instructions (only when in game) */}
      {address && isAdult !== null && (
        <div className="absolute top-16 right-4 z-10 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600">
          <div className="font-medium">
            {currentRoom === "general" ? "General Room" : "Adults Only (18+)"}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {currentRoom === "general"
              ? "Walk to the red 18+ door to change rooms"
              : "Walk to the blue Exit door to return"}
          </div>
        </div>
      )}

      {/* Chat (only when in game) */}
      <div className="absolute bottom-4 left-4 z-10">
        {address && isAdult !== null && (
          <Chat room={currentRoom === "general" ? "general" : "adults-only"} />
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 text-center text-white text-xs py-1 bg-black bg-opacity-50">
        <p>Club Frenguin - ETH Global Hackathon Project 2025</p>
      </div>

      {/* Verification QR Modal */}
      {isVerifying && <SelfVerificationQR />}
    </main>
  );
}
