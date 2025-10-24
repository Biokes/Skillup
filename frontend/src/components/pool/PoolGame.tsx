// // import { useState, useRef, useEffect } from "react";
// // import { Canvas, useFrame } from "@react-three/fiber";
// // import { OrbitControls, Box, Sphere, Plane } from "@react-three/drei";
// // import { Button } from "@/components/ui/button";
// // import { ArrowLeft, RotateCcw } from "lucide-react";
// // import { motion } from "framer-motion";
// // import * as THREE from "three";
// // import { toast } from "sonner";
// // import { useNavigate } from "react-router-dom"


// // interface Ball {
// //   id: number;
// //   position: THREE.Vector3;
// //   velocity: THREE.Vector3;
// //   color: string;
// //   isPocketed: boolean;
// //   isStripe: boolean;
// // }

// // const FRICTION = 0.98;
// // const TABLE_WIDTH = 12;
// // const TABLE_HEIGHT = 6;
// // const BALL_RADIUS = 0.3;
// // const POCKET_RADIUS = 0.5;

// // const pockets = [
// //   new THREE.Vector3(-TABLE_WIDTH / 2, 0, -TABLE_HEIGHT / 2),
// //   new THREE.Vector3(-TABLE_WIDTH / 2, 0, TABLE_HEIGHT / 2),
// //   new THREE.Vector3(0, 0, -TABLE_HEIGHT / 2),
// //   new THREE.Vector3(0, 0, TABLE_HEIGHT / 2),
// //   new THREE.Vector3(TABLE_WIDTH / 2, 0, -TABLE_HEIGHT / 2),
// //   new THREE.Vector3(TABLE_WIDTH / 2, 0, TABLE_HEIGHT / 2),
// // ];

// // const GameBall = ({ ball, onUpdate }: { ball: Ball; onUpdate: (ball: Ball) => void }) => {
// //   const meshRef = useRef<THREE.Mesh>(null);

// //   useFrame(() => {
// //     if (!meshRef.current || ball.isPocketed) return;

// //     // Update position
// //     ball.position.add(ball.velocity);

// //     // Apply friction
// //     ball.velocity.multiplyScalar(FRICTION);

// //     // Stop if velocity is very small
// //     if (ball.velocity.length() < 0.001) {
// //       ball.velocity.set(0, 0, 0);
// //     }

// //     // Wall collision
// //     if (Math.abs(ball.position.x) > TABLE_WIDTH / 2 - BALL_RADIUS) {
// //       ball.velocity.x *= -0.8;
// //       ball.position.x = Math.sign(ball.position.x) * (TABLE_WIDTH / 2 - BALL_RADIUS);
// //     }
// //     if (Math.abs(ball.position.z) > TABLE_HEIGHT / 2 - BALL_RADIUS) {
// //       ball.velocity.z *= -0.8;
// //       ball.position.z = Math.sign(ball.position.z) * (TABLE_HEIGHT / 2 - BALL_RADIUS);
// //     }

// //     // Check pockets
// //     pockets.forEach((pocket) => {
// //       const distance = ball.position.distanceTo(pocket);
// //       if (distance < POCKET_RADIUS) {
// //         ball.isPocketed = true;
// //       }
// //     });

// //     meshRef.current.position.copy(ball.position);
// //     onUpdate(ball);
// //   });

// //   if (ball.isPocketed) return null;

// //   return (
// //     <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={ball.position.toArray()}>
// //       <meshStandardMaterial color={ball.color} metalness={0.3} roughness={0.4} />
// //     </Sphere>
// //   );
// // };

// // const CueBall = ({
// //   position,
// //   velocity,
// //   onUpdate,
// //   isPocketed,
// // }: {
// //   position: THREE.Vector3;
// //   velocity: THREE.Vector3;
// //   onUpdate: (pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => void;
// //   isPocketed: boolean;
// // }) => {
// //   const meshRef = useRef<THREE.Mesh>(null);

// //   useFrame(() => {
// //     if (!meshRef.current || isPocketed) return;

// //     position.add(velocity);
// //     velocity.multiplyScalar(FRICTION);

// //     if (velocity.length() < 0.001) {
// //       velocity.set(0, 0, 0);
// //     }

// //     if (Math.abs(position.x) > TABLE_WIDTH / 2 - BALL_RADIUS) {
// //       velocity.x *= -0.8;
// //       position.x = Math.sign(position.x) * (TABLE_WIDTH / 2 - BALL_RADIUS);
// //     }
// //     if (Math.abs(position.z) > TABLE_HEIGHT / 2 - BALL_RADIUS) {
// //       velocity.z *= -0.8;
// //       position.z = Math.sign(position.z) * (TABLE_HEIGHT / 2 - BALL_RADIUS);
// //     }

// //     let pocketed = false;
// //     pockets.forEach((pocket) => {
// //       const distance = position.distanceTo(pocket);
// //       if (distance < POCKET_RADIUS) {
// //         pocketed = true;
// //       }
// //     });

// //     meshRef.current.position.copy(position);
// //     onUpdate(position, velocity, pocketed);
// //   });

// //   if (isPocketed) return null;

// //   return (
// //     <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={position.toArray()}>
// //       <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
// //     </Sphere>
// //   );
// // };

// // const PoolTable = () => {
// //   return (
// //     <group>
// //       {/* Table surface */}
// //       <Plane args={[TABLE_WIDTH, TABLE_HEIGHT]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
// //         <meshStandardMaterial color="#0a5f38" roughness={0.8} />
// //       </Plane>

// //       {/* Rails */}
// //       <Box args={[TABLE_WIDTH + 1, 0.5, 0.3]} position={[0, 0.15, -TABLE_HEIGHT / 2 - 0.15]}>
// //         <meshStandardMaterial color="#4a2511" />
// //       </Box>
// //       <Box args={[TABLE_WIDTH + 1, 0.5, 0.3]} position={[0, 0.15, TABLE_HEIGHT / 2 + 0.15]}>
// //         <meshStandardMaterial color="#4a2511" />
// //       </Box>
// //       <Box args={[0.3, 0.5, TABLE_HEIGHT]} position={[-TABLE_WIDTH / 2 - 0.15, 0.15, 0]}>
// //         <meshStandardMaterial color="#4a2511" />
// //       </Box>
// //       <Box args={[0.3, 0.5, TABLE_HEIGHT]} position={[TABLE_WIDTH / 2 + 0.15, 0.15, 0]}>
// //         <meshStandardMaterial color="#4a2511" />
// //       </Box>

// //       {/* Pockets */}
// //       {pockets.map((pocket, i) => (
// //         <Sphere key={i} args={[POCKET_RADIUS, 16, 16]} position={pocket.toArray()}>
// //           <meshStandardMaterial color="#000000" />
// //         </Sphere>
// //       ))}
// //     </group>
// //   );
// // };

// // export const PoolGame = () => {
// //   const [balls, setBalls] = useState<Ball[]>([]);
// //   const [cueBallPos, setCueBallPos] = useState(new THREE.Vector3(-4, 0, 0));
// //   const [cueBallVel, setCueBallVel] = useState(new THREE.Vector3(0, 0, 0));
// //   const [cueBallPocketed, setCueBallPocketed] = useState(false);
// //   const [power, setPower] = useState(0);
// //   const [angle, setAngle] = useState(0);
// //   const [score, setScore] = useState({ player1: 0, player2: 0 });
// //   const [currentPlayer, setCurrentPlayer] = useState(1);
// //   const navigate = useNavigate()

// //   useEffect(() => {
// //     initializeBalls();
// //   }, []);

// //   const initializeBalls = () => {
// //     const newBalls: Ball[] = [];
// //     const startX = 3;
// //     const startZ = 0;
// //     const colors = ["#ff0000", "#0000ff", "#ffff00", "#ff00ff", "#00ff00", "#ff8800", "#8800ff"];

// //     // Rack the balls in a triangle
// //     let ballId = 0;
// //     for (let row = 0; row < 5; row++) {
// //       for (let col = 0; col <= row; col++) {
// //         if (ballId < 7) {
// //           newBalls.push({
// //             id: ballId,
// //             position: new THREE.Vector3(
// //               startX + row * BALL_RADIUS * 2,
// //               0,
// //               startZ + (col - row / 2) * BALL_RADIUS * 2
// //             ),
// //             velocity: new THREE.Vector3(0, 0, 0),
// //             color: colors[ballId],
// //             isPocketed: false,
// //             isStripe: ballId % 2 === 0,
// //           });
// //           ballId++;
// //         }
// //       }
// //     }

// //     setBalls(newBalls);
// //     setCueBallPos(new THREE.Vector3(-4, 0, 0));
// //     setCueBallVel(new THREE.Vector3(0, 0, 0));
// //     setCueBallPocketed(false);
// //   };

// //   const handleShoot = () => {
// //     if (cueBallVel.length() > 0.01) {
// //       toast.error("Wait for balls to stop!");
// //       return;
// //     }

// //     const force = power / 20;
// //     const rad = (angle * Math.PI) / 180;
// //     const newVel = new THREE.Vector3(Math.cos(rad) * force, 0, Math.sin(rad) * force);
// //     setCueBallVel(newVel);
// //     setPower(0);
// //     toast.success(`Player ${currentPlayer} shoots!`);
// //   };

// //   const handleReset = () => {
// //     initializeBalls();
// //     setScore({ player1: 0, player2: 0 });
// //     setCurrentPlayer(1);
// //     setPower(0);
// //     setAngle(0);
// //   };

// //   const updateBall = (updatedBall: Ball) => {
// //     setBalls((prev) => {
// //       const newBalls = prev.map((b) => (b.id === updatedBall.id ? updatedBall : b));
      
// //       // Check collisions between balls
// //       for (let i = 0; i < newBalls.length; i++) {
// //         if (newBalls[i].isPocketed) continue;
        
// //         // Check collision with cue ball
// //         const distance = newBalls[i].position.distanceTo(cueBallPos);
// //         if (distance < BALL_RADIUS * 2 && !cueBallPocketed) {
// //           const normal = new THREE.Vector3()
// //             .subVectors(newBalls[i].position, cueBallPos)
// //             .normalize();
          
// //           const relativeVel = new THREE.Vector3().subVectors(cueBallVel, newBalls[i].velocity);
// //           const speed = relativeVel.dot(normal);
          
// //           if (speed < 0) continue;
          
// //           const impulse = normal.multiplyScalar(speed * 0.8);
// //           newBalls[i].velocity.add(impulse);
// //           cueBallVel.sub(impulse);
// //         }

// //         // Check ball-to-ball collisions
// //         for (let j = i + 1; j < newBalls.length; j++) {
// //           if (newBalls[j].isPocketed) continue;
          
// //           const dist = newBalls[i].position.distanceTo(newBalls[j].position);
// //           if (dist < BALL_RADIUS * 2) {
// //             const normal = new THREE.Vector3()
// //               .subVectors(newBalls[j].position, newBalls[i].position)
// //               .normalize();
            
// //             const relativeVel = new THREE.Vector3().subVectors(
// //               newBalls[i].velocity,
// //               newBalls[j].velocity
// //             );
// //             const speed = relativeVel.dot(normal);
            
// //             if (speed < 0) continue;
            
// //             const impulse = normal.multiplyScalar(speed * 0.5);
// //             newBalls[i].velocity.sub(impulse);
// //             newBalls[j].velocity.add(impulse);
// //           }
// //         }
// //       }

// //       // Check for pocketed balls and update score
// //       newBalls.forEach((ball) => {
// //         if (ball.isPocketed && !prev.find((b) => b.id === ball.id)?.isPocketed) {
// //           setScore((s) => ({
// //             ...s,
// //             [`player${currentPlayer}`]: s[`player${currentPlayer}` as keyof typeof s] + 1,
// //           }));
// //           toast.success(`Player ${currentPlayer} pocketed a ball!`);
// //         }
// //       });

// //       return newBalls;
// //     });
// //   };

// //   const updateCueBall = (pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => {
// //     setCueBallPos(pos);
// //     setCueBallVel(vel);
    
// //     if (pocketed && !cueBallPocketed) {
// //       setCueBallPocketed(true);
// //       toast.error(`Player ${currentPlayer} scratched!`);
// //       setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
// //     }
// //   };


// //   return (
// //     <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
// //       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl space-y-4">
// //         <div className="flex items-center justify-between">
// //           <Button  onClick={()=>navigate('/hub')}>
// //             <ArrowLeft className="mr-2 h-4 w-4" />
// //             Back to Hub
// //           </Button>
// //           <h1 className="text-4xl font-bold text-gradient">Pool Arena</h1>
// //           <Button onClick={handleReset}>
// //             <RotateCcw className="mr-2 h-4 w-4" />
// //             Reset
// //           </Button>
// //         </div>

// //         <div className="glass p-4 rounded-2xl">
// //           <div className="flex justify-between mb-4">
// //             <div className={`text-center p-4 rounded-xl ${currentPlayer === 1 ? "glass border-2 border-primary" : ""}`}>
// //               <div className="text-sm text-muted-foreground">Player 1</div>
// //               <div className="text-3xl font-bold text-primary">{score.player1}</div>
// //             </div>
// //             <div className={`text-center p-4 rounded-xl ${currentPlayer === 2 ? "glass border-2 border-secondary" : ""}`}>
// //               <div className="text-sm text-muted-foreground">Player 2</div>
// //               <div className="text-3xl font-bold text-secondary">{score.player2}</div>
// //             </div>
// //           </div>

// //           <div className="h-[500px] border-2 border-primary/20 rounded-xl overflow-hidden bg-black/50">
// //             <Canvas camera={{ position: [0, 15, 0], fov: 50 }}>
// //               <ambientLight intensity={0.5} />
// //               <pointLight position={[10, 10, 10]} intensity={1} />
// //               <pointLight position={[-10, 10, -10]} intensity={1} />
              
// //               <PoolTable />
// //               <CueBall
// //                 position={cueBallPos}
// //                 velocity={cueBallVel}
// //                 onUpdate={updateCueBall}
// //                 isPocketed={cueBallPocketed}
// //               />
// //               {balls.map((ball) => (
// //                 <GameBall key={ball.id} ball={ball} onUpdate={updateBall} />
// //               ))}
              
// //               <OrbitControls maxPolarAngle={Math.PI / 2.5} minDistance={8} maxDistance={25} />
// //             </Canvas>
// //           </div>

// //           <div className="mt-4 space-y-4">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <label className="text-sm text-muted-foreground mb-2 block">Power: {power}%</label>
// //                 <input
// //                   type="range"
// //                   min="0"
// //                   max="100"
// //                   value={power}
// //                   onChange={(e) => setPower(Number(e.target.value))}
// //                   className="w-full"
// //                 />
// //               </div>
// //               <div>
// //                 <label className="text-sm text-muted-foreground mb-2 block">Angle: {angle}°</label>
// //                 <input
// //                   type="range"
// //                   min="0"
// //                   max="360"
// //                   value={angle}
// //                   onChange={(e) => setAngle(Number(e.target.value))}
// //                   className="w-full"
// //                 />
// //               </div>
// //             </div>
// //             <Button className="w-full" onClick={handleShoot}>
// //               Shoot (Player {currentPlayer})
// //             </Button>
// //           </div>
// //         </div>
// //       </motion.div>
// //     </div>
// //   );
// // };


// import { useState, useRef, useEffect, useMemo, useCallback } from "react";
// import { Canvas, useFrame, useLoader } from "@react-three/fiber";
// import { OrbitControls, Box, Sphere, Plane, Cylinder, Torus } from "@react-three/drei";
// import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
// import { ArrowLeft, RotateCcw, Volume2, VolumeX } from "lucide-react";
// import { motion } from "framer-motion";
// import * as THREE from "three";
// import { toast } from "sonner"; // Assuming sonner for toasts
// import { useNavigate } from "react-router-dom";
// import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
// import { KernelSize, ToneMappingMode } from "postprocessing";

// // Utility for CSG operations (for pockets)
// import { CSG } from "three-bvh-csg";

// // --- Game Constants (unchanged functionality) ---
// interface Ball {
//   id: number;
//   position: THREE.Vector3;
//   velocity: THREE.Vector3;
//   color: string;
//   isPocketed: boolean;
//   isStripe: boolean;
// }

// const FRICTION = 0.98;
// const TABLE_WIDTH = 12;
// const TABLE_HEIGHT = 6;
// const BALL_RADIUS = 0.3;
// const POCKET_RADIUS = 0.5; // Adjusted slightly for visual pocket size

// const pockets = [
//   new THREE.Vector3(-TABLE_WIDTH / 2 - 0.1, -0.1, -TABLE_HEIGHT / 2 - 0.1), // Corner
//   new THREE.Vector3(-TABLE_WIDTH / 2 - 0.1, -0.1, TABLE_HEIGHT / 2 + 0.1),  // Corner
//   new THREE.Vector3(0, -0.1, -TABLE_HEIGHT / 2 - 0.1),                     // Middle
//   new THREE.Vector3(0, -0.1, TABLE_HEIGHT / 2 + 0.1),                      // Middle
//   new THREE.Vector3(TABLE_WIDTH / 2 + 0.1, -0.1, -TABLE_HEIGHT / 2 - 0.1), // Corner
//   new THREE.Vector3(TABLE_WIDTH / 2 + 0.1, -0.1, TABLE_HEIGHT / 2 + 0.1),  // Corner
// ];

// // --- Audio Assets (for immersive feel) ---
// // You'll need to place these in your public folder
// // e.g., public/audio/hit.mp3, public/audio/pocket.mp3
// const hitSound = new Audio('/audio/hit.mp3');
// const pocketSound = new Audio('/audio/pocket.mp3');
// hitSound.volume = 0.2;
// pocketSound.volume = 0.5;

// // --- Components (Visual Enhancements) ---

// const GameBall = ({ ball, onUpdate }: { ball: Ball; onUpdate: (ball: Ball) => void }) => {
//   const meshRef = useRef<THREE.Mesh>(null);

//   // Use a canvas texture for stripes
//   const stripeTexture = useMemo(() => {
//     if (!ball.isStripe || ball.id === 0) return null; // Cue ball is solid white, ignore stripe for it.
    
//     const canvas = document.createElement('canvas');
//     canvas.width = 256;
//     canvas.height = 256;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       // Base color
//       ctx.fillStyle = ball.color;
//       ctx.fillRect(0, 0, 256, 256);
      
//       // White stripe
//       ctx.fillStyle = 'white';
//       ctx.fillRect(0, 100, 256, 56); // A central stripe

//       // Add ball number in the stripe
//       ctx.font = 'bold 80px Arial';
//       ctx.textAlign = 'center';
//       ctx.textBaseline = 'middle';
//       ctx.fillStyle = 'black';
//       ctx.fillText(ball.id.toString(), 128, 128);
//     }
//     return new THREE.CanvasTexture(canvas);
//   }, [ball.id, ball.color, ball.isStripe]);

//   useFrame(() => {
//     if (!meshRef.current || ball.isPocketed) return;

//     // Original game logic for position and velocity update
//     ball.position.add(ball.velocity);
//     ball.velocity.multiplyScalar(FRICTION);

//     if (ball.velocity.length() < 0.001) {
//       ball.velocity.set(0, 0, 0);
//     }

//     // Wall collision
//     const halfTableWidth = TABLE_WIDTH / 2;
//     const halfTableHeight = TABLE_HEIGHT / 2;
//     const ballMinX = -halfTableWidth + BALL_RADIUS;
//     const ballMaxX = halfTableWidth - BALL_RADIUS;
//     const ballMinZ = -halfTableHeight + BALL_RADIUS;
//     const ballMaxZ = halfTableHeight - BALL_RADIUS;

//     if (ball.position.x < ballMinX || ball.position.x > ballMaxX) {
//       ball.velocity.x *= -0.8;
//       ball.position.x = Math.sign(ball.position.x) * (halfTableWidth - BALL_RADIUS);
//       // hitSound.currentTime = 0; hitSound.play(); // Play sound
//     }
//     if (ball.position.z < ballMinZ || ball.position.z > ballMaxZ) {
//       ball.velocity.z *= -0.8;
//       ball.position.z = Math.sign(ball.position.z) * (halfTableHeight - BALL_RADIUS);
//       // hitSound.currentTime = 0; hitSound.play(); // Play sound
//     }

//     // Check pockets (slightly adjusted pocket areas for visual alignment)
//     const effectivePockets = [
//         new THREE.Vector3(-halfTableWidth - 0.1, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(-halfTableWidth - 0.1, 0, halfTableHeight + 0.1),
//         new THREE.Vector3(0, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(0, 0, halfTableHeight + 0.1),
//         new THREE.Vector3(halfTableWidth + 0.1, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(halfTableWidth + 0.1, 0, halfTableHeight + 0.1),
//     ];
    
//     effectivePockets.forEach((pocket) => {
//         const distance = ball.position.distanceTo(pocket);
//         if (distance < POCKET_RADIUS * 0.8) { // Make pocket radius slightly smaller than visual for cleaner physics
//             ball.isPocketed = true;
//             pocketSound.currentTime = 0; pocketSound.play(); // Play pocket sound
//         }
//     });


//     meshRef.current.position.copy(ball.position);
//     onUpdate(ball);
//   });

//   if (ball.isPocketed) return null;

//   // Visual enhancements for balls: more reflective, optional stripe texture
//   return (
//     <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={ball.position.toArray()}>
//       <meshPhysicalMaterial
//         color={ball.isStripe && ball.id !== 0 ? "#ffffff" : ball.color} // Base white for stripe balls
//         map={ball.isStripe && ball.id !== 0 ? stripeTexture : null} // Apply stripe texture
//         clearcoat={1}
//         clearcoatRoughness={0.1}
//         roughness={0.2}
//         metalness={0.1}
//       >
//         {/* Draw color circle for solid balls, or base for stripe */}
//         {!(ball.isStripe && ball.id !== 0) && <color attach="color" args={[ball.color]} />}
//       </meshPhysicalMaterial>
//     </Sphere>
//   );
// };

// const CueBall = ({
//   position,
//   velocity,
//   onUpdate,
//   isPocketed,
// }: {
//   position: THREE.Vector3;
//   velocity: THREE.Vector3;
//   onUpdate: (pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => void;
//   isPocketed: boolean;
// }) => {
//   const meshRef = useRef<THREE.Mesh>(null);

//   useFrame(() => {
//     if (!meshRef.current || isPocketed) return;

//     // Original game logic for position and velocity update
//     position.add(velocity);
//     velocity.multiplyScalar(FRICTION);

//     if (velocity.length() < 0.001) {
//       velocity.set(0, 0, 0);
//     }

//     const halfTableWidth = TABLE_WIDTH / 2;
//     const halfTableHeight = TABLE_HEIGHT / 2;
//     const ballMinX = -halfTableWidth + BALL_RADIUS;
//     const ballMaxX = halfTableWidth - BALL_RADIUS;
//     const ballMinZ = -halfTableHeight + BALL_RADIUS;
//     const ballMaxZ = halfTableHeight - BALL_RADIUS;

//     if (position.x < ballMinX || position.x > ballMaxX) {
//       velocity.x *= -0.8;
//       position.x = Math.sign(position.x) * (halfTableWidth - BALL_RADIUS);
//       // hitSound.currentTime = 0; hitSound.play(); // Play sound
//     }
//     if (position.z < ballMinZ || position.z > ballMaxZ) {
//       velocity.z *= -0.8;
//       position.z = Math.sign(position.z) * (halfTableHeight - BALL_RADIUS);
//       // hitSound.currentTime = 0; hitSound.play(); // Play sound
//     }

//     let pocketed = false;
//     const effectivePockets = [
//         new THREE.Vector3(-halfTableWidth - 0.1, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(-halfTableWidth - 0.1, 0, halfTableHeight + 0.1),
//         new THREE.Vector3(0, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(0, 0, halfTableHeight + 0.1),
//         new THREE.Vector3(halfTableWidth + 0.1, 0, -halfTableHeight - 0.1),
//         new THREE.Vector3(halfTableWidth + 0.1, 0, halfTableHeight + 0.1),
//     ];
    
//     effectivePockets.forEach((pocket) => {
//         const distance = position.distanceTo(pocket);
//         if (distance < POCKET_RADIUS * 0.8) {
//             pocketed = true;
//             pocketSound.currentTime = 0; pocketSound.play(); // Play pocket sound
//         }
//     });

//     meshRef.current.position.copy(position);
//     onUpdate(position, velocity, pocketed);
//   });

//   if (isPocketed) return null;

//   return (
//     <Sphere ref={meshRef} args={[BALL_RADIUS, 32, 32]} position={position.toArray()}>
//       <meshPhysicalMaterial
//         color="#ffffff" // White cue ball
//         clearcoat={1}
//         clearcoatRoughness={0.1}
//         roughness={0.2}
//         metalness={0.1}
//       />
//     </Sphere>
//   );
// };

// const PoolTable = () => {
//   // Procedural Felt Texture
//   const feltTexture = useMemo(() => {
//     const canvas = document.createElement('canvas');
//     canvas.width = 1024;
//     canvas.height = 1024;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.fillStyle = '#0a5f38'; // Dark green felt
//       ctx.fillRect(0, 0, canvas.width, canvas.height);
//       // Add subtle noise for felt texture
//       for (let i = 0; i < 5000; i++) {
//         const x = Math.random() * canvas.width;
//         const y = Math.random() * canvas.height;
//         const alpha = Math.random() * 0.1 + 0.05;
//         ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
//         ctx.fillRect(x, y, 1, 1);
//       }
//     }
//     return new THREE.CanvasTexture(canvas);
//   }, []);

//   // Procedural Wood Texture for rails
//   const woodTexture = useMemo(() => {
//     const canvas = document.createElement('canvas');
//     canvas.width = 512;
//     canvas.height = 512;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.fillStyle = '#4a2511'; // Dark wood
//       ctx.fillRect(0, 0, canvas.width, canvas.height);
//       // Add some grain
//       for (let i = 0; i < 2000; i++) {
//         const x = Math.random() * canvas.width;
//         const y = Math.random() * canvas.height;
//         const length = Math.random() * 20 + 5;
//         const angle = Math.random() * Math.PI * 2;
//         const alpha = Math.random() * 0.2 + 0.1;
//         ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
//         ctx.lineWidth = Math.random() * 1 + 0.5;
//         ctx.beginPath();
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
//         ctx.stroke();
//       }
//     }
//     return new THREE.CanvasTexture(canvas);
//   }, []);


//   const railThickness = 0.3; // Thickness of the wooden rails
//   const railHeight = 0.5;    // Height of the wooden rails
//   const tableEdgeOffset = 0.1; // Offset of rails from table edge

//   return (
//     <group>
//       {/* Table surface (Felt) */}
//       <Plane args={[TABLE_WIDTH, TABLE_HEIGHT]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
//         <meshStandardMaterial map={feltTexture} roughness={0.8} />
//       </Plane>

//       {/* Rails */}
//       {/* Top Rail */}
//       <Box args={[TABLE_WIDTH + railThickness * 2, railHeight, railThickness]} position={[0, 0.1, -TABLE_HEIGHT / 2 - tableEdgeOffset - railThickness / 2]}>
//         <meshStandardMaterial map={woodTexture} roughness={0.6} metalness={0.1} />
//       </Box>
//       {/* Bottom Rail */}
//       <Box args={[TABLE_WIDTH + railThickness * 2, railHeight, railThickness]} position={[0, 0.1, TABLE_HEIGHT / 2 + tableEdgeOffset + railThickness / 2]}>
//         <meshStandardMaterial map={woodTexture} roughness={0.6} metalness={0.1} />
//       </Box>
//       {/* Left Rail */}
//       <Box args={[railThickness, railHeight, TABLE_HEIGHT]} position={[-TABLE_WIDTH / 2 - tableEdgeOffset - railThickness / 2, 0.1, 0]}>
//         <meshStandardMaterial map={woodTexture} roughness={0.6} metalness={0.1} />
//       </Box>
//       {/* Right Rail */}
//       <Box args={[railThickness, railHeight, TABLE_HEIGHT]} position={[TABLE_WIDTH / 2 + tableEdgeOffset + railThickness / 2, 0.1, 0]}>
//         <meshStandardMaterial map={woodTexture} roughness={0.6} metalness={0.1} />
//       </Box>

//       {/* Table Legs (simplified) */}
//       <Box args={[0.5, 2, 0.5]} position={[-TABLE_WIDTH / 2 - 0.5, -1.2, -TABLE_HEIGHT / 2 - 0.5]}>
//         <meshStandardMaterial map={woodTexture} />
//       </Box>
//       <Box args={[0.5, 2, 0.5]} position={[TABLE_WIDTH / 2 + 0.5, -1.2, -TABLE_HEIGHT / 2 - 0.5]}>
//         <meshStandardMaterial map={woodTexture} />
//       </Box>
//       <Box args={[0.5, 2, 0.5]} position={[-TABLE_WIDTH / 2 - 0.5, -1.2, TABLE_HEIGHT / 2 + 0.5]}>
//         <meshStandardMaterial map={woodTexture} />
//       </Box>
//       <Box args={[0.5, 2, 0.5]} position={[TABLE_WIDTH / 2 + 0.5, -1.2, TABLE_HEIGHT / 2 + 0.5]}>
//         <meshStandardMaterial map={woodTexture} />
//       </Box>

//       {/* Pockets (more visually appealing) */}
//       {pockets.map((pocket, i) => (
//         <group key={i}>
//           {/* Main pocket hole */}
//           <Cylinder args={[POCKET_RADIUS, POCKET_RADIUS, 0.2, 32]} rotation={[Math.PI / 2, 0, 0]} position={pocket.toArray()}>
//             <meshStandardMaterial color="#000000" />
//           </Cylinder>
//           {/* Rim for pocket (optional) */}
//           <Torus args={[POCKET_RADIUS + 0.05, 0.05, 16, 32]} rotation={[Math.PI / 2, 0, 0]} position={[pocket.x, pocket.y + 0.1, pocket.z]}>
//             <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
//           </Torus>
//         </group>
//       ))}
//     </group>
//   );
// };


// export const PoolGame = () => {
//   const [balls, setBalls] = useState<Ball[]>([]);
//   const [cueBallPos, setCueBallPos] = useState(new THREE.Vector3(-4, 0, 0));
//   const [cueBallVel, setCueBallVel] = useState(new THREE.Vector3(0, 0, 0));
//   const [cueBallPocketed, setCueBallPocketed] = useState(false);
//   const [power, setPower] = useState(0);
//   const [angle, setAngle] = useState(0);
//   const [score, setScore] = useState({ player1: 0, player2: 0 });
//   const [currentPlayer, setCurrentPlayer] = useState(1);
//   const [isMuted, setIsMuted] = useState(false); // New state for audio mute
//   const navigate = useNavigate();

//   useEffect(() => {
//     initializeBalls();
//     // Preload sounds
//     hitSound.load();
//     pocketSound.load();
//   }, []);

//   // Effect to manage sound mute state
//   useEffect(() => {
//       hitSound.muted = isMuted;
//       pocketSound.muted = isMuted;
//   }, [isMuted]);


//   const initializeBalls = () => {
//     const newBalls: Ball[] = [];
//     const startX = 3; // Starting X position for the first ball in the rack
//     const startZ = 0; // Starting Z position for the center of the rack
//     const colors = ["#ff0000", "#0000ff", "#ffff00", "#ff00ff", "#00ff00", "#ff8800", "#8800ff", "#1f75fe", "#6b3fa0", "#9acd32", "#daa520", "#dc143c", "#f0e68c", "#8b0000", "#4682b4"]; // More colors for more balls

//     // Rack the balls in a triangle (adjusting for a standard 15-ball rack + cue)
//     // The exact ball order for solids/stripes/8-ball is complex, simplified here.
//     const triangleRows = 5;
//     let ballId = 1; // Start ball IDs from 1 (cue ball is 0)
//     for (let row = 0; row < triangleRows; row++) {
//       for (let col = 0; col <= row; col++) {
//         if (ballId <= 15) { // Standard 15 object balls
//           newBalls.push({
//             id: ballId,
//             position: new THREE.Vector3(
//               startX + row * BALL_RADIUS * 1.7, // Adjust spacing for tighter rack
//               0,
//               startZ + (col - row / 2) * BALL_RADIUS * 2.05 // Adjust vertical spacing
//             ),
//             velocity: new THREE.Vector3(0, 0, 0),
//             color: colors[(ballId -1) % colors.length], // Assign colors cyclically
//             isPocketed: false,
//             isStripe: ballId > 8 && ballId !== 8 // Stripes from ball 9-15, excluding 8-ball (id 8)
//           });
//           ballId++;
//         }
//       }
//     }
    
//     // Position the 8-ball (black ball) at the center of the third row
//     const eightBallIndex = newBalls.findIndex(b => b.id === 8);
//     if (eightBallIndex !== -1) {
//         newBalls[eightBallIndex].color = "#000000"; // Black for 8-ball
//         newBalls[eightBallIndex].isStripe = false; // 8-ball is solid
//     }


//     setBalls(newBalls);
//     setCueBallPos(new THREE.Vector3(-4, 0, 0)); // Standard cue ball break position
//     setCueBallVel(new THREE.Vector3(0, 0, 0));
//     setCueBallPocketed(false);
//   };

//   const handleShoot = () => {
//     if (cueBallVel.length() > 0.01) {
//       toast.error("Wait for balls to stop!");
//       return;
//     }

//     const force = power / 20; // Scale power input
//     const rad = (angle * Math.PI) / 180;
//     const newVel = new THREE.Vector3(Math.cos(rad) * force, 0, Math.sin(rad) * force);
//     setCueBallVel(newVel);
//     setPower(0);
//     toast.success(`Player ${currentPlayer} shoots!`);
    
//     if (!isMuted) hitSound.currentTime = 0; hitSound.play(); // Play cue hit sound
//   };

//   const handleReset = () => {
//     initializeBalls();
//     setScore({ player1: 0, player2: 0 });
//     setCurrentPlayer(1);
//     setPower(0);
//     setAngle(0);
//     toast.info("Game reset!");
//   };

//   // Improved collision detection (still simplified, real physics engines are more complex)
//   const resolveCollision = (ballA: { position: THREE.Vector3, velocity: THREE.Vector3 }, ballB: { position: THREE.Vector3, velocity: THREE.Vector3 }) => {
//     const normal = new THREE.Vector3().subVectors(ballB.position, ballA.position).normalize();
//     const relativeVelocity = new THREE.Vector3().subVectors(ballA.velocity, ballB.velocity);
//     const speed = relativeVelocity.dot(normal);

//     if (speed < 0) return; // Balls are moving apart

//     const impulse = normal.multiplyScalar(speed * 0.9); // Apply impulse (0.9 for slight energy loss)
//     ballA.velocity.sub(impulse);
//     ballB.velocity.add(impulse);

//     // Separate balls slightly to prevent sticking
//     const overlap = BALL_RADIUS * 2 - ballA.position.distanceTo(ballB.position);
//     if (overlap > 0) {
//       const separation = normal.multiplyScalar(overlap / 2);
//       ballA.position.sub(separation);
//       ballB.position.add(separation);
//     }
//     // if (!isMuted) { hitSound.currentTime = 0; hitSound.play(); } // Play hit sound for every collision
//   };


//   const updateBall = useCallback((updatedBall: Ball) => {
//     setBalls((prev) => {
//       const newBalls = prev.map((b) => (b.id === updatedBall.id ? updatedBall : b));
      
//       // Manual collision detection loop (simplified)
//       for (let i = 0; i < newBalls.length; i++) {
//         if (newBalls[i].isPocketed) continue;
        
//         // Cue ball collision with other balls
//         if (!cueBallPocketed) {
//           const distance = newBalls[i].position.distanceTo(cueBallPos);
//           if (distance < BALL_RADIUS * 2) {
//             resolveCollision({ position: cueBallPos, velocity: cueBallVel }, newBalls[i]);
//             if (!isMuted) { hitSound.currentTime = 0; hitSound.play(); } // Play sound on collision
//           }
//         }

//         // Ball-to-ball collisions
//         for (let j = i + 1; j < newBalls.length; j++) {
//           if (newBalls[j].isPocketed) continue;
          
//           const dist = newBalls[i].position.distanceTo(newBalls[j].position);
//           if (dist < BALL_RADIUS * 2) {
//             resolveCollision(newBalls[i], newBalls[j]);
//             if (!isMuted) { hitSound.currentTime = 0; hitSound.play(); } // Play sound on collision
//           }
//         }
//       }

//       // Check for pocketed balls and update score, then switch player
//       const pocketedThisTurn = newBalls.filter(
//         (ball, index) => ball.isPocketed && !prev[index].isPocketed
//       );

//       if (pocketedThisTurn.length > 0) {
//         setScore((s) => ({
//           ...s,
//           [`player${currentPlayer}`]: s[`player${currentPlayer}` as keyof typeof s] + pocketedThisTurn.length,
//         }));
//         toast.success(`Player ${currentPlayer} pocketed ${pocketedThisTurn.length} ball(s)!`);
//         // If player pockets a ball, their turn continues (standard pool rules)
//       } else if (cueBallVel.length() < 0.01 && balls.every(b => b.velocity.length() < 0.01)) {
//         // If no ball pocketed and all balls stopped, switch player
//         setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
//       }

//       // Check win condition (simplified: first to pocket 7 balls)
//       const player1Score = newBalls.filter(b => b.isPocketed && b.id !== 8 && !b.isStripe).length; // Example: Player 1 gets solid balls
//       const player2Score = newBalls.filter(b => b.isPocketed && b.id !== 8 && b.isStripe).length; // Example: Player 2 gets stripe balls

//       const eightBallPocketed = newBalls.find(b => b.id === 8)?.isPocketed;

//       if (eightBallPocketed) {
//         if ((player1Score > 0 && player1Score === 7 && !newBalls.find(b => b.isPocketed && b.id === 8 && b.isStripe)) || // Player 1 pockets 8 ball after all solids
//             (player2Score > 0 && player2Score === 7 && !newBalls.find(b => b.isPocketed && b.id === 8 && !b.isStripe))) { // Player 2 pockets 8 ball after all stripes
//             toast.success(`Player ${currentPlayer} wins!`); // This needs more sophisticated logic for 8-ball rules
//         } else {
//              toast.error(`Player ${currentPlayer} pocketed the 8-ball too early! Player ${currentPlayer === 1 ? 2 : 1} wins!`);
//         }
//         // Simplified win condition, implement full 8-ball rules here
//         toast.info("Game Over! Reset to play again.");
//       }

//       return newBalls;
//     });
//   }, [cueBallPos, cueBallVel, cueBallPocketed, currentPlayer, isMuted, balls]); // Added `balls` to dependencies to access current velocities

//   const updateCueBall = useCallback((pos: THREE.Vector3, vel: THREE.Vector3, pocketed: boolean) => {
//     setCueBallPos(pos);
//     setCueBallVel(vel);
    
//     if (pocketed && !cueBallPocketed) {
//       setCueBallPocketed(true);
//       toast.error(`Player ${currentPlayer} scratched!`);
//       setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1)); // Switch player on scratch
//     }
//   }, [cueBallPocketed, currentPlayer]);
  

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 relative">
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl space-y-4">
//         <div className="flex items-center justify-between z-10 relative">
//           <Button onClick={() => navigate('/hub')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Back to Hub
//           </Button>
//           <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg">Pool Arena 3D</h1>
//           <div className="flex space-x-2">
//             <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" className="text-white hover:text-primary">
//                 {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
//             </Button>
//             <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
//               <RotateCcw className="mr-2 h-4 w-4" />
//               Reset Game
//             </Button>
//           </div>
//         </div>

//         <div className="glass p-6 rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
//           <div className="flex justify-around mb-6">
//             <motion.div
//               className={`text-center p-5 rounded-2xl transition-all duration-300 ${currentPlayer === 1 ? "bg-gradient-to-r from-blue-500 to-blue-700 border-2 border-blue-300 shadow-xl scale-105" : "bg-gray-800 border-2 border-gray-600 shadow-md"}`}
//               initial={{ scale: 1 }}
//               animate={{ scale: currentPlayer === 1 ? 1.05 : 1 }}
//               transition={{ type: "spring", stiffness: 300 }}
//             >
//               <div className="text-lg text-gray-200">Player 1 Score</div>
//               <div className="text-5xl font-extrabold text-white">{score.player1}</div>
//             </motion.div>
//             <motion.div
//               className={`text-center p-5 rounded-2xl transition-all duration-300 ${currentPlayer === 2 ? "bg-gradient-to-r from-purple-500 to-purple-700 border-2 border-purple-300 shadow-xl scale-105" : "bg-gray-800 border-2 border-gray-600 shadow-md"}`}
//               initial={{ scale: 1 }}
//               animate={{ scale: currentPlayer === 2 ? 1.05 : 1 }}
//               transition={{ type: "spring", stiffness: 300 }}
//             >
//               <div className="text-lg text-gray-200">Player 2 Score</div>
//               <div className="text-5xl font-extrabold text-white">{score.player2}</div>
//             </motion.div>
//           </div>

//           <div className="h-[600px] border-4 border-gray-600 rounded-3xl overflow-hidden bg-black/60 relative">
//             <Canvas camera={{ position: [0, 15, 0], fov: 40, near: 0.1, far: 50 }}>
//               <color attach="background" args={["#1a1a1a"]} /> {/* Dark background */}
//               <ambientLight intensity={0.4} />
//               <pointLight position={[0, 15, 0]} intensity={300} decay={1.5} color="#ffffff" /> {/* Overhead light */}
//               <pointLight position={[TABLE_WIDTH / 2, 5, TABLE_HEIGHT / 2]} intensity={50} color="#ffaa66" /> {/* Warm side light */}
//               <pointLight position={[-TABLE_WIDTH / 2, 5, -TABLE_HEIGHT / 2]} intensity={50} color="#66aaff" /> {/* Cool side light */}
              
//               <PoolTable />
//               <CueBall
//                 position={cueBallPos}
//                 velocity={cueBallVel}
//                 onUpdate={updateCueBall}
//                 isPocketed={cueBallPocketed}
//               />
//               {balls.map((ball) => (
//                 <GameBall key={ball.id} ball={ball} onUpdate={updateBall} />
//               ))}
              
//               <OrbitControls maxPolarAngle={Math.PI / 2.5} minDistance={8} maxDistance={25} enablePan={false} />

//               {/* Post-processing effects for better visuals */}
//               <EffectComposer>
//                 <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} height={300} opacity={0.5} kernelSize={KernelSize.MEDIUM} />
//                 <Vignette eskil={false} offset={0.1} darkness={0.8} />
//                 <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
//               </EffectComposer>
//             </Canvas>
//           </div>

//           <div className="mt-6 space-y-5">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="text-lg text-gray-300 mb-3 block font-semibold">Power: <span className="text-primary">{power}%</span></label>
//                 <input
//                   type="range"
//                   min="0"
//                   max="100"
//                   value={power}
//                   onChange={(e) => setPower(Number(e.target.value))}
//                   className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
//                   style={{ '--webkit-slider-runnable-track-background': `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${power}%, #4b5563 ${power}%, #4b5563 100%)` }}
//                 />
//               </div>
//               <div>
//                 <label className="text-lg text-gray-300 mb-3 block font-semibold">Angle: <span className="text-secondary">{angle}°</span></label>
//                 <input
//                   type="range"
//                   min="0"
//                   max="360"
//                   value={angle}
//                   onChange={(e) => setAngle(Number(e.target.value))}
//                   className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
//                   style={{ '--webkit-slider-runnable-track-background': `linear-gradient(to right, #a855f7 0%, #a855f7 ${angle / 3.6}%, #4b5563 ${angle / 3.6}%, #4b5563 100%)` }}
//                 />
//               </div>
//             </div>
//             <Button
//               className="w-full py-4 text-xl font-bold rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-xl transition-all duration-300 transform hover:scale-105"
//               onClick={handleShoot}
//             >
//               Shoot (Player {currentPlayer})
//             </Button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };