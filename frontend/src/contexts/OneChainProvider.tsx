import { ReactNode } from "react";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
    onechainTestnet: { url: 'https://rpc-testnet.onelabs.cc' },
    suiTestnet: { url: 'https://fullnode.testnet.sui.io' },
});

export default function OneChainProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="onechainTestnet" >
                <WalletProvider autoConnect>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
