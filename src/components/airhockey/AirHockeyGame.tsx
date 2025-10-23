import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Cylinder, Sphere, Box } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { toast } from "sonner";

interface AirHockeyGameProps {
  onBack: () => void;
}

const TABLE_WIDTH = 10;
const TABLE_HEIGHT = 6;
const PUCK_RADIUS = 0.3;
const PADDLE_RADIUS = 0.5;

const Puck = ({
  onScore,
}: {
  onScore: (player: number) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [velocity] = useState(new THREE.Vector3(0.1, 0, 0.08));
  const position = useRef(new THREE.Vector3(0, 0.2, 0));

  useFrame(() => {
    if (!meshRef.current) return;

    // Update position
    position.current.add(velocity);

    // Wall bounces
    if (Math.abs(position.current.x) > TABLE_WIDTH / 2 - PUCK_RADIUS) {
      velocity.x *= -1.05;
      position.current.x = Math.sign(position.current.x) * (TABLE_WIDTH / 2 - PUCK_RADIUS);
    }

    // Goal detection
    if (Math.abs(position.current.z) > TABLE_HEIGHT / 2 - PUCK_RADIUS) {
      if (Math.abs(position.current.x) < 1.5) {
        // Goal scored
        if (position.current.z > 0) {
          onScore(1);
        } else {
          onScore(2);
        }
        // Reset puck
        position.current.set(0, 0.2, 0);
        velocity.set(
          (Math.random() - 0.5) * 0.2,
          0,
          (Math.random() > 0.5 ? 0.08 : -0.08)
        );
      } else {
        // Wall bounce
        velocity.z *= -1.05;
        position.current.z = Math.sign(position.current.z) * (TABLE_HEIGHT / 2 - PUCK_RADIUS);
      }
    }

    // Friction
    velocity.multiplyScalar(0.995);

    // Keep minimum speed
    if (velocity.length() < 0.05) {
      velocity.normalize().multiplyScalar(0.05);
    }

    meshRef.current.position.copy(position.current);
  });

  return (
    <Cylinder ref={meshRef} args={[PUCK_RADIUS, PUCK_RADIUS, 0.15, 32]} position={[0, 0.2, 0]}>
      <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
    </Cylinder>
  );
};

const Paddle = ({
  isPlayer1,
  puckRef,
}: {
  isPlayer1: boolean;
  puckRef: React.MutableRefObject<THREE.Vector3>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useRef(new THREE.Vector3(0, 0.2, isPlayer1 ? -TABLE_HEIGHT / 2 + 1 : TABLE_HEIGHT / 2 - 1));
  const targetPosition = useRef(new THREE.Vector3(0, 0.2, isPlayer1 ? -TABLE_HEIGHT / 2 + 1 : TABLE_HEIGHT / 2 - 1));

  useFrame(() => {
    if (!meshRef.current) return;

    // AI movement for player 2
    if (!isPlayer1) {
      targetPosition.current.x = puckRef.current.x * 0.8;
      targetPosition.current.z = TABLE_HEIGHT / 2 - 1;
    }

    // Smooth movement
    position.current.lerp(targetPosition.current, 0.1);

    // Bounds
    position.current.x = Math.max(
      -TABLE_WIDTH / 2 + PADDLE_RADIUS,
      Math.min(TABLE_WIDTH / 2 - PADDLE_RADIUS, position.current.x)
    );

    // Collision with puck
    const distance = new THREE.Vector2(
      position.current.x - puckRef.current.x,
      position.current.z - puckRef.current.z
    ).length();

    if (distance < PADDLE_RADIUS + PUCK_RADIUS) {
      // Reflect puck
      const direction = new THREE.Vector2(
        puckRef.current.x - position.current.x,
        puckRef.current.z - position.current.z
      ).normalize();
      
      puckRef.current.x = position.current.x + direction.x * (PADDLE_RADIUS + PUCK_RADIUS + 0.1);
      puckRef.current.z = position.current.z + direction.y * (PADDLE_RADIUS + PUCK_RADIUS + 0.1);
    }

    meshRef.current.position.copy(position.current);
  });

  // Mouse control for player 1
  if (isPlayer1) {
    if (typeof window !== "undefined") {
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        targetPosition.current.x = x * (TABLE_WIDTH / 2);
      };
      window.addEventListener("mousemove", handleMouseMove);
    }
  }

  return (
    <Cylinder
      ref={meshRef}
      args={[PADDLE_RADIUS, PADDLE_RADIUS, 0.2, 32]}
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
      {/* Table surface */}
      <Box args={[TABLE_WIDTH, 0.2, TABLE_HEIGHT]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Center line */}
      <Box args={[TABLE_WIDTH, 0.05, 0.05]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
      </Box>

      {/* Goals */}
      <Box args={[3, 0.3, 0.1]} position={[0, 0.2, -TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.3} />
      </Box>
      <Box args={[3, 0.3, 0.1]} position={[0, 0.2, TABLE_HEIGHT / 2]}>
        <meshStandardMaterial color="#a855f7" transparent opacity={0.3} />
      </Box>

      {/* Walls */}
      <Box args={[0.2, 0.5, TABLE_HEIGHT]} position={[-TABLE_WIDTH / 2, 0.25, 0]}>
        <meshStandardMaterial color="#2a2a3e" />
      </Box>
      <Box args={[0.2, 0.5, TABLE_HEIGHT]} position={[TABLE_WIDTH / 2, 0.25, 0]}>
        <meshStandardMaterial color="#2a2a3e" />
      </Box>
    </group>
  );
};

export const AirHockeyGame = ({ onBack }: AirHockeyGameProps) => {
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [gameKey, setGameKey] = useState(0);
  const puckPositionRef = useRef(new THREE.Vector3(0, 0.2, 0));

  const handleScore = (player: number) => {
    setScore((prev) => {
      const newScore = {
        ...prev,
        [`player${player}`]: prev[`player${player}` as keyof typeof prev] + 1,
      };
      
      toast.success(`Player ${player} scores!`);

      if (newScore.player1 >= 7) {
        toast.success("Player 1 wins the game!");
      } else if (newScore.player2 >= 7) {
        toast.success("Player 2 wins the game!");
      }

      return newScore;
    });
  };

  const handleReset = () => {
    setScore({ player1: 0, player2: 0 });
    setGameKey((prev) => prev + 1);
    toast.info("Game reset!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-4xl font-bold text-gradient">Air Hockey Arena</h1>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="glass p-4 rounded-2xl">
          <div className="flex justify-between mb-4">
            <div className="text-center p-4 glass rounded-xl">
              <div className="text-sm text-muted-foreground">Player 1 (You)</div>
              <div className="text-4xl font-bold text-primary">{score.player1}</div>
            </div>
            <div className="text-center p-4 glass rounded-xl">
              <div className="text-sm text-muted-foreground">Player 2 (AI)</div>
              <div className="text-4xl font-bold text-secondary">{score.player2}</div>
            </div>
          </div>

          <div className="h-[600px] border-2 border-primary/20 rounded-xl overflow-hidden bg-black/50">
            <Canvas key={gameKey} camera={{ position: [0, 12, 0], fov: 50 }}>
              <ambientLight intensity={0.3} />
              <pointLight position={[0, 10, 0]} intensity={1.5} />
              <pointLight position={[5, 5, 5]} intensity={0.5} color="#06b6d4" />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#a855f7" />
              
              <AirHockeyTable />
              <Puck onScore={handleScore} />
              <Paddle isPlayer1={true} puckRef={puckPositionRef} />
              <Paddle isPlayer1={false} puckRef={puckPositionRef} />
              
              <OrbitControls
                enableRotate={false}
                enablePan={false}
                enableZoom={false}
              />
            </Canvas>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Move your mouse to control your paddle (cyan)</p>
            <p>First to 7 points wins!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
