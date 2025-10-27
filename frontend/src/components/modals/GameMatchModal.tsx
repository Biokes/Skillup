import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Zap, Users } from 'lucide-react';
import { MatchType } from '@/types/game';
import { useDAppConnector } from '@/contexts/clientProviders';
import { toast } from 'sonner';
import { useGame } from '@/hooks/useGameContext';

interface GameMatchModalProps {
  onSelectMatchType: (matchType: MatchType) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const GameMatchModal = ({
  onSelectMatchType,
  onClose,
  isOpen,
}: GameMatchModalProps) => {
  const { userAccountId } = useDAppConnector() ?? {};
  const [showQuickMatchOptions, setShowQuickMatchOptions] = useState(false);
  const [isFriendly, setFriendly] = useState(false);

  const { joinQuickMatch, createFriendlyRoom, leaveGame } = useGame();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
        setShowQuickMatchOptions(false);
      }}
    >
      <DialogContent className="sm:max-w-md bg-[url('/images/bg-pattern.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60 rounded-lg" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl text-white">
            {showQuickMatchOptions
              ? !isFriendly
                ? 'Matching...'
                : 'Friendly Match'
              : 'Choose Match Type'}
          </DialogTitle>
        </DialogHeader>

        {!showQuickMatchOptions ? (
          <div className="flex flex-col gap-3 mt-4 relative z-10">
            <Button
              variant="outline"
              onClick={() => {
                if (!userAccountId) {
                  toast.error('Connect wallet first');
                  return;
                }
                onSelectMatchType('staked');
              }}
              className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-yellow-500/10 hover:border-yellow-500 disabled:opacity-50"
            >
              <div className="flex items-center gap-2 w-full">
                <Coins className="h-6 w-6 text-yellow-500" />
                <span className="font-bold text-lg text-white">Staked Match</span>
              </div>
              <span className="text-sm text-gray-300">
                Random opponent + HBAR stake
              </span>
            </Button>

            <Button variant="outline"
              className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-blue-500/10 hover:border-blue-500"
              onClick={() => {
                onSelectMatchType('quick');
                setShowQuickMatchOptions(true);
                setFriendly(false);
                joinQuickMatch();
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <Zap className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg text-white">Quick Match</span>
              </div>
              <span className="text-sm text-gray-300">
                Random opponent (Free)
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-start gap-2 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => {
                onSelectMatchType('friendly');
                setFriendly(true);
                setShowQuickMatchOptions(true);
                createFriendlyRoom();
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <Users className="h-6 w-6 text-green-500" />
                <span className="font-bold text-lg text-white">Friendly Match</span>
              </div>
              <span className="text-sm text-gray-300">
                Create code for friend (Free)
              </span>
            </Button>

            <Button variant="ghost" onClick={onClose} className="mt-4 text-white">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col my-4 justify-center gap-8 relative z-10">
            <p className="animate-pulse text-white text-center text-lg md:text-2xl font-bold capitalize text-gradient">
              Searching for an opponent...
            </p>
            <Button
                onClick={() => {
                leaveGame()  
                setFriendly(false);
                setShowQuickMatchOptions(false);
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
