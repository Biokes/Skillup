// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Pause, Play, Info } from "lucide-react";
// import { toast } from "sonner";
// import { useNavigate } from "react-router-dom";
// // import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
// import { GameMatchModal } from "@/components/modals/GameMatchModal";
// import { CreateRoomCode } from "@/components/room/CreateRoomCode";
// import { JoinRoomCode } from "@/components/room/JoinRoomCode";
// import { QuickMatchWaiting } from "@/components/room/QuickMatchWaiting";
// import { FriendlyMatchChoice } from "@/components/room/FriendlyMatchChoice";
// import { socketService } from "@/services/socketService";

import { motion } from "framer-motion"
import Navbar from "../commons/navbar"
import { useRef, useState } from "react"
import { GameState } from "@/types"
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/utils"

export default function PingPongGame() {
    const powerups = [
        {
            name: 'Multiball',
            icon: '🎆',
            owned: 0,
        },
        {
            name: 'Pat Stretch',
            icon: '💪',
            owned: 0,
        },
        {
            name: 'Shield',
            icon: '🛡️',
            owned: 0,
        }
    ]

    const BoostPack = () => (
        <section className="inventory">
            <h5>My Inventory</h5>
            <div>
                {
                    powerups.map((powerUp, index) => (
                        <motion.article key={index}>
                            <nav>
                                <span>{powerUp.icon}</span>
                                <h5>{powerUp.name}</h5>
                            </nav>
                            <h6>: {powerUp.owned}</h6>
                        </motion.article>
                    ))
                }
            </div>
        </section>
    )

    const GameBoard = () => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [gameState, setGameState] = useState<GameState>({
            ballX: CANVAS_WIDTH / 2,
            ballY: CANVAS_HEIGHT / 2,
            paddle1Y: CANVAS_HEIGHT / 2 - 50,
            paddle2Y: CANVAS_HEIGHT / 2 - 50,
            paddle1Height: 100,
            paddle2Height: 100,
            score1: 0,
            score2: 0,
            activePowerups: { player1: null, player2: null },
            status: 'COUNTDOWN',
        });
        return (
            <aside className="gameBoard">
                <canvas ref={canvasRef} width={800} height={500} className="canvas" />
            </aside>
        )
    }
    return (
        <main className=''>
            <Navbar />
            <BoostPack />
            <GameBoard />
        </main>
    )
    //   const canvasRef = useRef<HTMLCanvasElement>(null);
    //   const navigate = useNavigate();
    //   const [showControls, setShowControls] = useState(true);
    //   const [rally, setRally] = useState(0);
    //   // Multiplayer integration
    //   const {
    //     showMatchModal,
    //     matchType,
    //     roomCode,
    //     showRoomView,
    //     gameState,
    //     isPlaying,
    //     isPaused,
    //     gameResult,
    //     playerName,
    //     countdown,
    //     selectMatchType,
    //     createFriendlyRoom,
    //     joinFriendlyRoom,
    //     createQuickMatch,
    //     joinQuickMatch,
    //     pauseGame,
    //     resumeGame,
    //     forfeitGame,
    //     leaveGame,
    //     playAgain,
    //     setShowRoomView,
    //   } = useMultiplayerGame('pingpong');
    //   // Persistent game state using refs
    //   const gameStateRef = useRef({
    //     ball: { x: 0, y: 0, radius: 12, dx: 0, dy: 0, speed: 6, maxSpeed: 15, trail: [] as any[] },
    //     paddle1: { x: 30, y: 0, width: 18, height: 120, speed: 10, color: "#06b6d4", glowIntensity: 0 },
    //     paddle2: { x: 0, y: 0, width: 18, height: 120, speed: 10, color: "#a855f7", glowIntensity: 0 },
    //     particles: [] as any[],
    //     currentRally: 0
    //   });

    //   // Auto-hide controls after 5 seconds
    //   useEffect(() => {
    //     if (isPlaying && !isPaused) {
    //       const timer = setTimeout(() => setShowControls(false), 5000);
    //       return () => clearTimeout(timer);
    //     } else {
    //       setShowControls(true);
    //     }
    //   }, [isPlaying, isPaused]);

    //   // Sync server game state to local rendering state
    //   useEffect(() => {
    //     if (gameState && isPlaying) {
    //       const state = gameStateRef.current;

    //       // Update ball position from server
    //       if (gameState.ball) {
    //         state.ball.x = gameState.ball.x;
    //         state.ball.y = gameState.ball.y;
    //         state.ball.dx = gameState.ball.dx;
    //         state.ball.dy = gameState.ball.dy;
    //         state.ball.speed = gameState.ball.speed;
    //       }

    //       // Update paddle positions from server
    //       if (gameState.paddle1) {
    //         state.paddle1.y = gameState.paddle1.y;
    //       }
    //       if (gameState.paddle2) {
    //         state.paddle2.y = gameState.paddle2.y;
    //       }

    //       // Update rally
    //       if (gameState.currentRally !== undefined) {
    //         setRally(gameState.currentRally);
    //         state.currentRally = gameState.currentRally;
    //       }
    //     }
    //   }, [gameState, isPlaying]);

    //   useEffect(() => {
    //     if (!isPlaying || !canvasRef.current) return;

    //     const canvas = canvasRef.current;
    //     const ctx = canvas.getContext("2d");
    //     if (!ctx) return;

    //     // Make canvas responsive
    //     const resizeCanvas = () => {
    //       const container = canvas.parentElement;
    //       if (container) {
    //         const width = Math.min(container.clientWidth - 32, 1200);
    //         const height = Math.min(width * 0.5, 600);
    //         const wasInitialized = canvas.width > 0;

    //         if (!wasInitialized) {
    //           canvas.width = width;
    //           canvas.height = height;

    //           // Initialize game state
    //           const state = gameStateRef.current;
    //           state.ball.x = width / 2;
    //           state.ball.y = height / 2;
    //           state.paddle1.x = 30;
    //           state.paddle1.y = height / 2 - 60;
    //           state.paddle2.x = width - 48;
    //           state.paddle2.y = height / 2 - 60;

    //           // Start ball movement
    //           const angle = (Math.random() - 0.5) * Math.PI / 4;
    //           const direction = Math.random() > 0.5 ? 1 : -1;
    //           state.ball.speed = 6;
    //           state.ball.dx = Math.cos(angle) * state.ball.speed * direction;
    //           state.ball.dy = Math.sin(angle) * state.ball.speed;
    //         } else if (canvas.width !== width || canvas.height !== height) {
    //           // Handle resize - preserve game state positions proportionally
    //           const scaleX = width / canvas.width;
    //           const scaleY = height / canvas.height;

    //           const state = gameStateRef.current;
    //           state.ball.x *= scaleX;
    //           state.ball.y *= scaleY;
    //           state.paddle1.y *= scaleY;
    //           state.paddle2.x = width - 48;
    //           state.paddle2.y *= scaleY;

    //           canvas.width = width;
    //           canvas.height = height;
    //         }
    //       }
    //     };

    //     resizeCanvas();
    //     window.addEventListener('resize', resizeCanvas);

    //     const WINNING_SCORE = 5;
    //     const MAX_BALL_SPEED = 15;
    //     const BALL_ACCELERATION = 1.05;
    //     let animationId: number;

    //     const state = gameStateRef.current;

    //     // Controls
    //     const keys: { [key: string]: boolean } = {};
    //     const lastEmittedPaddleY = useRef({ paddle1: -1, paddle2: -1 });

    //     const handleKeyDown = (e: KeyboardEvent) => {
    //       // Prevent default scrolling behavior
    //       if (['w', 's', 'W', 'S', 'ArrowUp', 'ArrowDown', ' ', 'p', 'P'].includes(e.key)) {
    //         e.preventDefault();
    //       }

    //       keys[e.key] = true;

    //       if (e.key === 'p' || e.key === 'P') {
    //         if (isPaused) {
    //           resumeGame();
    //         } else {
    //           pauseGame();
    //         }
    //       }
    //     };

    //     const handleKeyUp = (e: KeyboardEvent) => {
    //       keys[e.key] = false;
    //     };

    //     window.addEventListener("keydown", handleKeyDown);
    //     window.addEventListener("keyup", handleKeyUp);

    //     const createParticles = (x: number, y: number, color: string, count: number = 12) => {
    //       for (let i = 0; i < count; i++) {
    //         const angle = (Math.PI * 2 * i) / count;
    //         const speed = 2 + Math.random() * 3;
    //         state.particles.push({
    //           x,
    //           y,
    //           vx: Math.cos(angle) * speed,
    //           vy: Math.sin(angle) * speed,
    //           life: 1,
    //           maxLife: 0.5 + Math.random() * 0.5,
    //           color,
    //           size: 2 + Math.random() * 3,
    //         });
    //       }
    //     };

    //     const resetBall = () => {
    //       state.ball.x = canvas.width / 2;
    //       state.ball.y = canvas.height / 2;
    //       state.ball.trail = [];
    //       state.ball.dx = 0;
    //       state.ball.dy = 0;

    //       setTimeout(() => {
    //         const angle = (Math.random() - 0.5) * Math.PI / 4;
    //         const direction = Math.random() > 0.5 ? 1 : -1;
    //         state.ball.speed = 6;
    //         state.ball.dx = Math.cos(angle) * state.ball.speed * direction;
    //         state.ball.dy = Math.sin(angle) * state.ball.speed;
    //       }, 800);

    //       state.currentRally = 0;
    //       setRally(0);
    //     };

    //     const draw = () => {
    //       // Clear with trailing effect
    //       ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    //       ctx.fillRect(0, 0, canvas.width, canvas.height);

    //       // Draw center line
    //       ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
    //       ctx.lineWidth = 3;
    //       ctx.setLineDash([15, 15]);
    //       ctx.beginPath();
    //       ctx.moveTo(canvas.width / 2, 0);
    //       ctx.lineTo(canvas.width / 2, canvas.height);
    //       ctx.stroke();
    //       ctx.setLineDash([]);

    //       // Draw ball trail
    //       state.ball.trail.forEach((point: any, index: number) => {
    //         const alpha = (index / state.ball.trail.length) * point.alpha;
    //         ctx.shadowBlur = 10;
    //         ctx.shadowColor = `rgba(236, 72, 153, ${alpha})`;
    //         ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
    //         ctx.beginPath();
    //         ctx.arc(point.x, point.y, state.ball.radius * 0.6, 0, Math.PI * 2);
    //         ctx.fill();
    //       });

    //       // Draw and update particles
    //       state.particles.forEach((particle, index) => {
    //         particle.life -= 0.02;
    //         particle.x += particle.vx;
    //         particle.y += particle.vy;
    //         particle.vx *= 0.98;
    //         particle.vy *= 0.98;

    //         if (particle.life <= 0) {
    //           state.particles.splice(index, 1);
    //           return;
    //         }

    //         const alpha = particle.life / particle.maxLife;
    //         ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    //         ctx.shadowBlur = 5;
    //         ctx.shadowColor = particle.color;
    //         ctx.beginPath();
    //         ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    //         ctx.fill();
    //       });

    //       // Draw paddles
    //       state.paddle1.glowIntensity *= 0.9;
    //       ctx.shadowBlur = 20 + state.paddle1.glowIntensity * 20;
    //       ctx.shadowColor = state.paddle1.color;
    //       ctx.fillStyle = state.paddle1.color;
    //       ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);

    //       ctx.shadowBlur = 0;
    //       const gradient1 = ctx.createLinearGradient(state.paddle1.x, 0, state.paddle1.x + state.paddle1.width, 0);
    //       gradient1.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    //       gradient1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    //       ctx.fillStyle = gradient1;
    //       ctx.fillRect(state.paddle1.x, state.paddle1.y, 4, state.paddle1.height);

    //       state.paddle2.glowIntensity *= 0.9;
    //       ctx.shadowBlur = 20 + state.paddle2.glowIntensity * 20;
    //       ctx.shadowColor = state.paddle2.color;
    //       ctx.fillStyle = state.paddle2.color;
    //       ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);

    //       ctx.shadowBlur = 0;
    //       const gradient2 = ctx.createLinearGradient(state.paddle2.x + state.paddle2.width, 0, state.paddle2.x, 0);
    //       gradient2.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    //       gradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    //       ctx.fillStyle = gradient2;
    //       ctx.fillRect(state.paddle2.x + state.paddle2.width - 4, state.paddle2.y, 4, state.paddle2.height);

    //       // Draw ball
    //       ctx.shadowBlur = 30;
    //       ctx.shadowColor = "#ec4899";
    //       const ballGradient = ctx.createRadialGradient(state.ball.x, state.ball.y, 0, state.ball.x, state.ball.y, state.ball.radius);
    //       ballGradient.addColorStop(0, '#ffffff');
    //       ballGradient.addColorStop(0.3, '#ec4899');
    //       ballGradient.addColorStop(1, '#9333ea');
    //       ctx.fillStyle = ballGradient;
    //       ctx.beginPath();
    //       ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    //       ctx.fill();
    //       ctx.shadowBlur = 0;

    //       // Draw rally counter
    //       if (state.currentRally > 3) {
    //         ctx.font = `bold ${Math.min(32, canvas.width / 30)}px Arial`;
    //         ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(state.currentRally / 10, 0.3)})`;
    //         ctx.textAlign = 'center';
    //         ctx.fillText(`Rally: ${state.currentRally}`, canvas.width / 2, 50);
    //       }
    //     };

    //     const update = () => {
    //       if (isPaused) return; // Don't update game state when paused

    //       // Handle local paddle movement and emit to server
    //       const isPlayer1 = gameState && gameState.players && gameState.players[0]?.socketId === socketService.getSocketId();

    //       // Move paddles locally for smooth feedback
    //       if (isPlayer1) {
    //         if (keys["w"] || keys["W"]) {
    //           if (state.paddle1.y > 0) {
    //             state.paddle1.y -= state.paddle1.speed;
    //             // Emit paddle position to server (throttled)
    //             if (Math.abs(state.paddle1.y - lastEmittedPaddleY.current.paddle1) > 2) {
    //               socketService.paddleMove({ position: state.paddle1.y });
    //               lastEmittedPaddleY.current.paddle1 = state.paddle1.y;
    //             }
    //           }
    //         }
    //         if (keys["s"] || keys["S"]) {
    //           if (state.paddle1.y < canvas.height - state.paddle1.height) {
    //             state.paddle1.y += state.paddle1.speed;
    //             // Emit paddle position to server (throttled)
    //             if (Math.abs(state.paddle1.y - lastEmittedPaddleY.current.paddle1) > 2) {
    //               socketService.paddleMove({ position: state.paddle1.y });
    //               lastEmittedPaddleY.current.paddle1 = state.paddle1.y;
    //             }
    //           }
    //         }
    //       } else {
    //         // Player 2
    //         if (keys["ArrowUp"]) {
    //           if (state.paddle2.y > 0) {
    //             state.paddle2.y -= state.paddle2.speed;
    //             // Emit paddle position to server (throttled)
    //             if (Math.abs(state.paddle2.y - lastEmittedPaddleY.current.paddle2) > 2) {
    //               socketService.paddleMove({ position: state.paddle2.y });
    //               lastEmittedPaddleY.current.paddle2 = state.paddle2.y;
    //             }
    //           }
    //         }
    //         if (keys["ArrowDown"]) {
    //           if (state.paddle2.y < canvas.height - state.paddle2.height) {
    //             state.paddle2.y += state.paddle2.speed;
    //             // Emit paddle position to server (throttled)
    //             if (Math.abs(state.paddle2.y - lastEmittedPaddleY.current.paddle2) > 2) {
    //               socketService.paddleMove({ position: state.paddle2.y });
    //               lastEmittedPaddleY.current.paddle2 = state.paddle2.y;
    //             }
    //           }
    //         }
    //       }

    //       // Add ball trail for visual effect
    //       state.ball.trail.push({ x: state.ball.x, y: state.ball.y, alpha: 1 });
    //       if (state.ball.trail.length > 15) {
    //         state.ball.trail.shift();
    //       }

    //       // Visual effects for paddle glow (client-side only)
    //       state.paddle1.glowIntensity *= 0.9;
    //       state.paddle2.glowIntensity *= 0.9;

    //       // Server handles all game logic (collisions, scoring, etc.)
    //     };

    //     const gameLoop = () => {
    //       update();
    //       draw();
    //       animationId = requestAnimationFrame(gameLoop);
    //     };

    //     gameLoop();

    //     return () => {
    //       cancelAnimationFrame(animationId);
    //       window.removeEventListener("keydown", handleKeyDown);
    //       window.removeEventListener("keyup", handleKeyUp);
    //       window.removeEventListener('resize', resizeCanvas);
    //     };
    //   }, [isPlaying, gameState, isPaused, pauseGame, resumeGame]);

    //   // Get score from server game state
    //   const score = gameState?.score || { player1: 0, player2: 0 };
    //   const players = gameState?.players || [];

    //   return (
    //     <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    //       {/* Match Type Selection Modal */}
    //       {showMatchModal && (
    //         <GameMatchModal
    //           onSelectMatchType={selectMatchType}
    //           onCreateQuickMatch={createQuickMatch}
    //           onJoinQuickMatch={joinQuickMatch}
    //           onClose={() => navigate('/hub')}
    //         />
    //       )}

    //       {/* Room Views */}
    //       {showRoomView === 'create' && roomCode && (
    //         <CreateRoomCode roomCode={roomCode} onCancel={leaveGame} countdown={countdown} />
    //       )}
    //       {showRoomView === 'join' && (
    //         <JoinRoomCode onJoin={joinFriendlyRoom} onCancel={() => setShowRoomView(null)} />
    //       )}
    //       {showRoomView === 'waiting' && (
    //         <QuickMatchWaiting onCancel={leaveGame} countdown={countdown} />
    //       )}
    //       {matchType === 'friendly' && !showRoomView && !isPlaying && (
    //         <FriendlyMatchChoice
    //           onCreateRoom={createFriendlyRoom}
    //           onJoinRoom={() => setShowRoomView('join')}
    //           onCancel={leaveGame}
    //         />
    //       )}

    //       {/* Game Over Modal */}
    //       {gameResult && (
    //         <motion.div
    //           initial={{ scale: 0, rotate: -10 }}
    //           animate={{ scale: 1, rotate: 0 }}
    //           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    //         >
    //           <div className="glass p-6 md:p-8 rounded-2xl max-w-md w-full space-y-6">
    //             <div className="text-center space-y-4">
    //               <div className="text-3xl md:text-5xl font-bold text-gradient mb-4">
    //                 {gameResult.winnerName ? `${gameResult.winnerName} Wins! 🏆` : 'Draw!'}
    //               </div>
    //               {gameResult.ratings && (
    //                 <div className="space-y-2">
    //                   <p className="text-lg">Rating Changes:</p>
    //                   <div className="flex justify-between">
    //                     <span>{players[0]?.name || 'Player 1'}</span>
    //                     <span className={gameResult.ratings.player1Change > 0 ? 'text-green-400' : 'text-red-400'}>
    //                       {gameResult.ratings.player1} ({gameResult.ratings.player1Change > 0 ? '+' : ''}{gameResult.ratings.player1Change})
    //                     </span>
    //                   </div>
    //                   <div className="flex justify-between">
    //                     <span>{players[1]?.name || 'Player 2'}</span>
    //                     <span className={gameResult.ratings.player2Change > 0 ? 'text-green-400' : 'text-red-400'}>
    //                       {gameResult.ratings.player2} ({gameResult.ratings.player2Change > 0 ? '+' : ''}{gameResult.ratings.player2Change})
    //                     </span>
    //                   </div>
    //                 </div>
    //               )}
    //               <div className="flex gap-4 mt-6">
    //                 <Button variant="gaming" className="flex-1" onClick={playAgain}>
    //                   Play Again
    //                 </Button>
    //                 <Button variant="outline" className="flex-1" onClick={() => navigate('/hub')}>
    //                   Exit
    //                 </Button>
    //               </div>
    //             </div>
    //           </div>
    //         </motion.div>
    //       )}

    //       <motion.div
    //         initial={{ opacity: 0, y: 20 }}
    //         animate={{ opacity: 1, y: 0 }}
    //         className="w-full max-w-7xl space-y-4 md:space-y-6"
    //       >
    //         <div className="flex items-center justify-between flex-wrap gap-2">
    //           <Button variant="outline" size="sm" onClick={() => navigate('/hub')} className="h-8 md:h-10">
    //             <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
    //             <span className="text-xs md:text-sm">Back</span>
    //           </Button>
    //           <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gradient">Cyber Ping Pong</h1>
    //           <div className="flex gap-1 md:gap-2">
    //             {isPlaying && (
    //               <Button variant="outline" onClick={isPaused ? resumeGame : pauseGame} size="sm" className="h-8 w-8 md:h-10 md:w-10 p-0">
    //                 {isPaused ? <Play className="h-3 w-3 md:h-4 md:w-4" /> : <Pause className="h-3 w-3 md:h-4 md:w-4" />}
    //               </Button>
    //             )}
    //             <Button
    //               variant="outline"
    //               size="sm"
    //               className="h-8 w-8 md:h-10 md:w-10 p-0"
    //               onClick={() => setShowControls(!showControls)}
    //             >
    //               <Info className="h-3 w-3 md:h-4 md:w-4" />
    //             </Button>
    //           </div>
    //         </div>

    //         <div className="glass p-3 md:p-6 lg:p-8 rounded-2xl space-y-4 md:space-y-6">
    //           <div className="flex justify-between items-center gap-2">
    //             <motion.div
    //               className="text-center p-2 md:p-4 glass rounded-xl flex-1"
    //               animate={{ scale: score.player1 > score.player2 ? 1.05 : 1 }}
    //             >
    //               <div className="text-xs md:text-sm text-muted-foreground mb-1">{players[0]?.name || 'Player 1'}</div>
    //               <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary">{score.player1}</div>
    //               {players[0]?.rating && (
    //                 <div className="text-xs mt-1 text-muted-foreground">Rating: {players[0].rating}</div>
    //               )}
    //             </motion.div>

    //             <div className="flex flex-col items-center">
    //               <div className="text-lg md:text-2xl font-bold text-muted-foreground">VS</div>
    //               {rally > 0 && (
    //                 <motion.div
    //                   initial={{ scale: 0 }}
    //                   animate={{ scale: 1 }}
    //                   className="text-xs text-amber-400 mt-1"
    //                 >
    //                   Rally: {rally}
    //                 </motion.div>
    //               )}
    //             </div>

    //             <motion.div
    //               className="text-center p-2 md:p-4 glass rounded-xl flex-1"
    //               animate={{ scale: score.player2 > score.player1 ? 1.05 : 1 }}
    //             >
    //               <div className="text-xs md:text-sm text-muted-foreground mb-1">{players[1]?.name || 'Player 2'}</div>
    //               <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-secondary">{score.player2}</div>
    //               {players[1]?.rating && (
    //                 <div className="text-xs mt-1 text-muted-foreground">Rating: {players[1].rating}</div>
    //               )}
    //             </motion.div>
    //           </div>

    //           <div className="relative">
    //             <canvas
    //               ref={canvasRef}
    //               className="w-full border-2 border-primary/20 rounded-xl bg-black/50 shadow-2xl"
    //               style={{ maxHeight: '600px' }}
    //             />

    //             {isPaused && (
    //               <motion.div
    //                 initial={{ opacity: 0 }}
    //                 animate={{ opacity: 1 }}
    //                 className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm"
    //               >
    //                 <div className="text-center space-y-4">
    //                   <Pause className="h-12 md:h-16 w-12 md:w-16 mx-auto text-primary" />
    //                   <div className="text-2xl md:text-3xl font-bold text-white">PAUSED</div>
    //                   <p className="text-muted-foreground">Waiting for resume...</p>
    //                   <Button onClick={resumeGame} variant="gaming" size="sm" className="md:text-base">
    //                     <Play className="mr-2 h-4 w-4" />
    //                     Resume
    //                   </Button>
    //                 </div>
    //               </motion.div>
    //             )}
    //           </div>


    //           <AnimatePresence>
    //             {showControls && (
    //               <motion.div
    //                 initial={{ opacity: 0, height: 0 }}
    //                 animate={{ opacity: 1, height: 'auto' }}
    //                 exit={{ opacity: 0, height: 0 }}
    //                 className="text-center space-y-2 text-xs md:text-sm text-muted-foreground glass p-3 md:p-4 rounded-xl"
    //               >
    //                 <div className="space-y-3">
    //                   <div>
    //                     <div className="text-primary font-semibold mb-1">Controls</div>
    //                     <div className="space-y-1">
    //                       <p>W / S - Move Paddle Up/Down (Player 1)</p>
    //                       <p>↑ / ↓ - Move Paddle Up/Down (Player 2)</p>
    //                       <p>P - Pause/Resume Game</p>
    //                     </div>
    //                   </div>
    //                 </div>
    //                 <div className="border-t border-primary/20 pt-3 mt-3">
    //                   <p className="font-semibold text-primary">Multiplayer Ping Pong</p>
    //                   <p>First to 5 points wins!</p>
    //                   <p className="text-xs mt-2 text-muted-foreground">Playing as: {playerName}</p>
    //                   <p className="text-xs mt-2 text-amber-400">💡 Tip: Hit the ball at different paddle positions for spin!</p>
    //                 </div>
    //               </motion.div>
    //             )}
    //           </AnimatePresence>
    //         </div>
    //       </motion.div>
    //     </div>
    //   );
};
