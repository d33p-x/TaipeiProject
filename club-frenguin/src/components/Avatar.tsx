"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

// Simple emoji avatars for the MVP
const AVATARS = ["🐧", "🐻", "🦊", "🐶", "🦁", "🐱", "🐭", "🦄", "🦖", "🐢"];

export default function Avatar() {
  const { address } = useAccount();
  const [avatar, setAvatar] = useState<string>("");

  // Generate a deterministic avatar based on the wallet address
  useEffect(() => {
    if (!address) return;

    // Use the address to pick an avatar deterministically
    const avatarIndex = parseInt(address.slice(-2), 16) % AVATARS.length;
    setAvatar(AVATARS[avatarIndex]);
  }, [address]);

  if (!address || !avatar) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl mb-2">{avatar}</div>
      <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-full">
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </div>
    </div>
  );
}
