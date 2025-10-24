import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Cylinder, Box } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Pause, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TABLE_WIDTH = 10;
const TABLE_HEIGHT = 8;
const PUCK_RADIUS = 0.3;
const PADDLE_RADIUS = 0.5;
const WINNING_SCORE = 7;
const MAX_PUCK_SPEED = 0.3;
const FRICTION = 0.985;

interface PuckProps {
  onScore: (player: number) => void;
  isPaused: boolean;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  velocityRef: React.MutableRefObject<THREE.Vector3>;
}

const Puck = ({ onScore, isPaused, positionRef, velocityRef }: PuckProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || isPaused) return;

    positionRef.current.add(velocityRef.current);

    if (Math.abs(positionRef.current.x) > TABLE_WIDTH / 2 - PUCK_RADIUS) {
      velocityRef.current.x *= -0.95;
      positionRef.current.x = Math.sign(positionRef.current.x) * (TABLE_WIDTH / 2 - PUCK_RADIUS);
    }

    // Goal detection and bounce
    if (Math.abs(positionRef.current.z) > TABLE_HEIGHT / 2 - PUCK_RADIUS) {
      // Check if it's a goal (within goal width)
      if (Math.abs(positionRef.current.x) < 1.5) {
        // Goal scored
        if (positionRef.current.z > 0) {
          onScore(1); // Player 1 scores
        } else {
          onScore(2); // Player 2 scores
        }
        // Reset puck to center
        positionRef.current.set(0, 0.2, 0);
        velocityRef.current.set(
          (Math.random() - 0.5) * 0.15,
          0,
          (Math.random() > 0.5 ? 0.1 : -0.1)
        );
      } else {
        // Wall bounce (outside goal area)
        velocityRef.current.z *= -0.95;
        positionRef.current.z = Math.sign(positionRef.current.z) * (TABLE_HEIGHT / 2 - PUCK_RADIUS);
      }
    }

    // Apply friction
    velocityRef.current.multiplyScalar(FRICTION);

    // Maintain minimum speed
    const speed = velocityRef.current.length();
    if (speed > 0 && speed < 0.03) {
      velocityRef.current.normalize().multiplyScalar(0.03);
    }

    // Limit maximum speed
    if (speed > MAX_PUCK_SPEED) {
      velocityRef.current.normalize().multiplyScalar(MAX_PUCK_SPEED);
    }

    meshRef.current.position.copy(positionRef.current);
  });

  return (
    <Cylinder ref={meshRef} args={[PUCK_RADIUS, PUCK_RADIUS, 0.15, 32]} position={[0, 0.2, 0]}>
      <meshStandardMaterial
        color="#ec4899"
        emissive="#ec4899"
        emissiveIntensity={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </Cylinder>
  );
};

interface PaddleProps {
  isPlayer1: boolean;
  puckPosRef: React.MutableRefObject<THREE.Vector3>;
  puckVelRef: React.MutableRefObject<THREE.Vector3>;
  keysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  isPaused: boolean;
}

const Paddle = ({ isPlayer1, puckPosRef, puckVelRef, keysRef, isPaused }: PaddleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useRef(
    new THREE.Vector3(0, 0.2, isPlayer1 ? -TABLE_HEIGHT / 2 + 1.5 : TABLE_HEIGHT / 2 - 1.5)
  );
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const PADDLE_SPEED = 0.15;
  const PADDLE_FRICTION = 0.88;

  useFrame(() => {
    if (!meshRef.current || isPaused) return;

    // Player controls with smooth acceleration
    const keys = keysRef.current;

    if (isPlayer1) {
      // Player 1: A/D for left/right, W/S for up/down
      if (keys["a"] || keys["A"]) velocity.current.x -= 0.015;
      if (keys["d"] || keys["D"]) velocity.current.x += 0.015;
      if (keys["w"] || keys["W"]) velocity.current.z -= 0.015;
      if (keys["s"] || keys["S"]) velocity.current.z += 0.015;
    } else {
      // Player 2: Arrow keys or J/K/I/L
      if (keys["ArrowLeft"] || keys["j"] || keys["J"]) velocity.current.x -= 0.015;
      if (keys["ArrowRight"] || keys["l"] || keys["L"]) velocity.current.x += 0.015;
      if (keys["ArrowUp"] || keys["i"] || keys["I"]) velocity.current.z -= 0.015;
      if (keys["ArrowDown"] || keys["k"] || keys["K"]) velocity.current.z += 0.015;
    }

    // Apply friction to velocity
    velocity.current.multiplyScalar(PADDLE_FRICTION);

    // Limit speed
    const speed = new THREE.Vector2(velocity.current.x, velocity.current.z).length();
    if (speed > PADDLE_SPEED) {
      const scale = PADDLE_SPEED / speed;
      velocity.current.x *= scale;
      velocity.current.z *= scale;
    }

    // Update position
    position.current.add(velocity.current);

    // Boundaries for paddles (keep in own half with some overlap at center)
    const centerLimit = isPlayer1 ? 0.5 : -0.5;
    const endLimit = isPlayer1 ? -TABLE_HEIGHT / 2 + PADDLE_RADIUS : TABLE_HEIGHT / 2 - PADDLE_RADIUS;

    position.current.x = Math.max(
      -TABLE_WIDTH / 2 + PADDLE_RADIUS,
      Math.min(TABLE_WIDTH / 2 - PADDLE_RADIUS, position.current.x)
    );

    if (isPlayer1) {
      position.current.z = Math.max(endLimit, Math.min(centerLimit, position.current.z));
    } else {
      position.current.z = Math.min(endLimit, Math.max(centerLimit, position.current.z));
    }

    // Collision with puck
    const distance = new THREE.Vector2(
      position.current.x - puckPosRef.current.x,
      position.current.z - puckPosRef.current.z
    ).length();

    if (distance < PADDLE_RADIUS + PUCK_RADIUS) {
      // Calculate collision normal
      const normal = new THREE.Vector2(
        puckPosRef.current.x - position.current.x,
        puckPosRef.current.z - position.current.z
      ).normalize();

      // Separate puck from paddle
      const separation = PADDLE_RADIUS + PUCK_RADIUS - distance;
      puckPosRef.current.x += normal.x * separation;
      puckPosRef.current.z += normal.y * separation;

      // Transfer paddle velocity to puck with multiplier for better gameplay
      const paddleVel2D = new THREE.Vector2(velocity.current.x, velocity.current.z);
      const puckVel2D = new THREE.Vector2(puckVelRef.current.x, puckVelRef.current.z);

      // Reflect puck velocity
      const relativeVel = puckVel2D.sub(paddleVel2D);
      const speed = relativeVel.dot(normal);
      relativeVel.sub(normal.multiplyScalar(speed * 2));
      relativeVel.add(paddleVel2D.multiplyScalar(1.5)); // Transfer paddle momentum

      puckVelRef.current.x = relativeVel.x;
      puckVelRef.current.z = relativeVel.y;

      // Vibration feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }

    meshRef.current.position.copy(position.current);
  });

  return (
    <Cylinder
      ref={meshRef}
      args={[PADDLE_RADIUS, PADDLE_RADIUS, 0.25, 32]}
      position={position.current.toArray()}
    >
      <meshStandardMaterial
        color={isPlayer1 ? "#06b6d4" : "#a855f7"}
        emissive={isPlayer1 ? "#06b6d4" : "#a855f7"}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Cylinder>
  );
};

const AirHockeyTable = () => {
  return (
    <group>
      <Box args={[TABLE_WIDTH, 0.2, TABLE_HEIGHT]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </Box>

      <Box args={[TABLE_WIDTH, 0.05, 0.08]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
      </Box>

      <Cylinder args={[1, 1, 0.05]} position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} transparent opacity={0.5} />
      </Cylinder>

      <Box args={[3, 0.3, 0.1]} position={[0, 0.2, -TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.4} emissive="#06b6d4" emissiveIntensity={0.3} />
      </Box>

      <Box args={[3, 0.3, 0.1]} position={[0, 0.2, TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#a855f7" transparent opacity={0.4} emissive="#a855f7" emissiveIntensity={0.3} />
      </Box>

      <Box args={[0.2, 0.5, TABLE_HEIGHT]} position={[-TABLE_WIDTH / 2, 0.25, 0]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>
      <Box args={[0.2, 0.5, TABLE_HEIGHT]} position={[TABLE_WIDTH / 2, 0.25, 0]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>

      <Box args={[3.5, 0.5, 0.2]} position={[-3.5, 0.25, -TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>
      <Box args={[3.5, 0.5, 0.2]} position={[3.5, 0.25, -TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>
      <Box args={[3.5, 0.5, 0.2]} position={[-3.5, 0.25, TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>
      <Box args={[3.5, 0.5, 0.2]} position={[3.5, 0.25, TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.6} />
      </Box>
    </group>
  );
};

export const AirHockeyGame = () => {
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [gameKey, setGameKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [pauseTimeRemaining, setPauseTimeRemaining] = useState(0);
  const [pausesLeft, setPausesLeft] = useState({ player1: 2, player2: 2 });
  const puckPositionRef = useRef(new THREE.Vector3(0, 0.2, 0));
  const puckVelocityRef = useRef(new THREE.Vector3(0.1, 0, 0.08));
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const navigate = useNavigate();

  useEffect(() => {
    if (isPaused && pauseTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setPauseTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPaused(false);
            toast.info("⏱️ Time's up! Game auto-resumed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPaused, pauseTimeRemaining]);

  const handleScore = (player: number) => {
    setScore((prev) => {
      const newScore = {
        ...prev,
        [`player${player}`]: prev[`player${player}` as keyof typeof prev] + 1,
      };

      toast.success(`Player ${player} scores! ${newScore.player1} - ${newScore.player2}`);

      if (newScore.player1 >= WINNING_SCORE) {
        setWinner("Player 1");
        toast.success("Player 1 Wins!", { duration: 4000 });
        handleReset();
      } else if (newScore.player2 >= WINNING_SCORE) {
        setWinner("Player 2");
        toast.success("Player 2 Wins!", { duration: 4000 });
        handleReset();
      }

      return newScore;
    });
  };

  const handleReset = () => {
    setScore({ player1: 0, player2: 0 });
    setGameKey((prev) => prev + 1);
    setWinner(null);
    setGameStarted(false);
    setIsPaused(false);
    setPausesLeft({ player1: 2, player2: 2 });
    setPauseTimeRemaining(0);
    puckPositionRef.current.set(0, 0.2, 0);
    puckVelocityRef.current.set(0.1, 0, 0.08);
    toast.info("Game reset!");
  };

  const handleStartGame = () => {
    setScore({ player1: 0, player2: 0 });
    setWinner(null);
    setIsPaused(false);
    setGameStarted(true);
    setPausesLeft({ player1: 2, player2: 2 });
    setPauseTimeRemaining(0);
    setGameKey((prev) => prev + 1);
    puckPositionRef.current.set(0, 0.2, 0);
    puckVelocityRef.current.set(
      (Math.random() - 0.5) * 0.15,
      0,
      (Math.random() > 0.5 ? 0.1 : -0.1)
    );
    toast.info("🎮 Game Started! First to 7 wins!", { duration: 3000 });
  };

  const handlePause = (player: 1 | 2) => {
    const key = `player${player}` as 'player1' | 'player2';
    // if (pausesLeft.player1 === 0 && pausesLeft.player2 === 0) {
    //   toast.error("🚫 No more pauses allowed this game!");
    //   return;
    // }
    if (pausesLeft[key] > 0 && !isPaused) {
      setPausesLeft(prev => ({ ...prev, [key]: prev[key] - 1 }));
      setIsPaused(true);
      setPauseTimeRemaining(10); // 10-second countdown
      toast.info(`⏸️ Player ${player} paused (${pausesLeft[key] - 1} pauses left, 10s countdown)`);
    } else if (pausesLeft[key] === 0) {
      toast.error(`Player ${player} has no pauses left!`);
    } else if (isPaused) {
      toast.info("Game already paused!");
    }
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (isPaused) setPauseTimeRemaining(0);
    toast.info(isPaused ? "▶️ Game Resumed" : "⏸️ Game Paused");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['w', 's', 'W', 'S', 'a', 'd', 'A', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'j', 'k', 'l', 'I', 'J', 'K', 'L', ' ', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
      }

      keysRef.current[e.key] = true;
      if (gameStarted && (e.key === 'p' || e.key === 'P')) {
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, isPaused]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-3xl md:text-5xl font-bold text-gradient">Air Hockey Arena</h1>
          <div className="flex gap-2">
            {gameStarted && (
              <Button variant="outline" onClick={togglePause} size="icon">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="glass p-4 md:p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center gap-5 px-10">
            <motion.div className="text-center p-1 glass rounded-xl flex-1 mx-2" animate={{ scale: score.player1 > score.player2 ? 1.05 : 1 }}>
              <div className="text-xs md:text-sm text-muted-foreground mb-2">Player 1</div>
              <div className="text-xl md:text-2xl font-bold text-primary">{score.player1}</div>
              <div className="text-xs mt-1">Pauses: {pausesLeft.player1}</div>
              {gameStarted && !winner && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-6 text-xs"
                  onClick={() => handlePause(1)}
                  disabled={isPaused || pausesLeft.player1 === 0}
                >
                  Pause
                </Button>
              )}
            </motion.div>

            <div className="text-xl md:text-2xl font-bold text-muted-foreground">VS</div>

            <motion.div className="text-center p-1 glass rounded-xl flex-1 mx-2" animate={{ scale: score.player2 > score.player1 ? 1.05 : 1 }}>
              <div className="text-xs md:text-sm text-muted-foreground mb-2">Player 2</div>
              <div className="text-xl md:text-2xl font-bold text-secondary">{score.player2}</div>
              <div className="text-xs mt-1">Pauses: {pausesLeft.player2}</div>
              {gameStarted && !winner && (
                <Button size="sm" variant="outline" className="mt-2 h-6 text-xs" onClick={() => handlePause(2)} disabled={isPaused || pausesLeft.player2 === 0}>
                  Pause
                </Button>
              )}
            </motion.div>
          </div>

          <div className="relative h-[400px] md:h-[600px] border-2 border-primary/20 rounded-xl overflow-hidden bg-black/50 shadow-2xl">
            <Canvas key={gameKey} camera={{ position: [0, 12, 0], fov: 50 }}>
              <ambientLight intensity={0.4} />
              <pointLight position={[0, 10, 0]} intensity={1.5} />
              <pointLight position={[5, 5, 5]} intensity={0.6} color="#06b6d4" />
              <pointLight position={[-5, 5, -5]} intensity={0.6} color="#a855f7" />
              <spotLight position={[0, 15, 0]} intensity={0.8} angle={0.6} penumbra={0.5} />

              <AirHockeyTable />
              <Puck
                onScore={handleScore}
                isPaused={isPaused}
                positionRef={puckPositionRef}
                velocityRef={puckVelocityRef}
              />
              <Paddle
                isPlayer1={true}
                puckPosRef={puckPositionRef}
                puckVelRef={puckVelocityRef}
                keysRef={keysRef}
                isPaused={isPaused}
              />
              <Paddle
                isPlayer1={false}
                puckPosRef={puckPositionRef}
                puckVelRef={puckVelocityRef}
                keysRef={keysRef}
                isPaused={isPaused}
              />

              <OrbitControls
                enableRotate={false}
                enablePan={false}
                enableZoom={false}
              />
            </Canvas>

            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10"
              >
                <div className="text-center space-y-4">
                  <Pause className="h-16 w-16 mx-auto text-primary" />
                  <div className="text-3xl font-bold text-white">PAUSED</div>
                  {pauseTimeRemaining > 0 && (
                    <div className="text-2xl text-amber-400">
                      Auto-resume in: {pauseTimeRemaining}s
                    </div>
                  )}
                  <Button onClick={togglePause} variant="gaming" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </Button>
                </div>
              </motion.div>
            )}

            {!gameStarted && !winner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10"
              >
                <Button onClick={handleStartGame} variant="gaming" size="lg" className="text-xl px-8 py-6">
                  🎮 Start Game
                </Button>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="text-center space-y-4 p-6 glass rounded-xl"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                  {winner} Wins! 🏆
                </div>
                <div className="text-lg text-muted-foreground">
                  Final Score: {score.player1} - {score.player2}
                </div>
                <Button onClick={handleStartGame} variant="gaming" size="lg" className="mt-4">
                  🔄 Play Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center space-y-2 text-sm text-muted-foreground glass p-4 rounded-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-primary font-semibold mb-2">Player 1 Controls (Cyan)</div>
                    <div className="space-y-1">
                      <p>W/S - Move Forward/Back</p>
                      <p>A/D - Move Left/Right</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-secondary font-semibold mb-2">Player 2 Controls (Purple)</div>
                    <div className="space-y-1">
                      <p>↑/↓ or I/K - Move Forward/Back</p>
                      <p>←/→ or J/L - Move Left/Right</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-primary/20 pt-3 mt-3">
                  <p className="font-semibold text-primary">P - Pause/Resume</p>
                  <p>Each player has 2 pauses (10 seconds each)</p>
                  <p>First to {WINNING_SCORE} points wins!</p>
                  <p className="text-xs mt-2 text-amber-400">💡 Tip: Hit the puck while moving to add momentum!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
