// import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { HederaSessionEvent, HederaJsonRpcMethod, DAppConnector, HederaChainId } from '@hashgraph/hedera-wallet-connect';
// import { LedgerId } from '@hashgraph/sdk';
// import LoadingState from '../components/LoadingState';


// interface WalletEvent {
//     name: string;
//     data: {
//         topic?: string;
//         [key: string]: unknown;
//     };
// }

// interface DAppConnectorWithEvents extends DAppConnector {
//     events$?: {
//         subscribe: (callback: (event: WalletEvent) => void) => { unsubscribe: () => void };
//     };
// }

// const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ?? '123456789yrewq';
// const queryClient = new QueryClient();

// const metadata = {
//     name: import.meta.env.VITE_APP_NAME || 'Hedera',
//     description: import.meta.env.VITE_APP_DESCRIPTION || 'A gaming hub',
//     url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
//     icons: ['https://avatars.githubusercontent.com/u/179229932'],
// };

// type DAppConnectorContext = {
//     dAppConnector: DAppConnector | null;
//     userAccountId: string | null;
//     sessionTopic: string | null;
//     disconnect: (() => Promise<void>) | null;
//     refresh: (() => void) | null;
// };

// const DAppConnectorContext = createContext<DAppConnectorContext | null>(null);
// export const useDAppConnector = () => useContext(DAppConnectorContext);

// type ClientProvidersProps = {
//     children: ReactNode;
// };


// export default function ClientProviders({ children }: ClientProvidersProps) {
//     const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);
//     const [isReady, setIsReady] = useState(false);
//     const [userAccountId, setUserAccountId] = useState<string | null>(null);
//     const [sessionTopic, setSessionTopic] = useState<string | null>(null);

//     useEffect(() => {
//         if (!dAppConnector) return;

//         const connectorWithEvents = dAppConnector as DAppConnectorWithEvents;
//         const subscription = connectorWithEvents.events$?.subscribe((event: WalletEvent) => {
//             if (event.name === 'accountsChanged' || event.name === 'chainChanged') {
//                 setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);

//                 if (event.data && event.data.topic) {
//                     setSessionTopic(event.data.topic as string);
//                 } else if (dAppConnector.signers?.[0]?.topic) {
//                     setSessionTopic(dAppConnector.signers[0].topic);
//                 } else {
//                     setSessionTopic(null);
//                 }
//             } else if (event.name === 'session_delete' || event.name === 'sessionDelete') {
//                 setUserAccountId(null);
//                 setSessionTopic(null);
//             }
//         });

//         setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
//         if (dAppConnector.signers?.[0]?.topic) setSessionTopic(dAppConnector.signers[0].topic);
//         return () => subscription && subscription.unsubscribe();
//     }, [dAppConnector]);

//     const disconnect = async () => {
//         if (!dAppConnector) {
//             return;
//         }

//         const activeTopic =
//             sessionTopic ??
//             dAppConnector.signers?.[0]?.topic ??
//             null;

//         try {
//             if (activeTopic) {
//                 await dAppConnector.disconnect(activeTopic);
//             } else {
//                 await dAppConnector.disconnectAll();
//             }
//         } catch (error) {
//             console.error('Failed to disconnect wallet session:', error);
//         } finally {
//             setUserAccountId(null);
//             setSessionTopic(null);
//         }
//     };

//     const refresh = () => {
//         if (dAppConnector) {
//             setUserAccountId(dAppConnector.signers?.[0]?.getAccountId().toString() ?? null);
//             setSessionTopic(dAppConnector.signers?.[0]?.topic ?? null);
//         }
//     };

//     useEffect(() => {
//         let isMounted = true;
//         async function init() {
//             if (!projectId) {
//                 console.error('WalletConnect Project ID is required. Please set VITE_WALLET_CONNECT_PROJECT_ID in your environment variables.');
//                 return;
//             }

//             const connector = new DAppConnector(
//                 metadata,
//                 LedgerId.TESTNET,
//                 projectId,
//                 Object.values(HederaJsonRpcMethod),
//                 [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
//                 [HederaChainId.Mainnet, HederaChainId.Testnet],
//             );
//             await connector.init();
//             if (isMounted) {
//                 setDAppConnector(connector);
//                 setIsReady(true);
//             }
//         }
//         init().catch(console.log);
//         return () => {
//             isMounted = false;
//         };
//     }, []);

//     if (!isReady)
//         return <LoadingState />;

//     return (
//         <DAppConnectorContext.Provider value={{ dAppConnector, userAccountId, sessionTopic, disconnect, refresh }}>
//             <QueryClientProvider client={queryClient}>
//                 {children}
//             </QueryClientProvider>
//         </DAppConnectorContext.Provider>)
// }