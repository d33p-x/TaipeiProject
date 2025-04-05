"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ReactNode, useEffect, useState } from "react";

// 1. Create a client
const queryClient = new QueryClient();

// 2. Create a config
const metadata = {
  name: "Club Frenguin",
  description: "A fun age-verified virtual world",
  url: "https://club-frenguin.xyz", // TODO: Update when we have a real domain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Configure with just Metamask
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [injected()],
  metadata,
});

// Client-only component
function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ClientOnly>{children}</ClientOnly>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
