"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { connector, isConnected, address } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // Check if MetaMask is available
  useEffect(() => {
    const checkMetaMask = () => {
      // Check if window.ethereum exists and is MetaMask
      const isMetaMaskAvailable =
        typeof window !== "undefined" &&
        window.ethereum &&
        (window.ethereum.isMetaMask ||
          window.ethereum.providers?.some((p) => p.isMetaMask));

      setHasMetaMask(isMetaMaskAvailable);
    };

    checkMetaMask();
    // Re-check when the window is focused, in case user installs MetaMask
    window.addEventListener("focus", checkMetaMask);
    return () => window.removeEventListener("focus", checkMetaMask);
  }, []);

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center"
        >
          <span className="mr-2">
            {address?.substring(0, 6)}...
            {address?.substring(address.length - 4)}
          </span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isDropdownOpen && (
          <div className="absolute mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-600">
                Connected to {connector?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full p-3 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Get MetaMask connector
  const metaMaskConnector = connectors.find((c) => c.id === "metaMask");
  // Get injected connector as fallback
  const injectedConnector = connectors.find((c) => c.id === "injected");

  return (
    <div className="flex flex-col space-y-2">
      {metaMaskConnector && (
        <button
          onClick={() => connect({ connector: metaMaskConnector })}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect with MetaMask"}
        </button>
      )}

      {!metaMaskConnector && injectedConnector && hasMetaMask && (
        <button
          onClick={() => connect({ connector: injectedConnector })}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Connect with Injected Provider"}
        </button>
      )}

      {!hasMetaMask && (
        <div className="flex flex-col space-y-3">
          <p className="text-amber-600 text-sm">
            MetaMask not detected. Please install MetaMask to continue.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md text-center"
          >
            Install MetaMask
          </a>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md mt-2">
          {error.message}
        </div>
      )}
    </div>
  );
}
