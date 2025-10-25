import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';
import { toast } from 'sonner';

interface HederaWalletContextType {
  accountId: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (amount: string) => Promise<string | null>;
}

const HederaWalletContext = createContext<HederaWalletContextType | undefined>(undefined);

export const HederaWalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [hashconnect, setHashconnect] = useState<HashConnect | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData | null>(null);

  useEffect(() => {
    initHashConnect();
  }, []);

  const initHashConnect = async () => {
    const hc = new HashConnect(
      import.meta.env.VITE_HEDERA_NETWORK === 'mainnet',
      import.meta.env.VITE_DEBUG === 'true'
    );

    setHashconnect(hc);

    hc.pairingEvent.on((data) => {
      setPairingData(data.pairingData);
      setAccountId(data.accountIds[0]);
      setTopic(data.topic);
      toast.success('Wallet connected!');
    });

    hc.disconnectionEvent.on(() => {
      setAccountId(null);
      setPairingData(null);
      toast.info('Wallet disconnected');
    });

    const initData = await hc.init(
      {
        name: 'Chain Skill Games',
        description: 'Skill-based blockchain games',
        icons: ['http://localhost:3000/'],
        url: window.location.origin,
      },
      import.meta.env.VITE_HEDERA_NETWORK || 'testnet',
      false
    );

    setTopic(initData.topic);

    const savedPairings = hc.hcData.savedPairings;
    if (savedPairings.length > 0) {
      const lastPairing = savedPairings[savedPairings.length - 1];
      setPairingData(lastPairing);
      setAccountId(lastPairing.accountIds[0]);
    }
  };

  const connect = async () => {
    if (!hashconnect) {
      toast.error('Initializing wallet connection...');
      return;
    }

    hashconnect.connectToLocalWallet();
  };

  const disconnect = () => {
    if (hashconnect && topic && pairingData) {
      hashconnect.disconnect(topic);
    }
    setAccountId(null);
    setPairingData(null);
  };

  const sendTransaction = async (amount: string): Promise<string | null> => {
    if (!hashconnect || !accountId || !topic || !pairingData) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      const transaction: MessageTypes.Transaction = {
        topic,
        byteArray: new Uint8Array(),
        metadata: {
          accountToSign: accountId,
          returnTransaction: false,
          hideNft: false,
        },
      };

      const response = await hashconnect.sendTransaction(topic, transaction);

      if (response.success) {
        return response.receipt?.transactionId || null;
      }

      toast.error('Transaction failed');
      return null;
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed');
      return null;
    }
  };

  return (
    <HederaWalletContext.Provider
      value={{
        accountId,
        isConnected: !!accountId,
        connect,
        disconnect,
        sendTransaction,
      }}
    >
      {children}
    </HederaWalletContext.Provider>
  );
};

export const useHederaWallet = () => {
  const context = useContext(HederaWalletContext);
  if (!context) {
    throw new Error('useHederaWallet must be used within HederaWalletProvider');
  }
  return context;
};
