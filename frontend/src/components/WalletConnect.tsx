// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Wallet } from "lucide-react";
// import { toast } from "sonner";
// import { useDAppConnector } from "../contexts/clientProviders";

// export const WalletConnect = () => {
//   const [loading, setLoading] = useState<boolean>(false);
//   const { dAppConnector, userAccountId, disconnect, refresh } = useDAppConnector() ?? {};

//   useEffect(() => {
//     if (!dAppConnector) return;

//     const subscription = dAppConnector.events$?.subscribe((event: { name: string; data?: any }) => {
//       if (event.name === 'session_proposal' || event.name === 'session_proposal') {
//         console.log('Pairing proposal started');
//         setLoading(true);
//       }
//       if (event.name === 'accountsChanged' || event.name === 'session_created') {
//         setLoading(false);
//         toast.success('Wallet connected successfully!');
//         if (refresh) refresh();
//       }
//       if ((event.name === 'session_delete' || event.name === 'session_deleted') && !userAccountId) {
//         setLoading(false);
//         toast.warning('Wallet connection cancelled');
//       }
//     });

//     return () => {
//       subscription?.unsubscribe();
//     };
//   }, [dAppConnector, refresh, userAccountId]);

//   const handleConnectWallet = async () => {
//     if (!dAppConnector) {
//       toast.error('Wallet connector not ready');
//       return;
//     }
//     setLoading(true);
//     toast.info('Preparing wallet connection, please wait...', { duration: 2000 });
//     try {
//       await dAppConnector.openModal();
//     } catch (err) {
//       console.error(err);
//       setLoading(false);
//       toast.error('Wallet connection failed');
//     }
//   };
  
//   const handleDisconnect = () => {
//     if (disconnect) {
//       void disconnect();
//       toast.info("wallet disconnected", { duration: 5 })
//     }
//   };

//   const formatAddress = (address: string) => {
//     return `${address.slice(0, 3)}...${address.slice(-3)}`;
//   };

//   if (userAccountId) {
//     return (
//       <div className="flex items-center gap-3">
//         <div className="glass px-3 py-2 rounded-lg border-2 border-primary/30">
//           <span className="text-primary font-mono text-sm">{formatAddress(userAccountId)}</span>
//         </div>
//         <Button variant="outline" size="sm" onClick={handleDisconnect}>
//           Disconnect
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Button variant="wallet" size="lg" onClick={handleConnectWallet} disabled={loading} className="animate-pulse">
//       <Wallet className="mr-2 h-5 w-5" />
//       {loading ? "Connecting..." : "Connect Wallet"}
//     </Button>
//   );
// };
