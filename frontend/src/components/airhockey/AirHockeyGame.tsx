import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Cylinder, Box } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Pause, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { GameMatchModal } from "@/components/modals/GameMatchModal";
import { CreateRoomCode } from "@/components/room/CreateRoomCode";
import { JoinRoomCode } from "@/components/room/JoinRoomCode";
import { QuickMatchWaiting } from "@/components/room/QuickMatchWaiting";
import { FriendlyMatchChoice } from "@/components/room/FriendlyMatchChoice";
import { socketService } from "@/services/socketService";

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
  const navigate = useNavigate();
  const [gameKey, setGameKey] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const puckPositionRef = useRef(new THREE.Vector3(0, 0.2, 0));
  const puckVelocityRef = useRef(new THREE.Vector3(0.1, 0, 0.08));
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Multiplayer integration
  const {
    showMatchModal,
    matchType,
    roomCode,
    showRoomView,
    gameState,
    isPlaying,
    isPaused,
    gameResult,
    playerName,
    selectMatchType,
    createFriendlyRoom,
    joinFriendlyRoom,
    createQuickMatch,
    joinQuickMatch,
    pauseGame,
    resumeGame,
    forfeitGame,
    leaveGame,
    playAgain,
    setShowRoomView,
  } = useMultiplayerGame('airhockey');

  // Get score and players from server game state
  const score = gameState?.score || { player1: 0, player2: 0 };
  const players = gameState?.players || [];

  // Sync server game state to local puck position
  useEffect(() => {
    if (gameState && isPlaying && gameState.puck) {
      puckPositionRef.current.set(
        gameState.puck.x,
        0.2,
        gameState.puck.z
      );
      puckVelocityRef.current.set(
        gameState.puck.dx || 0,
        0,
        gameState.puck.dz || 0
      );
    }
  }, [gameState, isPlaying]);

  const handleScore = (player: number) => {
    // Server handles scoring
  };

  const handleReset = () => {
    leaveGame();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['w', 's', 'W', 'S', 'a', 'd', 'A', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'j', 'k', 'l', 'I', 'J', 'K', 'L', ' ', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
      }

      keysRef.current[e.key] = true;
      if (isPlaying && (e.key === 'p' || e.key === 'P')) {
        if (isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
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
  }, [isPlaying, isPaused, pauseGame, resumeGame]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Match Type Selection Modal */}
      {showMatchModal && (
        <GameMatchModal
          onSelectMatchType={selectMatchType}
          onCreateQuickMatch={createQuickMatch}
          onJoinQuickMatch={joinQuickMatch}
          onClose={() => navigate('/hub')}
        />
      )}

      {/* Room Views */}
      {showRoomView === 'create' && roomCode && (
        <CreateRoomCode roomCode={roomCode} onCancel={leaveGame} />
      )}
      {showRoomView === 'join' && (
        <JoinRoomCode onJoin={joinFriendlyRoom} onCancel={() => setShowRoomView(null)} />
      )}
      {showRoomView === 'waiting' && (
        <QuickMatchWaiting onCancel={leaveGame} />
      )}
      {matchType === 'friendly' && !showRoomView && !isPlaying && (
        <FriendlyMatchChoice
          onCreateRoom={createFriendlyRoom}
          onJoinRoom={() => setShowRoomView('join')}
          onCancel={leaveGame}
        />
      )}

      {/* Game Over Modal */}
      {gameResult && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="glass p-6 md:p-8 rounded-2xl max-w-md w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                {gameResult.winnerName ? `${gameResult.winnerName} Wins! 🏆` : 'Draw!'}
              </div>
              {gameResult.ratings && (
                <div className="space-y-2">
                  <p className="text-lg">Rating Changes:</p>
                  <div className="flex justify-between">
                    <span>{players[0]?.name || 'Player 1'}</span>
                    <span className={gameResult.ratings.player1Change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {gameResult.ratings.player1} ({gameResult.ratings.player1Change > 0 ? '+' : ''}{gameResult.ratings.player1Change})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{players[1]?.name || 'Player 2'}</span>
                    <span className={gameResult.ratings.player2Change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {gameResult.ratings.player2} ({gameResult.ratings.player2Change > 0 ? '+' : ''}{gameResult.ratings.player2Change})
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <Button variant="gaming" className="flex-1" onClick={playAgain}>
                  Play Again
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/hub')}>
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden md:flex">
            Back to Hub
            </span>
          </Button>
          <h1 className="text-xl md:text-4xl font-bold text-gradient">Air Hockey Arena</h1>
          <div className="flex gap-2">
            {isPlaying && (
              <Button variant="outline" onClick={isPaused ? resumeGame : pauseGame} size="icon">
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
              <div className="text-xs md:text-sm text-muted-foreground mb-2">{players[0]?.name || 'Player 1'}</div>
              <div className="text-xl md:text-2xl font-bold text-primary">{score.player1}</div>
              {players[0]?.rating && (
                <div className="text-xs mt-1 text-muted-foreground">Rating: {players[0].rating}</div>
              )}
            </motion.div>

            <div className="text-xl md:text-2xl font-bold text-muted-foreground">VS</div>

            <motion.div className="text-center p-1 glass rounded-xl flex-1 mx-2" animate={{ scale: score.player2 > score.player1 ? 1.05 : 1 }}>
              <div className="text-xs md:text-sm text-muted-foreground mb-2">{players[1]?.name || 'Player 2'}</div>
              <div className="text-xl md:text-2xl font-bold text-secondary">{score.player2}</div>
              {players[1]?.rating && (
                <div className="text-xs mt-1 text-muted-foreground">Rating: {players[1].rating}</div>
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
                  <p className="text-muted-foreground">Waiting for resume...</p>
                  <Button onClick={resumeGame} variant="gaming" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </Button>
                </div>
              </motion.div>
            )}
          </div>


          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center space-y-2 text-sm text-muted-foreground glass p-4 rounded-xl"
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-primary font-semibold mb-2">Controls</div>
                    <div className="space-y-1">
                      <p>W/A/S/D - Move Paddle (Player 1)</p>
                      <p>↑/←/↓/→ or I/J/K/L - Move Paddle (Player 2)</p>
                      <p>P - Pause/Resume Game</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-primary/20 pt-3 mt-3">
                  <p className="font-semibold text-primary">Multiplayer Air Hockey</p>
                  <p>First to {WINNING_SCORE} points wins!</p>
                  <p className="text-xs mt-2 text-muted-foreground">Playing as: {playerName}</p>
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
