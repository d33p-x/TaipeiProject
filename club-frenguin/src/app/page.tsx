"use client";

import { useAccount } from "wagmi";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";
import WalletConnect from "@/components/WalletConnect";
import GameWorld from "@/components/GameWorld";
import Chat from "@/components/Chat";
import SelfVerificationQR from "@/components/SelfVerificationQR";
import { useState, useEffect } from "react";

export default function Home() {
  const { address } = useAccount();
  const { isAdult, isVerifying, startVerification } = useAgeVerification();
  const [currentRoom, setCurrentRoom] = useState<string>("general");

  // Sync currentRoom with GameWorld
  useEffect(() => {
    // This would be implemented with proper state management in a real app
    // For the MLP, we'll just use a mock implementation
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
    <main className="h-screen overflow-hidden relative bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Game World - Full Screen */}
      <div className="w-full h-full">
        {address && isAdult !== null && <GameWorld />}

        {address && isAdult === null && (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-blue-600">
                Age Verification Required
              </h2>
              <p className="mb-6 text-gray-700">
                To enter the Club Frenguin world, please verify your age first.
              </p>
              <button
                onClick={() => startVerification && startVerification()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                Verify My Age Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 py-2 bg-black bg-opacity-50 text-center shadow-md">
        <h1 className="text-xl font-bold text-white">Club Frenguin</h1>
        <p className="text-xs text-gray-300">
          A fun age-verified virtual world
        </p>
      </div>

      {/* Minimal verification indicator */}
      {address && isAdult && (
        <div className="absolute top-3 left-3 z-20">
          <div className="flex items-center bg-green-500 bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded-full">
            <span className="mr-1">✓</span>
            <span>Verified</span>
          </div>
        </div>
      )}

      {/* Wallet Connect (only when not connected) */}
      {!address && (
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-black bg-opacity-70 rounded-lg p-3 shadow-lg">
            <WalletConnect />
          </div>
        </div>
      )}

      {/* Age verification button (only when needed) */}
      {address && isAdult === null && (
        <div className="absolute top-16 left-0 right-0 z-10 flex justify-center">
          <button
            onClick={() => startVerification && startVerification()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md"
          >
            Verify Age to Enter Adult Areas
          </button>
        </div>
      )}

      {/* Room Status with instructions */}
      <div className="absolute top-16 right-4 z-10 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="font-medium">
          {currentRoom === "general" ? "General Room" : "Adults Only (18+)"}
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {currentRoom === "general"
            ? "Walk to the red 18+ door to change rooms"
            : "Walk to the blue Exit door to return"}
        </div>
      </div>

      {/* WoW-style Chat in bottom left */}
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
