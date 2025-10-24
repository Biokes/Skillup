import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Plane } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"


interface Ball {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  isPocketed: boolean;
  isStripe: boolean;
}

const FRICTION = 0.98;
const TABLE_WIDTH = 12;
const TABLE_HEIGHT = 6;
const BALL_RADIUS = 0.3;
const POCKET_RADIUS = 0.5;

const pockets = [
  new THREE.Vector3(-TABLE_WIDTH / 2, 0, -TABLE_HEIGHT / 2),
  new THREE.Vector3(-TABLE_WIDTH / 2, 0, TABLE_HEIGHT / 2),
  new THREE.Vector3(0, 0, -TABLE_HEIGHT / 2),
  new THREE.Vector3(0, 0, TABLE_HEIGHT / 2),
  new THREE.Vector3(TABLE_WIDTH / 2, 0, -TABLE_HEIGHT / 2),
  new THREE.Vector3(TABLE_WIDTH / 2, 0, TABLE_HEIGHT / 2),
];

const GameBall = ({ ball, onUpdate }: { ball: Ball; onUpdate: (ball: Ball) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || ball.isPocketed) return;

    // Update position
    ball.position.add(ball.velocity);

    // Apply friction
    ball.velocity.multiplyScalar(FRICTION);

    // Stop if velocity is very small
    if (ball.velocity.length() < 0.001) {
      ball.velocity.set(0, 0, 0);
    }

    // Wall collision
    if (Math.abs(ball.position.x) > TABLE_WIDTH / 2 - BALL_RADIUS) {
      ball.velocity.x *= -0.8;
      ball.position.x = Math.sign(ball.position.x) * (TABLE_WIDTH / 2 - BALL_RADIUS);
    }
    if (Math.abs(ball.position.z) > TABLE_HEIGHT / 2 - BALL_RADIUS) {
      ball.velocity.z *= -0.8;
      ball.position.z = Math.sign(ball.position.z) * (TABLE_HEIGHT / 2 - BALL_RADIUS);
    }

    // Check pockets
    pockets.forEach((pocket) => {
      const distance = ball.position.distanceTo(pocket);
      if (distance < POCKET_RADIUS) {
        ball.isPocketed = true;
      }
    });

    meshRef.current.position.copy(ball.position);
    onUpdate(ball);
  });

  if (ball.isPocketed) return null;

  return (
    <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={ball.position.toArray()}>
      <meshStandardMaterial color={ball.color} metalness={0.3} roughness={0.4} />
    </Sphere>
  );
};

const CueBall = ({
  position,
  velocity,
  onUpdate,
  isPocketed,
}: {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  onUpdate: (pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => void;
  isPocketed: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || isPocketed) return;

    position.add(velocity);
    velocity.multiplyScalar(FRICTION);

    if (velocity.length() < 0.001) {
      velocity.set(0, 0, 0);
    }

    if (Math.abs(position.x) > TABLE_WIDTH / 2 - BALL_RADIUS) {
      velocity.x *= -0.8;
      position.x = Math.sign(position.x) * (TABLE_WIDTH / 2 - BALL_RADIUS);
    }
    if (Math.abs(position.z) > TABLE_HEIGHT / 2 - BALL_RADIUS) {
      velocity.z *= -0.8;
      position.z = Math.sign(position.z) * (TABLE_HEIGHT / 2 - BALL_RADIUS);
    }

    let pocketed = false;
    pockets.forEach((pocket) => {
      const distance = position.distanceTo(pocket);
      if (distance < POCKET_RADIUS) {
        pocketed = true;
      }
    });

    meshRef.current.position.copy(position);
    onUpdate(position, velocity, pocketed);
  });

  if (isPocketed) return null;

  return (
    <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={position.toArray()}>
      <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
    </Sphere>
  );
};

const PoolTable = () => {
  return (
    <group>
      {/* Table surface */}
      <Plane args={[TABLE_WIDTH, TABLE_HEIGHT]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#0a5f38" roughness={0.8} />
      </Plane>

      {/* Rails */}
      <Box args={[TABLE_WIDTH + 1, 0.5, 0.3]} position={[0, 0.15, -TABLE_HEIGHT / 2 - 0.15]}>
        <meshStandardMaterial color="#4a2511" />
      </Box>
      <Box args={[TABLE_WIDTH + 1, 0.5, 0.3]} position={[0, 0.15, TABLE_HEIGHT / 2 + 0.15]}>
        <meshStandardMaterial color="#4a2511" />
      </Box>
      <Box args={[0.3, 0.5, TABLE_HEIGHT]} position={[-TABLE_WIDTH / 2 - 0.15, 0.15, 0]}>
        <meshStandardMaterial color="#4a2511" />
      </Box>
      <Box args={[0.3, 0.5, TABLE_HEIGHT]} position={[TABLE_WIDTH / 2 + 0.15, 0.15, 0]}>
        <meshStandardMaterial color="#4a2511" />
      </Box>

      {/* Pockets */}
      {pockets.map((pocket, i) => (
        <Sphere key={i} args={[POCKET_RADIUS, 16, 16]} position={pocket.toArray()}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
      ))}
    </group>
  );
};

export const PoolGame = () => {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [cueBallPos, setCueBallPos] = useState(new THREE.Vector3(-4, 0, 0));
  const [cueBallVel, setCueBallVel] = useState(new THREE.Vector3(0, 0, 0));
  const [cueBallPocketed, setCueBallPocketed] = useState(false);
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const navigate = useNavigate()

  useEffect(() => {
    initializeBalls();
  }, []);

  const initializeBalls = () => {
    const newBalls: Ball[] = [];
    const startX = 3;
    const startZ = 0;
    const colors = ["#ff0000", "#0000ff", "#ffff00", "#ff00ff", "#00ff00", "#ff8800", "#8800ff"];

    // Rack the balls in a triangle
    let ballId = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        if (ballId < 7) {
          newBalls.push({
            id: ballId,
            position: new THREE.Vector3(
              startX + row * BALL_RADIUS * 2,
              0,
              startZ + (col - row / 2) * BALL_RADIUS * 2
            ),
            velocity: new THREE.Vector3(0, 0, 0),
            color: colors[ballId],
            isPocketed: false,
            isStripe: ballId % 2 === 0,
          });
          ballId++;
        }
      }
    }

    setBalls(newBalls);
    setCueBallPos(new THREE.Vector3(-4, 0, 0));
    setCueBallVel(new THREE.Vector3(0, 0, 0));
    setCueBallPocketed(false);
  };

  const handleShoot = () => {
    if (cueBallVel.length() > 0.01) {
      toast.error("Wait for balls to stop!");
      return;
    }

    const force = power / 20;
    const rad = (angle * Math.PI) / 180;
    const newVel = new THREE.Vector3(Math.cos(rad) * force, 0, Math.sin(rad) * force);
    setCueBallVel(newVel);
    setPower(0);
    toast.success(`Player ${currentPlayer} shoots!`);
  };

  const handleReset = () => {
    initializeBalls();
    setScore({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setPower(0);
    setAngle(0);
  };

  const updateBall = (updatedBall: Ball) => {
    setBalls((prev) => {
      const newBalls = prev.map((b) => (b.id === updatedBall.id ? updatedBall : b));
      
      // Check collisions between balls
      for (let i = 0; i < newBalls.length; i++) {
        if (newBalls[i].isPocketed) continue;
        
        // Check collision with cue ball
        const distance = newBalls[i].position.distanceTo(cueBallPos);
        if (distance < BALL_RADIUS * 2 && !cueBallPocketed) {
          const normal = new THREE.Vector3()
            .subVectors(newBalls[i].position, cueBallPos)
            .normalize();
          
          const relativeVel = new THREE.Vector3().subVectors(cueBallVel, newBalls[i].velocity);
          const speed = relativeVel.dot(normal);
          
          if (speed < 0) continue;
          
          const impulse = normal.multiplyScalar(speed * 0.8);
          newBalls[i].velocity.add(impulse);
          cueBallVel.sub(impulse);
        }

        // Check ball-to-ball collisions
        for (let j = i + 1; j < newBalls.length; j++) {
          if (newBalls[j].isPocketed) continue;
          
          const dist = newBalls[i].position.distanceTo(newBalls[j].position);
          if (dist < BALL_RADIUS * 2) {
            const normal = new THREE.Vector3()
              .subVectors(newBalls[j].position, newBalls[i].position)
              .normalize();
            
            const relativeVel = new THREE.Vector3().subVectors(
              newBalls[i].velocity,
              newBalls[j].velocity
            );
            const speed = relativeVel.dot(normal);
            
            if (speed < 0) continue;
            
            const impulse = normal.multiplyScalar(speed * 0.5);
            newBalls[i].velocity.sub(impulse);
            newBalls[j].velocity.add(impulse);
          }
        }
      }

      // Check for pocketed balls and update score
      newBalls.forEach((ball) => {
        if (ball.isPocketed && !prev.find((b) => b.id === ball.id)?.isPocketed) {
          setScore((s) => ({
            ...s,
            [`player${currentPlayer}`]: s[`player${currentPlayer}` as keyof typeof s] + 1,
          }));
          toast.success(`Player ${currentPlayer} pocketed a ball!`);
        }
      });

      return newBalls;
    });
  };

  const updateCueBall = (pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => {
    setCueBallPos(pos);
    setCueBallVel(vel);
    
    if (pocketed && !cueBallPocketed) {
      setCueBallPocketed(true);
      toast.error(`Player ${currentPlayer} scratched!`);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };
  

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <Button  onClick={()=>navigate('/hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-4xl font-bold text-gradient">Pool Arena</h1>
          <Button onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="glass p-4 rounded-2xl">
          <div className="flex justify-between mb-4">
            <div className={`text-center p-4 rounded-xl ${currentPlayer === 1 ? "glass border-2 border-primary" : ""}`}>
              <div className="text-sm text-muted-foreground">Player 1</div>
              <div className="text-3xl font-bold text-primary">{score.player1}</div>
            </div>
            <div className={`text-center p-4 rounded-xl ${currentPlayer === 2 ? "glass border-2 border-secondary" : ""}`}>
              <div className="text-sm text-muted-foreground">Player 2</div>
              <div className="text-3xl font-bold text-secondary">{score.player2}</div>
            </div>
          </div>

          <div className="h-[500px] border-2 border-primary/20 rounded-xl overflow-hidden bg-black/50">
            <Canvas camera={{ position: [0, 15, 0], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, 10, -10]} intensity={1} />
              
              <PoolTable />
              <CueBall
                position={cueBallPos}
                velocity={cueBallVel}
                onUpdate={updateCueBall}
                isPocketed={cueBallPocketed}
              />
              {balls.map((ball) => (
                <GameBall key={ball.id} ball={ball} onUpdate={updateBall} />
              ))}
              
              <OrbitControls maxPolarAngle={Math.PI / 2.5} minDistance={8} maxDistance={25} />
            </Canvas>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Power: {power}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Angle: {angle}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleShoot}>
              Shoot (Player {currentPlayer})
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
