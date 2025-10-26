import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useDAppConnector } from "./clientProviders";

export const WalletConnect = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const { dAppConnector, userAccountId, disconnect, refresh } = useDAppConnector() ?? {};

  const handleConnectWallet = async () => {
    setLoading(true)
    toast.info("Preparing wallet connection pls wait", { duration: 5 })
    if (dAppConnector) {
      await dAppConnector.openModal();
      if (refresh) refresh();
    }
  };

  const handleDisconnect = () => {
    if (disconnect) {
      void disconnect();
      toast.info("wallet disconnected", { duration: 5 })
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (userAccountId) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass px-4 py-2 rounded-lg border-2 border-primary/30">
          <span className="text-primary font-mono text-sm">{formatAddress(userAccountId)}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="wallet" size="lg" onClick={handleConnectWallet} disabled={loading} className="animate-pulse">
      <Wallet className="mr-2 h-5 w-5" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};
