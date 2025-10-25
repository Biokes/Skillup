import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';

interface QuickMatchChoiceProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  onCancel: () => void;
}

export const QuickMatchChoice = ({
  onCreateGame,
  onJoinGame,
  onCancel,
}: QuickMatchChoiceProps) => {
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Quick Match</h2>

        <p className="text-center text-muted-foreground">
          Create a game or join an available match
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={onCreateGame} size="lg" className="h-auto py-6">
            <Plus className="mr-2 h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Create Game</span>
              <span className="text-xs opacity-80">Wait for players to join</span>
            </div>
          </Button>

          <Button onClick={onJoinGame} size="lg" variant="outline" className="h-auto py-6">
            <Search className="mr-2 h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Join Game</span>
              <span className="text-xs opacity-80">Find available matches</span>
            </div>
          </Button>
        </div>

        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
    </Card>
  );
};
