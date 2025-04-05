"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { startVerification, isAdult, resetVerification } =
    useAgeVerification();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <h2 className="text-xl font-bold mb-4">Welcome to Club Frenguin</h2>
        <p className="mb-4 text-center">
          Connect with Metamask to enter the virtual world.
        </p>
        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Connect with Metamask
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
          </span>
        </div>
        <button
          onClick={() => {
            resetVerification();
            disconnect();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>

      {isAdult === null && (
        <div className="mb-4">
          <button
            onClick={startVerification}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Verify Age with Self
          </button>
        </div>
      )}

      {isAdult === true && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg mb-4">
          ✅ Age verified! You have full access to Club Frenguin.
        </div>
      )}

      {isAdult === false && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4">
          ❌ Age verification failed. You must be 18+ to access restricted
          areas.
        </div>
      )}
    </div>
  );
}
