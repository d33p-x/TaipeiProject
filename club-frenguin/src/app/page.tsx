"use client";

import { useAccount } from "wagmi";
import {
  useAgeVerification,
  CharacterType,
} from "@/providers/AgeVerificationProvider";
import WalletConnect from "@/components/WalletConnect";
import GameWorld from "@/components/GameWorld";
import Chat from "@/components/Chat";
import SelfVerificationQR from "@/components/SelfVerificationQR";
import { useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import Image from "next/image";
import SelfQRcodeWrapper, { SelfApp, SelfAppBuilder } from "@selfxyz/qrcode";

export default function Home() {
  const { address } = useAccount();
  const { connect } = useConnect();
  const {
    isAdult,
    isVerifying,
    selectedCharacter,
    setSelectedCharacter,
    startVerification,
  } = useAgeVerification();
  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [showingWelcome, setShowingWelcome] = useState(true);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [enterButtonHover, setEnterButtonHover] = useState(false);

  // Connect wallet function
  const handleConnectWallet = () => {
    connect({ connector: injected() });
    setShowingWelcome(false);
    setShowConnectWallet(false);
  };

  // Handle Enter button click
  const handleEnterClick = () => {
    setShowConnectWallet(true);
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

  // Helper function to determine if a character is available for selection
  const isCharacterAvailable = (character: CharacterType): boolean => {
    if (character === "playerKid") {
      return isAdult === false; // Only kids can select the kid character
    } else {
      return isAdult === true; // Only adults can select adult characters
    }
  };

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

        {/* Active Game World (only when connected, verified, and character selected) */}
        {address && isAdult !== null && selectedCharacter && <GameWorld />}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 py-2 text-center shadow-md">
        <h1 className="text-2xl text-white font-pixel drop-shadow-lg">
          CLUB FRENGUIN
        </h1>
        <p className="text-xs text-gray-300 font-pixel">
          A fun age-verified virtual world
        </p>
      </div>

      {/* Welcome Screen (when not connected) */}
      {!address && !showConnectWallet && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="relative flex flex-col items-center justify-center bg-black bg-opacity-50 p-8 rounded-xl">
            <Image
              src="/assets/image.png"
              alt="Club Frenguin"
              width={500}
              height={500}
              className="rounded-xl shadow-2xl border-4 border-yellow-600"
              priority
            />
            <div
              className="mt-8 cursor-pointer transform transition-transform duration-200"
              style={{
                transform: enterButtonHover ? "scale(1.1)" : "scale(1)",
              }}
              onMouseEnter={() => setEnterButtonHover(true)}
              onMouseLeave={() => setEnterButtonHover(false)}
              onClick={handleEnterClick}
            >
              <Image
                src="/assets/enterButton.png"
                alt="Enter"
                width={200}
                height={100}
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet Popup */}
      {!address && showConnectWallet && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black bg-opacity-80 p-8 rounded-xl shadow-2xl border-4 border-yellow-600 max-w-md w-full text-center transform transition-all">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400 font-pixel">
              Welcome to Club Frenguin
            </h2>
            <p className="mb-8 text-white text-lg font-pixel">
              Connect your wallet to enter this fun age-verified virtual world!
            </p>
            <button
              onClick={handleConnectWallet}
              className="relative px-8 py-4 bg-gradient-to-r from-green-500 to-green-700 text-white text-lg font-bold rounded-xl shadow-lg border-2 border-green-800 transform transition-transform hover:scale-105 hover:shadow-xl font-pixel"
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
            <h2 className="text-3xl font-bold mb-4 text-blue-400 font-pixel">
              Age Verification Required
            </h2>
            <p className="mb-6 text-white text-lg font-pixel">
              To access all areas of Club Frenguin, please verify your age using
              Self Protocol.
            </p>
            <button
              onClick={() => startVerification && startVerification()}
              className="relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg border-2 border-blue-800 transform transition-transform hover:scale-105 hover:shadow-xl font-pixel"
            >
              <span className="relative z-10">Verify My Age</span>
              <span className="absolute inset-0 bg-white opacity-10 rounded-lg"></span>
            </button>
          </div>
        </div>
      )}

      {/* Character Selection Screen (after verification but before character selection) */}
      {address && isAdult !== null && !selectedCharacter && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black bg-opacity-80 p-8 rounded-xl shadow-2xl border-4 border-green-600 max-w-4xl w-full text-center">
            <h2 className="text-3xl font-bold mb-4 text-green-400 font-pixel">
              Choose Your Character
            </h2>
            <p className="mb-6 text-white text-lg font-pixel">
              Select a character to represent you in Club Frenguin.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Male Character */}
              <div
                className={`${
                  isCharacterAvailable("playerMale")
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : "opacity-40 cursor-not-allowed"
                } bg-gray-800 rounded-lg p-4 flex flex-col items-center`}
                onClick={() =>
                  isCharacterAvailable("playerMale") &&
                  setSelectedCharacter("playerMale")
                }
              >
                <Image
                  src="/assets/playerMale.png"
                  alt="Male Character"
                  width={100}
                  height={100}
                />
                <h3 className="text-white mt-2">Standard Male</h3>
                {!isCharacterAvailable("playerMale") && (
                  <p className="text-red-400 text-xs mt-1">
                    Only available for adults
                  </p>
                )}
              </div>

              {/* Beer Male Character */}
              <div
                className={`${
                  isCharacterAvailable("playerMaleBeer")
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : "opacity-40 cursor-not-allowed"
                } bg-gray-800 rounded-lg p-4 flex flex-col items-center`}
                onClick={() =>
                  isCharacterAvailable("playerMaleBeer") &&
                  setSelectedCharacter("playerMaleBeer")
                }
              >
                <Image
                  src="/assets/playerMaleBeer.png"
                  alt="Male with Beer Character"
                  width={100}
                  height={100}
                />
                <h3 className="text-white mt-2">Beer Male</h3>
                {!isCharacterAvailable("playerMaleBeer") && (
                  <p className="text-red-400 text-xs mt-1">
                    Only available for adults
                  </p>
                )}
              </div>

              {/* Female Character */}
              <div
                className={`${
                  isCharacterAvailable("playerFemale")
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : "opacity-40 cursor-not-allowed"
                } bg-gray-800 rounded-lg p-4 flex flex-col items-center`}
                onClick={() =>
                  isCharacterAvailable("playerFemale") &&
                  setSelectedCharacter("playerFemale")
                }
              >
                <Image
                  src="/assets/playerFemale.png"
                  alt="Female Character"
                  width={100}
                  height={100}
                />
                <h3 className="text-white mt-2">Standard Female</h3>
                {!isCharacterAvailable("playerFemale") && (
                  <p className="text-red-400 text-xs mt-1">
                    Only available for adults
                  </p>
                )}
              </div>

              {/* Champagne Female Character */}
              <div
                className={`${
                  isCharacterAvailable("playerFemaleChampagne")
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : "opacity-40 cursor-not-allowed"
                } bg-gray-800 rounded-lg p-4 flex flex-col items-center`}
                onClick={() =>
                  isCharacterAvailable("playerFemaleChampagne") &&
                  setSelectedCharacter("playerFemaleChampagne")
                }
              >
                <Image
                  src="/assets/playerFemaleChampagne.png"
                  alt="Female with Champagne Character"
                  width={100}
                  height={100}
                />
                <h3 className="text-white mt-2">Champagne Female</h3>
                {!isCharacterAvailable("playerFemaleChampagne") && (
                  <p className="text-red-400 text-xs mt-1">
                    Only available for adults
                  </p>
                )}
              </div>

              {/* Kid Character */}
              <div
                className={`${
                  isCharacterAvailable("playerKid")
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : "opacity-40 cursor-not-allowed"
                } bg-gray-800 rounded-lg p-4 flex flex-col items-center`}
                onClick={() =>
                  isCharacterAvailable("playerKid") &&
                  setSelectedCharacter("playerKid")
                }
              >
                <Image
                  src="/assets/playerKid.png"
                  alt="Kid Character"
                  width={100}
                  height={100}
                />
                <h3 className="text-white mt-2">Kid</h3>
                {!isCharacterAvailable("playerKid") && (
                  <p className="text-red-400 text-xs mt-1">
                    Only available for kids
                  </p>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-sm mt-4 font-pixel">
              {isAdult
                ? "As an adult (18+), you can choose any character except Kid."
                : "As a kid (under 18), you can only choose the Kid character."}
            </p>
          </div>
        </div>
      )}

      {/* Verification indicator */}
      {address && isAdult !== null && selectedCharacter && (
        <div className="absolute top-3 left-3 z-20">
          <div className="flex items-center bg-green-500 bg-opacity-70 text-white px-2 py-1 rounded-full shadow-md">
            <span className="mr-1 text-lg">✓</span>
            <span className="font-medium font-pixel">
              {isAdult ? "Adult (18+)" : "Kid (Under 18)"}
            </span>
          </div>
        </div>
      )}

      {/* Chat (only when in game) */}
      <div className="absolute bottom-8 left-8 z-10">
        {address && isAdult !== null && selectedCharacter && (
          <Chat
            room={
              currentRoom === "general"
                ? "general"
                : currentRoom === "adults-only"
                ? "adults-only"
                : "kids-only"
            }
          />
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 text-center text-white text-xs py-1">
        <p className="font-pixel drop-shadow-md">
          Club Frenguin - ETH Global Hackathon Project 2025
        </p>
      </div>

      {/* Verification QR Modal with transparent background to show garden */}
      {isVerifying && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
          }}
        >
          <SelfVerificationQR />
        </div>
      )}
    </main>
  );
}
