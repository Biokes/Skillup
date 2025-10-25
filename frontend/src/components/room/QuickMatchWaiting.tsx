import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickMatchWaitingProps {
  onCancel: () => void;
  countdown?: number | null;
}

export const QuickMatchWaiting = ({ onCancel, countdown }: QuickMatchWaitingProps) => {
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <Zap className="h-16 w-16 text-blue-500 relative z-10" />
        </div>

        {countdown !== null && countdown !== undefined ? (
          <>
            <h2 className="text-2xl font-bold">Opponent Found!</h2>
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
            <h2 className="text-2xl font-bold">Finding Opponent...</h2>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching for a match...</span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              This may take a moment. We're finding the perfect opponent for you!
            </p>

            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
