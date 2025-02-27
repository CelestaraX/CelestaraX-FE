import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  sepolia,
  Chain,
} from 'wagmi/chains';

export const mammothon = {
  id: 55550,
  name: 'Mammothon-g2-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mammothon-g2-testnet-4a2w8v0xqy.t.conduit.xyz'],
    }
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://explorer-mammothon-g2-testnet-4a2w8v0xqy.t.conduit.xyz',
    },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'WEB3ITE',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    mammothon,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});
