import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateRoomCodeProps {
  roomCode: string;
  onCancel: () => void;
}

export const CreateRoomCode = ({ roomCode, onCancel }: CreateRoomCodeProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold">Your Room Code</h2>

        <div className="relative">
          <div className="text-5xl font-mono font-bold tracking-wider bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {roomCode}
          </div>
        </div>

        <p className="text-center text-muted-foreground">
          Share this code with your friend to join your game
        </p>

        <Button onClick={copyCode} size="lg" className="w-full">
          <Copy className="mr-2 h-5 w-5" />
          Copy Code
        </Button>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Waiting for opponent...</span>
        </div>

        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
};
