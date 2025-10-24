import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-route-dom";


export const PingPongGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const WINNING_SCORE = 5;
    let animationId: number;

    // Game objects
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 8,
      dx: 4,
      dy: 4,
    };

    const paddle1 = {
      x: 20,
      y: canvas.height / 2 - 50,
      width: 12,
      height: 100,
      dy: 0,
    };

    const paddle2 = {
      x: canvas.width - 32,
      y: canvas.height / 2 - 50,
      width: 12,
      height: 100,
      dy: 0,
    };

    // Controls
    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
      ball.dy = (Math.random() - 0.5) * 8;
    };

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles with glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#06b6d4";
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
      
      ctx.shadowColor = "#a855f7";
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

      // Draw ball with glow
      ctx.shadowColor = "#ec4899";
      ctx.fillStyle = "#ec4899";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const update = () => {
      // Move paddles
      if (keys["w"] && paddle1.y > 0) paddle1.y -= 6;
      if (keys["s"] && paddle1.y < canvas.height - paddle1.height) paddle1.y += 6;
      if (keys["ArrowUp"] && paddle2.y > 0) paddle2.y -= 6;
      if (keys["ArrowDown"] && paddle2.y < canvas.height - paddle2.height) paddle2.y += 6;

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with top/bottom
      if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
      }

      // Ball collision with paddles
      if (
        ball.x - ball.radius < paddle1.x + paddle1.width &&
        ball.y > paddle1.y &&
        ball.y < paddle1.y + paddle1.height
      ) {
        ball.dx = Math.abs(ball.dx);
        ball.dy += (ball.y - (paddle1.y + paddle1.height / 2)) * 0.1;
      }

      if (
        ball.x + ball.radius > paddle2.x &&
        ball.y > paddle2.y &&
        ball.y < paddle2.y + paddle2.height
      ) {
        ball.dx = -Math.abs(ball.dx);
        ball.dy += (ball.y - (paddle2.y + paddle2.height / 2)) * 0.1;
      }

      // Score
      if (ball.x < 0) {
        const newScore = { ...score, player2: score.player2 + 1 };
        setScore(newScore);
        if (newScore.player2 >= WINNING_SCORE) {
          setWinner("Player 2");
          setGameStarted(false);
          toast.success("Player 2 Wins!");
        }
        resetBall();
      }

      if (ball.x > canvas.width) {
        const newScore = { ...score, player1: score.player1 + 1 };
        setScore(newScore);
        if (newScore.player1 >= WINNING_SCORE) {
          setWinner("Player 1");
          setGameStarted(false);
          toast.success("Player 1 Wins!");
        }
        resetBall();
      }
    };

    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, score]);

  const handleStartGame = () => {
    setScore({ player1: 0, player2: 0 });
    setWinner(null);
    setGameStarted(true);
    toast.info("Game Started! First to 5 wins!");
  };
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={()=>navigate('/hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-4xl font-bold text-gradient">Cyber Ping Pong</h1>
          <div className="w-32" />
        </div>

        <div className="glass p-8 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Player 1 (W/S)</div>
              <div className="text-4xl font-bold text-primary">{score.player1}</div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Player 2 (↑/↓)</div>
              <div className="text-4xl font-bold text-secondary">{score.player2}</div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full border-2 border-primary/20 rounded-xl bg-black/50"
          />

          {winner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-3xl font-bold text-gradient">{winner} Wins!</div>
            </motion.div>
          )}

          {!gameStarted && (
            <Button variant="gaming" className="w-full" onClick={handleStartGame}>
              {winner ? "Play Again" : "Start Game"}
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Player 1: W (up) / S (down)</p>
            <p>Player 2: Arrow Up / Arrow Down</p>
            <p>First to 5 points wins!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
