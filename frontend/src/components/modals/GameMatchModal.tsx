import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Zap, Users, Plus, Search, ArrowLeft } from 'lucide-react';
import { MatchType } from '@/types/game';
import { useHederaWallet } from '@/contexts/HederaWalletContext';
import { toast } from 'sonner';
// import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';

interface GameMatchModalProps {
  onSelectMatchType: (matchType: MatchType) => void;
  onCreateQuickMatch?: () => void;
  onJoinQuickMatch?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export const GameMatchModal = ({
  onSelectMatchType,
  onCreateQuickMatch,
  onJoinQuickMatch,
  onClose,
  isOpen
}: GameMatchModalProps) => {
  const { isConnected } = useHederaWallet();
  const [showQuickMatchOptions, setShowQuickMatchOptions] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showQuickMatchOptions ? 'Quick Match' : 'Choose Match Type'}
          </DialogTitle>
        </DialogHeader>

        {!showQuickMatchOptions ? (
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline" onClick={() => onSelectMatchType('staked')} disabled={!isConnected}
              className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-yellow-500/10 hover:border-yellow-500 disabled:opacity-50"
            >
              <div className="flex items-center gap-2 w-full">
                <Coins className="h-6 w-6 text-yellow-500" />
                <span className="font-bold text-lg">Staked Match</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Random opponent + HBAR stake
              </span>
              {!isConnected && (
                <span className="text-xs text-red-500">Connect wallet first</span>
              )}
            </Button>

            <Button variant="outline" className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-blue-500/10 hover:border-blue-500"
              onClick={() => {
                onSelectMatchType('quick');
                setShowQuickMatchOptions(true);
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <Zap className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg">Quick Match</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Random opponent (Free)
              </span>
            </Button>

            <Button variant="outline" className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => {
                onSelectMatchType('friendly');
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <Users className="h-6 w-6 text-green-500" />
                <span className="font-bold text-lg">Friendly Match</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Create code for friend (Free)
              </span>
            </Button>

            <Button variant="ghost" onClick={onClose} className="mt-4">
              Cancel
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
