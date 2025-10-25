import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface JoinRoomCodeProps {
  onJoin: (roomCode: string) => void;
  onBack: () => void;
}

export const JoinRoomCode = ({ onJoin, onBack }: JoinRoomCodeProps) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim()) {
      onJoin(roomCode.toUpperCase());
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Enter Room Code</h2>

        <p className="text-center text-muted-foreground">
          Enter the code shared by your friend
        </p>

        <Input
          type="text"
          placeholder="ABC123"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          className="text-center text-2xl font-mono tracking-wider"
          maxLength={10}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handleJoin} disabled={!roomCode.trim()} className="flex-1">
            Join Game
          </Button>
        </div>
      </div>
    </Card>
  );
};
