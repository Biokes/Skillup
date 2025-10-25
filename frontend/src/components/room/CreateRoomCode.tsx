import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CreateRoomCodeProps {
  roomCode: string;
  onCancel: () => void;
  countdown?: number | null;
}

export const CreateRoomCode = ({ roomCode, onCancel, countdown }: CreateRoomCodeProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6">
        {countdown !== null && countdown !== undefined ? (
          <>
            <h2 className="text-2xl font-bold">Opponent Joined!</h2>
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-bold text-gradient"
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
            <p className="text-center text-sm text-muted-foreground">
              Get ready! Game starting soon...
            </p>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Card>
  );
};
