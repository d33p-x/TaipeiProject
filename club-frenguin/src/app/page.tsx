"use client";

import { useAccount } from "wagmi";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";
import WalletConnect from "@/components/WalletConnect";
import Avatar from "@/components/Avatar";
import GameWorld from "@/components/GameWorld";
import Chat from "@/components/Chat";
import SelfVerificationQR from "@/components/SelfVerificationQR";
import { useState, useEffect } from "react";

export default function Home() {
  const { address } = useAccount();
  const { isAdult, isVerifying } = useAgeVerification();
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto">
        <header className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h1 className="text-2xl font-bold text-center text-blue-600">
            Club Frenguin
          </h1>
          <p className="text-center text-gray-600">
            A fun age-verified virtual world
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Profile & Connect */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <WalletConnect />
            {address && <Avatar />}
          </div>

          {/* Middle column - Game */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-4">
            {address && isAdult !== null && <GameWorld />}

            {address && isAdult === null && (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-xl font-bold mb-4">
                  Age Verification Required
                </h2>
                <p className="mb-4 text-center">
                  To enter the Club Frenguin world, please verify your age
                  first.
                </p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="md:col-span-3 bg-white rounded-lg shadow-md p-4">
            {address && isAdult !== null && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Chat room="general" />

                {isAdult === true && <Chat room="adults-only" />}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Club Frenguin - ETH Global Hackathon Project 2023</p>
        </footer>
      </div>

      {/* Verification QR Modal */}
      {isVerifying && <SelfVerificationQR />}
    </main>
  );
}
