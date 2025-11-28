import { ReactNode } from "react";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@onelabs/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
    onechainTestnet: { url: 'https://rpc-testnet.onelabs.cc:443' },
});

export default function trhdOneChainProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig}>
                <WalletProvider autoConnect>
                        {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
