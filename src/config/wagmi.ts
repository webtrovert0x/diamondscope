import { defineChain } from 'viem';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';

// Define Botchain Testnet
export const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT Token',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: { name: 'BohrScan', url: 'https://scan.bohr.life' },
  },
  testnet: true,
});

export const networks = [botchainTestnet];

// Read REOWN_ID injected via vite.config.ts define or fallback
export const projectId = (typeof process !== 'undefined' && process.env?.REOWN_ID) || '';

// Wagmi Adapter Setup
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: projectId || 'b56e18d47c72ab683b10814fe9495694', // fallback dummy id to prevent app crash if empty
  transports: {
    [botchainTestnet.id]: http('https://rpc.bohr.life'),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize Reown AppKit
export const metadata = {
  name: 'DiamondScope',
  description: 'EIP-2535 Diamond Inspector for Botchain Testnet',
  url: 'https://diamondscope.app',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet],
  defaultNetwork: botchainTestnet,
  projectId: projectId || 'b56e18d47c72ab683b10814fe9495694',
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#059669', // Emerald 600
    '--w3m-color-mix': '#10b981',
    '--w3m-color-mix-strength': 10,
    '--w3m-border-radius-master': '12px',
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
});

