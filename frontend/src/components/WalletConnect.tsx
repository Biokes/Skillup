import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

export const WalletConnect = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof (window as any).ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      toast.error("Please install MetaMask to play!");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        toast.success("Wallet connected! Ready to play!");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    toast.info("Wallet disconnected");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass px-4 py-2 rounded-lg border-2 border-primary/30">
          <span className="text-primary font-mono text-sm">{formatAddress(account)}</span>
        </div>
        <Button variant="outline" size="sm" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="wallet" size="lg" onClick={connectWallet}disabled={loading}className="animate-pulse">
      <Wallet className="mr-2 h-5 w-5" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};
