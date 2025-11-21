import { motion } from "framer-motion"
import Navbar from "../commons/navbar"
import { useRef, useState, useEffect } from "react"
import { CountdownState, GameState } from "@/types"
import { BALL_RADIUS, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_WIDTH } from "@/lib/utils"
import { socketService } from "@/services/socketService"
import { useLocation } from "react-router-dom"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { toast } from "../ui/sonner"

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
    const { state } = useLocation()

    const GameBoard = () => {
        const account = useCurrentAccount() ?? {};
        const address = account?.address ?? null;
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const playerNumber = String(address).toLowerCase() === String(state?.player1).toLowerCase() ? 1 : 2
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
        const [countdown, setCountdown] = useState<CountdownState>({ active: true, remaining: 3 });
        const [gameOver, setGameOver] = useState(false);
        const [winner, setWinner] = useState<string | null>(null);
        const [opponent, setOpponent] = useState<boolean>(false);
        const inputRef = useRef({
            keyboard: { w: false, s: false, arrowUp: false, arrowDown: false },
            touch: { playerY: null as number | null },
        });
        const lastPaddleMoveRef = useRef(0);
        const isDeviceTouchRef = useRef(false);

        useEffect(() => {
            const isTouchDevice = () => {
                return (
                    typeof window !== 'undefined' &&
                    (!!window.ontouchstart ||
                        (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0) ||
                        // @ts-expect-error jksd
                        (navigator.msMaxTouchPoints !== undefined && navigator.msMaxTouchPoints > 0))
                );
            };
            isDeviceTouchRef.current = isTouchDevice();
            // console.log(`Device type: ${isDeviceTouchRef.current ? 'TOUCH' : 'KEYBOARD'}`);
        }, []);

        useEffect(() => {
            socketService.gameReady(state?.gameId, playerNumber, state?.sessionId);
        }, [address, playerNumber]);

        useEffect(() => {

            const handleGameStart = (data: { message: string; countdown: number }) => {
                setCountdown({ active: true, remaining: 3 });
            };

            const handleCountdownComplete = () => {
                console.log('Countdown complete, game started');
                setCountdown({ active: false, remaining: 0 });
            };

            const handleGameUpdate = (data: GameState) => {
                setGameState(data);
            };

            const handleScoreUpdate = (data: { score1: number; score2: number; scoredBy: number }) => {
                console.log(`Score: P1=${data.score1}, P2=${data.score2}`);
                setGameState((prev) => ({ ...prev, score1: data.score1, score2: data.score2 }));
                setCountdown({ active: true, remaining: 3 });
            };

            const handleNextServe = () => {
                console.log('Next serve countdown');
                setCountdown({ active: true, remaining: 3 });
            };

            const handleGameOver = (data: { winner: string; score1: number; score2: number; message: string }) => {
                console.log('Game over:', data.message);
                setGameOver(true);
                setWinner(data.winner);
                toast.success(data.message);
            };

            const handleOpponentDisconnected = (data: { playerNumber: number; message: string }) => {
                console.log('Opponent disconnected, you win!');
                setOpponent(true);
                setGameOver(true);
                setWinner('You');
                toast.success('Opponent disconnected. You win!');
            };

            socketService.on('gameStart', handleGameStart);
            socketService.on('countdownComplete', handleCountdownComplete);
            socketService.on('gameUpdate', handleGameUpdate);
            socketService.on('scoreUpdate', handleScoreUpdate);
            socketService.on('nextServe', handleNextServe);
            socketService.on('gameOver', handleGameOver);
            socketService.on('opponentDisconnected', handleOpponentDisconnected);

            return () => {
                socketService.off('gameStart');
                socketService.off('countdownComplete');
                socketService.off('gameUpdate');
                socketService.off('scoreUpdate');
                socketService.off('nextServe');
                socketService.off('gameOver');
                socketService.off('opponentDisconnected');
            };
        }, []);

        useEffect(() => {
            if (!countdown.active) return;

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
        }, [countdown.active]);

        // useEffect(() => {
        //     if (isDeviceTouchRef.current) return;

        //      const handleKeyDown = (e: KeyboardEvent) => {
        //         const key = e.key.toLowerCase();
        //         if (key === 'w') {
        //         console.log(`⬆️ W pressed - inputRef.w = true`);
        //         inputRef.current.keyboard.w = true;
        //         }
        //         if (key === 's') {
        //         console.log(`⬇️ S pressed - inputRef.s = true`);
        //         inputRef.current.keyboard.s = true;
        //         }
        //         if (e.key === 'ArrowUp') {
        //         console.log(`⬆️ ArrowUp pressed - inputRef.arrowUp = true`);
        //         inputRef.current.keyboard.arrowUp = true;
        //         }
        //         if (e.key === 'ArrowDown') {
        //         console.log(`⬇️ ArrowDown pressed - inputRef.arrowDown = true`);
        //         inputRef.current.keyboard.arrowDown = true;
        //         }
        //     };

        //     const handleKeyUp = (event: KeyboardEvent) => {
        //         const key = event.key.toLowerCase();
        //         if (key === 'w') {
        //         console.log(`⬆️ W released - inputRef.w = false`);
        //         inputRef.current.keyboard.w = false;
        //         }
        //         if (key === 's') {
        //         console.log(`⬇️ S released - inputRef.s = false`);
        //         inputRef.current.keyboard.s = false;
        //         }
        //         if (event.key === 'ArrowUp') {
        //         console.log(`⬆️ ArrowUp released - inputRef.arrowUp = false`);
        //         inputRef.current.keyboard.arrowUp = false;
        //         }
        //         if (event.key === 'ArrowDown') {
        //         console.log(`⬇️ ArrowDown released - inputRef.arrowDown = false`);
        //         inputRef.current.keyboard.arrowDown = false;
        //         }
        //     };
        //     window.addEventListener('keydown', handleKeyDown);
        //     window.addEventListener('keyup', handleKeyUp);

        //     return () => {
        //         window.removeEventListener('keydown', handleKeyDown);
        //         window.removeEventListener('keyup', handleKeyUp);
        //     };
        // }, []);

        useEffect(() => {
            if (isDeviceTouchRef.current) return;

            const handleKeyDown = (event: KeyboardEvent) => {
                const key = event.key.toLowerCase();

                if (key === 'w') {
                    console.log(`⬆️ W pressed`);
                    inputRef.current.keyboard.w = true;
                }
                if (key === 's') {
                    console.log(`⬇️ S pressed`);
                    inputRef.current.keyboard.s = true;
                }
                if (key === 'arrowup') {
                    console.log(`⬆️ ArrowUp pressed`);
                    inputRef.current.keyboard.arrowUp = true;
                }
                if (key === 'arrowdown') {
                    console.log(`⬇️ ArrowDown pressed`);
                    inputRef.current.keyboard.arrowDown = true;
                }
            };

            const handleKeyUp = (event: KeyboardEvent) => {
                const key = event.key.toLowerCase();
                if (key === 'w') {
                    console.log(`⬆️ W released`);
                    inputRef.current.keyboard.w = false;
                }
                if (key === 's') {
                    console.log(`⬇️ S released`);
                    inputRef.current.keyboard.s = false;
                }
                if (key === 'arrowup') {
                    console.log(`⬆️ ArrowUp released`);
                    inputRef.current.keyboard.arrowUp = false;
                }
                if (key === 'arrowdown') {
                    console.log(`⬇️ ArrowDown released`);
                    inputRef.current.keyboard.arrowDown = false;
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, []);

        useEffect(() => {
            if (!isDeviceTouchRef.current) return; // Skip if not touch device

            const canvas = canvasRef.current;
            if (!canvas) return;

            const handleTouchMove = (e: TouchEvent) => {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const touchY = touch.clientY - rect.top;
                const touchX = touch.clientX - rect.left;

                const controllingPlayer = touchX < CANVAS_WIDTH / 2 ? 1 : 2;

                if (controllingPlayer === playerNumber) {
                    const paddleHeight = playerNumber === 1 ? gameState.paddle1Height : gameState.paddle2Height;
                    const newY = Math.max(0, Math.min(CANVAS_HEIGHT - paddleHeight, touchY - paddleHeight / 2));
                    inputRef.current.touch.playerY = newY;
                }
            };

            const handleTouchEnd = () => {
                inputRef.current.touch.playerY = null;
            };

            canvas.addEventListener('touchmove', handleTouchMove);
            canvas.addEventListener('touchend', handleTouchEnd);

            return () => {
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
            };
        }, [playerNumber, gameState.paddle1Height, gameState.paddle2Height]);

        useEffect(() => {
            const paddleInterval = setInterval(() => {
                let newPaddleY: number | null = null;

                if (isDeviceTouchRef.current) {
                    // Touch input
                    if (inputRef.current.touch.playerY !== null) newPaddleY = inputRef.current.touch.playerY;
                } else {
                    // Keyboard input
                    if (playerNumber === 1) {
                        if (inputRef.current.keyboard.arrowUp && gameState.paddle1Y > 0) {
                            newPaddleY = gameState.paddle1Y - 12;
                        } else if (inputRef.current.keyboard.arrowDown && gameState.paddle1Y < CANVAS_HEIGHT - gameState.paddle1Height) {
                            newPaddleY = gameState.paddle1Y + 12;
                        }
                    } else {
                        if (inputRef.current.keyboard.arrowUp && gameState.paddle2Y > 0) {
                            newPaddleY = gameState.paddle2Y - 12;
                        } else if (inputRef.current.keyboard.arrowDown && gameState.paddle2Y < CANVAS_HEIGHT - gameState.paddle2Height) {
                            newPaddleY = gameState.paddle2Y + 12;
                        }
                    }
                }
                // Throttled emission
                if (newPaddleY !== null && Date.now() - lastPaddleMoveRef.current > 50 && !!state.gameId) {
                    socketService.paddleMove(playerNumber, newPaddleY, state?.gameId);
                    lastPaddleMoveRef.current = Date.now();
                }
            }, 16);
            return () => clearInterval(paddleInterval);
        }, [playerNumber, gameState]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            // gameContext
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            // Clear canvas
            ctx.fillStyle = '#0a0e27';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.setLineDash([10, 10]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(CANVAS_WIDTH / 2, 0);
            ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]);
            // Player addresses
            ctx.font = '12px Ribeye';
            ctx.fillStyle = '#64c8ff';
            ctx.textAlign = 'left';
            ctx.fillText(state?.player1 ? "You" : 'Opponent', 30, 25);
            ctx.textAlign = 'right';
            ctx.fillText(state?.player2 === address ? "You" : 'Opponent', CANVAS_WIDTH - 30, 25);
            // Paddles with glow
            ctx.fillStyle = gameState.activePowerups.player1 === 'padStretch' ? '#fbbf24' : '#06b6d4';
            ctx.shadowColor = gameState.activePowerups.player1 === 'padStretch' ? '#fbbf24' : '#06b6d4';
            ctx.shadowBlur = gameState.activePowerups.player1 === 'padStretch' ? 20 : 8;
            ctx.fillRect(20, gameState.paddle1Y, PADDLE_WIDTH, gameState.paddle1Height);

            ctx.fillStyle = gameState.activePowerups.player2 === 'padStretch' ? '#fbbf24' : '#a855f7';
            ctx.shadowColor = gameState.activePowerups.player2 === 'padStretch' ? '#fbbf24' : '#a855f7';
            ctx.shadowBlur = gameState.activePowerups.player2 === 'padStretch' ? 20 : 8;
            ctx.fillRect(CANVAS_WIDTH - 20 - PADDLE_WIDTH, gameState.paddle2Y, PADDLE_WIDTH, gameState.paddle2Height);

            ctx.shadowBlur = 0;
            // Ball with glow
            ctx.fillStyle = '#ec4899';
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(gameState.ballX, gameState.ballY, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 3;
            // Score
            ctx.font = 'bold 48px Ribeye';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(gameState.score1.toString(), CANVAS_WIDTH / 4, 70);
            ctx.fillText(gameState.score2.toString(), (CANVAS_WIDTH * 3) / 4, 70);
            // Countdown
            if (countdown.active) {
                ctx.font = 'bold 72px Ribeye';
                ctx.fillStyle = '#fbbf24';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 30;
                ctx.fillText(countdown.remaining.toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                ctx.shadowBlur = 0;
            }
        }, [gameState, countdown, address]);

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
}