import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

const HEDERA_TESTNET_ID = 296;
const HEDERA_TESTNET_HEX = '0x128';

const hederaTestnet = {
  id: HEDERA_TESTNET_ID,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'Hashscan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
};

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

const config = getDefaultConfig({
  appName: import.meta.env.VITE_APP_NAME ?? 'Hedera DApp',
  projectId,
  chains: [hederaTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

function ChainSwitcher({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected || chainId === HEDERA_TESTNET_ID) return;

    const addAndSwitchChain = async () => {
      try {
        if (switchChain) {
          switchChain({ chainId: HEDERA_TESTNET_ID });
        } else {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HEDERA_TESTNET_HEX,
                chainName: 'Hedera Testnet',
                rpcUrls: ['https://testnet.hashio.io/api'],
                nativeCurrency: {
                  name: 'HBAR',
                  symbol: 'HBAR',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://hashscan.io/testnet'],
              },
            ],
          });
          
          await window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HEDERA_TESTNET_HEX }],
          });
        }
      } catch (error) {
        console.error('Failed to add/switch to Hedera Testnet:', error);
      }
    };

    addAndSwitchChain();
  }, [isConnected, chainId, switchChain]);

  return <>{children}</>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChainSwitcher>
            {children}
          </ChainSwitcher>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}