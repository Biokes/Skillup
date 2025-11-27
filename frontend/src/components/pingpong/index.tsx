import { motion } from "framer-motion";
import Navbar from "../commons/navbar";
import { useRef, useState, useEffect } from "react";
import { CountdownState, GameState, PongGameState } from "@/types";
import { BALL_RADIUS, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_WIDTH } from "@/lib/utils";
import { socketService } from "@/services/socketService";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toast } from "../ui/sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

export default function PingPongGame() {
  const { state } = useLocation();
  const navigate = useNavigate();
 

  useEffect(() => {
    const requiredFields = ['sessionId', 'player1', 'player2'];
    const missingFields = requiredFields.filter(field => !state[field as keyof PongGameState]);

    if (!state) {
      toast.error("No game data found. Please create or join a game first.");
      navigate("/");
      return;
    }

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      toast.error("Invalid game data. Please try again.");
      navigate("/");
      return;
    }

    socketService.getSocket().emit("validateSession", { sessionId: state?.sessionId }, (response:{success:boolean}) => {
      if (!response.success) {
          toast.error("Create a game to play first");
          navigate("/")
      }
    })
    
  }, [])
  
  const powerups = [
    { name: "Multiball", icon: "🎆", owned: 0 },
    { name: "Pat Stretch", icon: "💪", owned: 0 },
    { name: "Shield", icon: "🛡️", owned: 0 },
  ];
  
  const BoostPack = () => (
    <section className="inventory">
      <h5>My Inventory</h5>
      <div>
        {powerups.map((powerUp, index) => (
          <motion.article key={index}>
            <nav>
              <span>{powerUp.icon}</span>
              <h5>{powerUp.name}</h5>
            </nav>
            <h6>: {powerUp.owned}</h6>
          </motion.article>
        ))}
      </div>
    </section>
  );

  function GameBoard() {
    const account = useCurrentAccount() ?? {};
    const address = account?.address ?? null;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerNumber = String(address).toLowerCase() === String(state?.player1).toLowerCase() ? 1 : 2;

    const initialGameState: GameState = {   
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      paddle1Y: CANVAS_HEIGHT / 2 - 50,
      paddle2Y: CANVAS_HEIGHT / 2 - 50,
      paddle1Height: 100,
      paddle2Height: 100,
      score1: 0,
      score2: 0,
      activePowerups: { player1: null, player2: null },
      status: "COUNTDOWN",
    };

    const [gameState, _setGameState] = useState<GameState>(initialGameState);
    const gameStateRef = useRef<GameState>(initialGameState);
    const setGameState = (s: GameState | ((prev: GameState) => GameState)) => {
      _setGameState((prev) => {
        const next = typeof s === "function" ? (s as (p: GameState) => GameState)(prev) : s;
        gameStateRef.current = next;
        return next;
      });
    };

    const [countdown, _setCountdown] = useState<CountdownState>({ active: true, remaining: 3 });
    const countdownRef = useRef<CountdownState>({ active: true, remaining: 3 });
    const setCountdown = (c: CountdownState | ((prev: CountdownState) => CountdownState)) => {
      _setCountdown((prev) => {
        const next = typeof c === "function" ? (c as (p: CountdownState) => CountdownState)(prev) : c;
        countdownRef.current = next;
        return next;
      });
    };

    const [gameOver, setGameOver] = useState<boolean>(false);
    const gameOverRef = useRef<boolean>(false);
    useEffect(() => {
        gameOverRef.current = gameOver;
    }, [gameOver]);
      
      
    const [winner, setWinner] = useState<string | null>(null);

    const inputRef = useRef({
      keyboard: { w: false, s: false, arrowUp: false, arrowDown: false },
      touch: { playerY: null as number | null },
    });

    const lastPaddleMoveRef = useRef<number>(0);
    const isDeviceTouchRef = useRef<boolean>(false);

    // compute isTouchDevice once on mount synchronously
    useEffect(() => {
      const isTouchDevice = () =>
        typeof window !== "undefined" &&
        (!!window.ontouchstart ||
          (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0) ||
          // @ts-expect-error device
          (navigator.msMaxTouchPoints !== undefined && navigator.msMaxTouchPoints > 0));
      isDeviceTouchRef.current = isTouchDevice();
    }, []);

    useEffect(() => {
      const handleGameStart = () => {
        if (gameOverRef.current) return;
        setCountdown({ active: true, remaining: 3 });
      };

      const handleCountdownComplete = () => {
        if (gameOverRef.current) return;
        setCountdown({ active: false, remaining: 0 });
      };

      const handleGameUpdate = (data: GameState) => {
        if (gameOverRef.current) return;
        setGameState(data);
      };

      const handleScoreUpdate = (data: { score1: number; score2: number; scoredBy: number }) => {
        if (gameOverRef.current) return;
        setGameState((prev) => ({ ...prev, score1: data.score1, score2: data.score2 }));
        setCountdown({ active: true, remaining: 3 });
      };

      const handleNextServe = () => {
        if (gameOverRef.current) return;
        setCountdown({ active: true, remaining: 3 });
      };

      const handleGameOver = (data: { winner: string; score1: number; score2: number; message: string }) => {
        setWinner(data.winner);
        setGameOver(true);
      };

      const handleOpponentDisconnected = (data: { playerNumber: number; message: string }) => {
        setWinner(address);
        setGameOver(true);
        toast.success("Opponent disconnected. You win!");
      };

      socketService.on("gameStart", handleGameStart);
      socketService.on("countdownComplete", handleCountdownComplete);
      socketService.on("gameUpdate", handleGameUpdate);
      socketService.on("scoreUpdate", handleScoreUpdate);
      socketService.on("nextServe", handleNextServe);
      socketService.on("gameOver", handleGameOver);
      socketService.on("opponentDisconnected", handleOpponentDisconnected);

      socketService.gameReady(state?.gameId, playerNumber, state?.sessionId);

      return () => {
        socketService.off("gameStart");
        socketService.off("countdownComplete");
        socketService.off("gameUpdate");
        socketService.off("scoreUpdate");
        socketService.off("nextServe");
        socketService.off("gameOver");
        socketService.off("opponentDisconnected");
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, playerNumber, state?.gameId, state?.sessionId]);

    useEffect(() => {
      if (!countdownRef.current.active || gameOverRef.current) return;
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev.remaining <= 1) {
            clearInterval(timer);
            return { active: false, remaining: 0 };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [countdownRef.current.active, gameOver]);
      
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameOverRef.current) return;
            const key = event.key.toLowerCase();
            if (!isDeviceTouchRef.current) {
                if (key === "w") inputRef.current.keyboard.w = true;
                if (key === "s") inputRef.current.keyboard.s = true;
                if (key === "arrowup") inputRef.current.keyboard.arrowUp = true;
                if (key === "arrowdown") inputRef.current.keyboard.arrowDown = true;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            if (!isDeviceTouchRef.current) {
                if (key === "w") inputRef.current.keyboard.w = false;
                if (key === "s") inputRef.current.keyboard.s = false;
                if (key === "arrowup") inputRef.current.keyboard.arrowUp = false;
                if (key === "arrowdown") inputRef.current.keyboard.arrowDown = false;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleTouchMove = (e: TouchEvent) => {
        if (gameOverRef.current) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchY = touch.clientY - rect.top;
        const touchX = touch.clientX - rect.left;
        const controllingPlayer = touchX < CANVAS_WIDTH / 2 ? 1 : 2;
        if (controllingPlayer === playerNumber) {
          const paddleHeight = playerNumber === 1 ? gameStateRef.current.paddle1Height : gameStateRef.current.paddle2Height;
          const newY = Math.max(0, Math.min(CANVAS_HEIGHT - paddleHeight, touchY - paddleHeight / 2));
          inputRef.current.touch.playerY = newY;
        }
      };

      const handleTouchEnd = () => {
        inputRef.current.touch.playerY = null;
      };

      canvas.addEventListener("touchmove", handleTouchMove);
      canvas.addEventListener("touchend", handleTouchEnd);

      return () => {
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }, [canvasRef, playerNumber]);

    useEffect(() => {
      const paddleInterval = setInterval(() => {
        if (gameOverRef.current) return;

        let newPaddleY: number | null = null;

        if (isDeviceTouchRef.current) {
            if (inputRef.current.touch.playerY !== null) newPaddleY = inputRef.current.touch.playerY;
        } else {
            const upPressed = inputRef.current.keyboard.w || inputRef.current.keyboard.arrowUp;
            const downPressed = inputRef.current.keyboard.s || inputRef.current.keyboard.arrowDown;

            if (upPressed) {
                if (playerNumber === 1 && gameStateRef.current.paddle1Y > 0) {
                    newPaddleY = gameStateRef.current.paddle1Y - 12;
                } else if (playerNumber === 2 && gameStateRef.current.paddle2Y > 0) {
                    newPaddleY = gameStateRef.current.paddle2Y - 12;
                }
            }

            if (downPressed) {
                if (playerNumber === 1 && gameStateRef.current.paddle1Y < CANVAS_HEIGHT - gameStateRef.current.paddle1Height) {
                    newPaddleY = gameStateRef.current.paddle1Y + 12;
                } else if (playerNumber === 2 && gameStateRef.current.paddle2Y < CANVAS_HEIGHT - gameStateRef.current.paddle2Height) {
                    newPaddleY = gameStateRef.current.paddle2Y + 12;
                }
            }
        }

        if (newPaddleY !== null && Date.now() - lastPaddleMoveRef.current > 12 && !!state.gameId) {
            socketService.paddleMove(playerNumber, newPaddleY, state?.gameId);
            lastPaddleMoveRef.current = Date.now();
        }
      }, 16);

      return () => clearInterval(paddleInterval);
    }, [playerNumber]); 

    useEffect(() => {
      let rafId = 0;
      const draw = () => {
        if (gameOverRef.current) {
          return;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
          rafId = requestAnimationFrame(draw);
          return;
        }
        const ctx = canvas.getContext("2d");
        const gs = gameStateRef.current;
        const cd = countdownRef.current;
        if (!ctx) {
          rafId = requestAnimationFrame(draw);
          return;
        }

        ctx.fillStyle = "#0a0e27";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, 0);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Player addresses
        ctx.font = "12px Ribeye";
        ctx.fillStyle = "#64c8ff";
        ctx.textAlign = "left";
        ctx.fillText(state?.player1 ? "You" : "Opponent", 30, 25);
        ctx.textAlign = "right";
        ctx.fillText(state?.player2 === address ? "You" : "Opponent", CANVAS_WIDTH - 30, 25);

        // Paddles with glow
        ctx.fillStyle = gs.activePowerups.player1 === "padStretch" ? "#fbbf24" : "#06b6d4";
        ctx.shadowColor = gs.activePowerups.player1 === "padStretch" ? "#fbbf24" : "#06b6d4";
        ctx.shadowBlur = gs.activePowerups.player1 === "padStretch" ? 20 : 8;
        ctx.fillRect(20, gs.paddle1Y, PADDLE_WIDTH, gs.paddle1Height);

        ctx.fillStyle = gs.activePowerups.player2 === "padStretch" ? "#fbbf24" : "#a855f7";
        ctx.shadowColor = gs.activePowerups.player2 === "padStretch" ? "#fbbf24" : "#a855f7";
        ctx.shadowBlur = gs.activePowerups.player2 === "padStretch" ? 20 : 8;
        ctx.fillRect(CANVAS_WIDTH - 20 - PADDLE_WIDTH, gs.paddle2Y, PADDLE_WIDTH, gs.paddle2Height);

        ctx.shadowBlur = 0;

        // Ball with glow
        ctx.fillStyle = "#ec4899";
        ctx.shadowColor = "#ec4899";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(gs.ballX, gs.ballY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 3;

        ctx.font = "bold 48px Ribeye";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(gs.score1.toString(), CANVAS_WIDTH / 4, 70);
        ctx.fillText(gs.score2.toString(), (CANVAS_WIDTH * 3) / 4, 70);

        if (cd.active) {
          ctx.font = "bold 72px Ribeye";
          ctx.fillStyle = "#fbbf24";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 30;
          ctx.fillText(cd.remaining.toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          ctx.shadowBlur = 0;
        }

        rafId = requestAnimationFrame(draw);
      };

      rafId = requestAnimationFrame(draw);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
      countdownRef.current = countdown;
    }, [countdown]);

    function GameOverPopUp(props: { gameState: GameState }) {
      return (
        <Dialog open={gameOver} onOpenChange={(o) => { if (!o) return; }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="ribeye text-[1.2rem] text-[#f8b141]">Game Ended</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="gameOver">
              <motion.p
                className="ribeye !text-[1.2rem] !text-[#f8b141]"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              >
                {winner === address ? "You won 🎉🤭🕺" : "Your Opponent won 😔😔"}
              </motion.p>
              <p>
                          {`${winner === address ?
                              "(You)" : "(Opponent)"} ${props.gameState.score1}
                               :
                            ${props.gameState.score2} ${winner !== address ? "(You)" : "(Opponent)"}`}
              </p>
              <Button onClick={() => { navigate("/"); }}>Back Home</Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <aside className="gameBoard">
        <canvas ref={canvasRef} width={800} height={500} className="canvas" />
        {gameOver && <GameOverPopUp gameState={gameState} />}
      </aside>
    );
  }

  return (
    <main className="">
      <Navbar />
      <BoostPack />
      <GameBoard />
    </main>
  );
}
