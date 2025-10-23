import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hand, Scissors as ScissorsIcon, FileText } from "lucide-react";
import { toast } from "sonner";

interface RockPaperScissorsProps {
  onBack: () => void;
}

type Choice = "rock" | "paper" | "scissors" | null;

const choices = [
  { value: "rock", icon: Hand, label: "Rock" },
  { value: "paper", icon: FileText, label: "Paper" },
  { value: "scissors", icon: ScissorsIcon, label: "Scissors" },
];

export const RockPaperScissors = ({ onBack }: RockPaperScissorsProps) => {
  const [player1Choice, setPlayer1Choice] = useState<Choice>(null);
  const [player2Choice, setPlayer2Choice] = useState<Choice>(null);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player1: 0, player2: 0, draws: 0 });
  const [round, setRound] = useState(1);
  const [isPlayer1Turn, setIsPlayer1Turn] = useState(true);

  const determineWinner = (p1: Choice, p2: Choice) => {
    if (!p1 || !p2) return null;
    if (p1 === p2) return "draw";
    if (
      (p1 === "rock" && p2 === "scissors") ||
      (p1 === "paper" && p2 === "rock") ||
      (p1 === "scissors" && p2 === "paper")
    ) {
      return "player1";
    }
    return "player2";
  };

  const handleChoice = (choice: Choice) => {
    if (isPlayer1Turn) {
      setPlayer1Choice(choice);
      setIsPlayer1Turn(false);
      toast.info("Player 1 locked in! Player 2's turn...");
    } else {
      setPlayer2Choice(choice);
      const winner = determineWinner(player1Choice, choice);
      
      if (winner === "player1") {
        setResult("Player 1 Wins!");
        setScore({ ...score, player1: score.player1 + 1 });
        toast.success("Player 1 wins this round!");
      } else if (winner === "player2") {
        setResult("Player 2 Wins!");
        setScore({ ...score, player2: score.player2 + 1 });
        toast.success("Player 2 wins this round!");
      } else {
        setResult("Draw!");
        setScore({ ...score, draws: score.draws + 1 });
        toast("It's a draw!");
      }
    }
  };

  const nextRound = () => {
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setResult(null);
    setIsPlayer1Turn(true);
    setRound(round + 1);
  };

  const resetGame = () => {
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setResult(null);
    setScore({ player1: 0, player2: 0, draws: 0 });
    setRound(1);
    setIsPlayer1Turn(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-4xl font-bold text-gradient">RPS Arena</h1>
          <div className="w-32" />
        </div>

        <div className="glass p-8 rounded-2xl space-y-6">
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">Round {round}</div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Player 1</div>
                <div className="text-3xl font-bold text-primary">{score.player1}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Draws</div>
                <div className="text-3xl font-bold text-accent">{score.draws}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Player 2</div>
                <div className="text-3xl font-bold text-secondary">{score.player2}</div>
              </div>
            </div>
          </div>

          {!result && (
            <div className="text-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-2xl font-bold text-gradient"
              >
                {isPlayer1Turn ? "Player 1's Turn" : "Player 2's Turn"}
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="choices"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-3 gap-4"
              >
                {choices.map(({ value, icon: Icon, label }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice(value as Choice)}
                    className="glass p-8 rounded-2xl border-2 border-primary/20 hover:border-primary/60 transition-all group"
                  >
                    <Icon className="h-16 w-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                    <div className="text-xl font-bold">{label}</div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center glass p-6 rounded-2xl">
                    <div className="text-sm text-muted-foreground mb-2">Player 1</div>
                    {player1Choice && (
                      <>
                        {choices.find((c) => c.value === player1Choice)?.icon &&
                          (() => {
                            const Icon = choices.find((c) => c.value === player1Choice)!.icon;
                            return <Icon className="h-20 w-20 mx-auto mb-2 text-primary" />;
                          })()}
                        <div className="text-xl font-bold capitalize">{player1Choice}</div>
                      </>
                    )}
                  </div>
                  <div className="text-center glass p-6 rounded-2xl">
                    <div className="text-sm text-muted-foreground mb-2">Player 2</div>
                    {player2Choice && (
                      <>
                        {choices.find((c) => c.value === player2Choice)?.icon &&
                          (() => {
                            const Icon = choices.find((c) => c.value === player2Choice)!.icon;
                            return <Icon className="h-20 w-20 mx-auto mb-2 text-secondary" />;
                          })()}
                        <div className="text-xl font-bold capitalize">{player2Choice}</div>
                      </>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold text-gradient mb-6">{result}</div>
                  <div className="flex gap-4 justify-center">
                    <Button variant="gaming" onClick={nextRound}>
                      Next Round
                    </Button>
                    <Button variant="outline" onClick={resetGame}>
                      Reset Game
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>Players take turns choosing Rock, Paper, or Scissors</p>
            <p>Rock beats Scissors • Paper beats Rock • Scissors beats Paper</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
