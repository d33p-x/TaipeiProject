"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function EnsDebug({
  onEnsNameFound,
}: {
  onEnsNameFound?: (name: string) => void;
}) {
  const { address } = useAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Registry and registrar addresses
  const registryAddress = "0x257ed5b68c2a32273db8490e744028a63acc771f";

  // Add log function
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  // Update ensName and notify parent
  const updateEnsName = (name: string) => {
    setEnsName(name);
    if (onEnsNameFound) {
      onEnsNameFound(name);
    }
  };

  // Automatically query for ENS name on component mount
  useEffect(() => {
    if (address) {
      // Run the query by node hash automatically when the component mounts
      queryByKnownNodeHash();
    }
  }, [address]);

  // Query by direct node hash
  const queryByKnownNodeHash = async () => {
    if (!address) {
      addLog("No wallet connected");
      return;
    }

    setLoading(true);

    try {
      addLog("Querying by known node hash for address: " + address);

      // Connect to Base
      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Registry ABI with only what we need
      const registryAbi = [
        "function names(bytes32 node) view returns (bytes)",
        "function decodeName(bytes memory name) view returns (string)",
      ];

      // Create contract instance
      const registryContract = new ethers.Contract(
        registryAddress,
        registryAbi,
        provider
      );

      // Define the known node hash from transaction log
      const nodeHash =
        "0xa994a906c4652d9e3087f76e15889ca98e99f544bc9b23b2a44a25590f701657";

      addLog("Querying for node hash: " + nodeHash);

      // Get encoded name bytes
      const encodedName = await registryContract.names(nodeHash);
      addLog("Got encoded name: " + JSON.stringify(encodedName));

      if (encodedName && encodedName.length > 0) {
        // Decode the name
        const decodedName = await registryContract.decodeName(encodedName);
        addLog("Decoded name: " + decodedName);

        if (decodedName) {
          const parts = decodedName.split(".");
          if (parts.length > 0) {
            const subdomainPart = parts[0];
            addLog("FOUND YOUR NAME: " + subdomainPart);
            updateEnsName(subdomainPart);
          }
        }
      } else {
        addLog("No encoded name found for this node hash");
      }
    } catch (error) {
      console.error("Manual node query failed:", error);
      addLog("ERROR: " + (error as any).message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Try other node hash
  const tryOtherNodeHash = async () => {
    if (!address) {
      addLog("No wallet connected");
      return;
    }

    setLoading(true);

    try {
      addLog("Trying alternative node hash approach");

      // Connect to Base
      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Registry ABI with only what we need
      const registryAbi = [
        "function makeNode(bytes32 node, string memory label) view returns (bytes32)",
        "function baseNode() view returns (bytes32)",
        "function names(bytes32 node) view returns (bytes)",
        "function decodeName(bytes memory name) view returns (string)",
      ];

      // Create contract instance
      const registryContract = new ethers.Contract(
        registryAddress,
        registryAbi,
        provider
      );

      // Get base node
      const baseNode = await registryContract.baseNode();
      addLog("Base node: " + baseNode);

      // Try to derive the node for "f3p"
      const nodeHash = await registryContract.makeNode(baseNode, "f3p");
      addLog("Derived node hash for 'f3p': " + nodeHash);

      // Get encoded name bytes
      const encodedName = await registryContract.names(nodeHash);
      addLog("Got encoded name: " + JSON.stringify(encodedName));

      if (encodedName && encodedName.length > 0) {
        // Decode the name
        const decodedName = await registryContract.decodeName(encodedName);
        addLog("Decoded name: " + decodedName);

        if (decodedName) {
          const parts = decodedName.split(".");
          if (parts.length > 0) {
            const subdomainPart = parts[0];
            addLog("FOUND YOUR NAME: " + subdomainPart);
            updateEnsName(subdomainPart);
          }
        }
      } else {
        addLog("No encoded name found for derived node hash");
      }
    } catch (error) {
      console.error("Alternative approach failed:", error);
      addLog("ERROR: " + (error as any).message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Look for Transfer events
  const searchForTransferEvents = async () => {
    if (!address) {
      addLog("No wallet connected");
      return;
    }

    setLoading(true);

    try {
      addLog("Searching for Transfer events to: " + address);

      // Connect to Base
      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Registry ABI with only what we need
      const registryAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ];

      // Create contract instance
      const registryContract = new ethers.Contract(
        registryAddress,
        registryAbi,
        provider
      );

      // Get Transfer events
      const filter = registryContract.filters.Transfer(null, address);
      const events = await registryContract.queryFilter(filter);

      addLog("Found " + events.length + " Transfer events");

      // Log them all
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        addLog("Event " + i + ": " + JSON.stringify(event));

        // Try to get the tokenId
        try {
          // @ts-ignore
          const tokenId = event.args?.[2];
          if (tokenId) {
            addLog("Token ID: " + tokenId.toString());
          }
        } catch (e) {
          addLog("Error extracting token ID: " + (e as any).message);
        }
      }
    } catch (error) {
      console.error("Transfer event search failed:", error);
      addLog("ERROR: " + (error as any).message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Set the name directly
  const setNameDirectly = (name: string) => {
    addLog("Directly set name to: " + name);
    setEnsName(name);

    // Always call the callback directly for manual setting
    if (onEnsNameFound) {
      onEnsNameFound(name);

      // Also dispatch a global event to update all instances
      window.dispatchEvent(
        new CustomEvent("ens_name_updated", {
          detail: {
            address,
            ensName: name,
          },
        })
      );
    }
  };

  // UI component to debug ENS name resolution
  return (
    <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-90 p-4 m-2 rounded-lg border-2 border-yellow-500 w-96 max-h-[80vh] overflow-auto">
      <h2 className="text-xl font-bold text-white mb-4">ENS Debug</h2>

      <div className="mb-4">
        <strong className="text-white">Wallet:</strong>
        <span className="text-gray-300 ml-2">
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Not connected"}
        </span>
      </div>

      <div className="mb-4">
        <strong className="text-white">ENS Name:</strong>
        <span className="text-yellow-400 ml-2">
          {ensName || "None detected"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={queryByKnownNodeHash}
          disabled={loading}
          className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Query by Node Hash
        </button>

        <button
          onClick={tryOtherNodeHash}
          disabled={loading}
          className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Try Other Approach
        </button>

        <button
          onClick={searchForTransferEvents}
          disabled={loading}
          className="px-3 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Search Transfer Events
        </button>

        <button
          onClick={() => setNameDirectly("f3p")}
          className="px-3 py-2 bg-red-700 text-white rounded hover:bg-red-600"
        >
          Set Name to "f3p"
        </button>
      </div>

      <div className="mb-2">
        <strong className="text-white">Debug Logs:</strong>
      </div>

      <div className="bg-gray-900 p-2 rounded max-h-60 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">
            No logs yet. Click a button to start debugging.
          </p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-xs text-gray-300 mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
