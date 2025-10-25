import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, UserPlus } from 'lucide-react';

interface FriendlyMatchChoiceProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onCancel: () => void;
}

export const FriendlyMatchChoice = ({
  onCreateRoom,
  onJoinRoom,
  onCancel,
}: FriendlyMatchChoiceProps) => {
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Friendly Match</h2>

        <p className="text-center text-muted-foreground">
          Create a room or join your friend's room
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={onCreateRoom} size="lg" className="h-auto py-6">
            <Plus className="mr-2 h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Create Room</span>
              <span className="text-xs opacity-80">Get a code to share</span>
            </div>
          </Button>

          <Button onClick={onJoinRoom} size="lg" variant="outline" className="h-auto py-6">
            <UserPlus className="mr-2 h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Join Room</span>
              <span className="text-xs opacity-80">Enter friend's code</span>
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
