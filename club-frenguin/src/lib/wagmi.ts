import { createConfig, configureChains } from "wagmi";
import { mainnet, celo, celoAlfajores } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [celo, celoAlfajores, mainnet],
  [publicProvider()]
);

// Set up connectors
const metaMaskConnector = new MetaMaskConnector({
  chains,
  options: {
    shimDisconnect: true,
  },
});

const injectedConnector = new InjectedConnector({
  chains,
  options: {
    name: "Injected",
    shimDisconnect: true,
  },
});

// Create wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors: [metaMaskConnector, injectedConnector],
  publicClient,
  webSocketPublicClient,
});

export const SCOPES = {
  APP_SCOPE: "clubfrenguin", // Must match the scope used in the contract
};
