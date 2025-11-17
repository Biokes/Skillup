import { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { toast } from 'sonner';
import { MatchType, Player, GameState, GameResult, GameType } from '@/types/game';
import { GameContext } from "@/hooks/useGameContext";

export default function GameProviders({ children }: { children: ReactNode }) {
    const [gameType, setGameType] = useState<GameType | ''>("");
    const [showMatchModal, setShowMatchModal] = useState(true);
    const [matchType, setMatchType] = useState<MatchType | null>(null);
    const [error, setRoomCode] = useState<string>('');
    const [showRoomView, setShowRoomView] = useState<'create' | 'join' | 'waiting' | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [waitingToastId, setWaitingToastId] = useState<string | number | null>(null);
    const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const playerName = "Anonymous";

    useEffect(() => {
        // let storedName = localStorage.getItem("chainSkillsName");
        // if (!storedName) {
        //     storedName = "player" + Math.floor(Math.random() * 100000);
        //     localStorage.setItem("chainSkillsName", storedName);
        // }
        // console.log("about to connect with name: ", storedName)
        socketService.connect("guest");
        return () => {
            socketService.disconnect();
        };
    }, []);

    const handleRoomCreated = useCallback((data: { roomCode: string }) => {
        setRoomCode(data.roomCode);
        setShowRoomView('create');
        setShowMatchModal(false);
        const toastId = toast.info('Waiting for Player 2 to join...');
        setWaitingToastId(toastId);
    }, []);

    const handleWaitingForOpponent = useCallback((data: { roomCode: string }) => {
        setRoomCode(data.roomCode);
        setShowRoomView('waiting');
        toast.info('Waiting for opponent to join...');
    }, []);

    const handleRoomReady = useCallback(() => {
        if (waitingToastId) {
            toast.dismiss(waitingToastId);
            setWaitingToastId(null);
        }
        toast.success('Opponent found! Get ready...');
        setCountdown(3);
    }, [waitingToastId]);

    const handleGameStart = useCallback((state: GameState) => {
        setGameState(state);
        setIsPlaying(true);
        setShowRoomView(null);
        setShowMatchModal(false);
        setPauseCountdown(null);
        setIsPaused(false);
        toast.success('Game started!');
    }, []);

    const handleGameUpdate = useCallback((state: GameState) => {
        setGameState(state);
    }, []);

    const handleGameOver = useCallback((result: GameResult) => {
        setGameResult(result);
        setIsPlaying(false);
        setGameState(null);
        setIsPaused(false);
        setPauseCountdown(null);

        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }

        if (result.winnerName) {
            toast.success(`${result.winnerName} wins!`, { duration: 5000 });
        } else if (result.isDraw) {
            toast.info('Game ended in a draw!');
        }
    }, []);

    const handleGamePaused = useCallback((data: { pausesRemaining: number }) => {
        setIsPaused(true);
        setPauseCountdown(10);
        toast.info(`Game paused. Resuming in 10 seconds... (${data.pausesRemaining} pauses remaining)`);
    }, []);

    const handleGameResumed = useCallback(() => {
        setIsPaused(false);
        setPauseCountdown(null);

        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }

        toast.info('Game resumed');
    }, []);

    const handleOpponentLeft = useCallback(() => {
        toast.error('Opponent left the game. You win!');
        setIsPlaying(false);
        setGameState(null);
        setIsPaused(false);
        setPauseCountdown(null);

        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }
    }, []);

    const handleOpponentDisconnected = useCallback(() => {
        toast.error('Opponent disconnected. You win!');
        setIsPlaying(false);
        setGameState(null);
        setIsPaused(false);
        setPauseCountdown(null);

        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }
    }, []);

    const handlePlayerForfeited = useCallback((data: { forfeitedPlayer: string; winner: string }) => {
        toast.info(`${data.forfeitedPlayer} forfeited. ${data.winner} wins!`);
    }, []);

    const handleError = useCallback((message: string) => {
        toast.error(message);
    }, []);

    const selectMatchType = useCallback((type: MatchType) => {
        setMatchType(type);

        if (type === 'staked') {
          
            setShowMatchModal(false);
        } else if (type === 'quick' || type === 'friendly') {
            setShowMatchModal(false);
        }
    }, [
        // userAccountId
    ]);

    const createFriendlyRoom = useCallback(() => {
        const player: Player = {
            name: playerName,
            rating: 1000,
            walletAddress: "userAccountId",
        };
        socketService.createRoom(gameType as GameType, player);
    }, [gameType, playerName,
        // userAccountId
    ]);

    const createQuickMatch = useCallback((walletAddress:string, gameCode: string) => {
        socketService.createQuickMatch(walletAddress, gameCode);
    }, [ ]);

    const joinQuickMatch = useCallback(() => {
        let storedName = localStorage.getItem("chainSkillsName");
        if (!storedName) {
            storedName = "player" + Math.floor(Math.random() * 100000);
            localStorage.setItem("chainSkillsName", storedName);
        }

        const player: Player = {
            name: storedName,
            rating: 1000,
            walletAddress: "guest",
        };

        socketService.joinQuickMatch(gameType as GameType, player);
        setShowRoomView('waiting');
    }, [gameType, playerName]);

    const quickMatch = useCallback((walletAddress: string) => {
       socketService.quickMatch(walletAddress,'pingpong',false, 0);
    }, []);

    // const joinFriendlyRoom = useCallback((code: string) => {
    //     const player: Player = {
    //         name: playerName,
    //         rating: 1000,
    //         walletAddress: "",
    //     };
    //     socketService.joinRoom(code, player);
    // }, [playerName,
    //     // userAccountId
    // ]);

    const pauseGame = useCallback(() => {
        if (!isPaused && isPlaying) {
            socketService.pauseGame();
        }
    }, [isPaused, isPlaying]);

    const resumeGame = useCallback(() => {
        if (isPaused && isPlaying) {
            socketService.resumeGame();
        }
    }, [isPaused, isPlaying]);

    const forfeitGame = useCallback(() => {
        socketService.forfeitGame();
    }, []);

    const leaveGame = useCallback(() => {
        socketService.leaveRoom();
        setIsPlaying(false);
        setGameState(null);
        setIsPaused(false);
        setPauseCountdown(null);
        if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
        }
        setShowMatchModal(true);
    }, []);

    const playAgain = useCallback(() => {
        setGameResult(null);
        setShowMatchModal(true);
    }, []);

    // useEffect(() => {
    //     if (countdown === null) return;

    //     if (countdown > 0) {
    //         const timer = setTimeout(() => {
    //             setCountdown(countdown - 1);
    //             toast.info(`${countdown}`, {
    //                 duration: 1000,
    //                 position: 'top-center',
    //             });
    //         }, 1000);

    //         return () => clearTimeout(timer);
    //     } else {
    //         setCountdown(null);
    //         setShowRoomView(null);
    //     }
    // }, [countdown]);

    // useEffect(() => {
    //     if (pauseCountdown === null) return;
    //     if (!isPaused) return;

    //     if (pauseCountdown > 0) {
    //         pauseTimerRef.current = setTimeout(() => {
    //             setPauseCountdown(pauseCountdown - 1);
    //         }, 1000);

    //         return () => {
    //             if (pauseTimerRef.current) {
    //                 clearTimeout(pauseTimerRef.current);
    //             }
    //         };
    //     } else {
    //         socketService.resumeGame();
    //         setPauseCountdown(null);
    //         setIsPaused(false);

    //         if (pauseTimerRef.current) {
    //             clearTimeout(pauseTimerRef.current);
    //             pauseTimerRef.current = null;
    //         }
    //     }
    // }, [pauseCountdown, isPaused]);

    // useEffect(() => {
    //     return () => {
    //         if (pauseTimerRef.current) {
    //             clearTimeout(pauseTimerRef.current);
    //         }
    //     };
    // }, []);

    
    useEffect(() => {
        socketService.on('roomCreated', handleRoomCreated);
        socketService.on('waitingForOpponent', handleWaitingForOpponent);
        socketService.on('roomReady', handleRoomReady);
        socketService.on('gameStart', handleGameStart);
        socketService.on('gameUpdate', handleGameUpdate);
        socketService.on('gameOver', handleGameOver);
        socketService.on('gamePaused', handleGamePaused);
        socketService.on('gameResumed', handleGameResumed);
        socketService.on('opponentLeft', handleOpponentLeft);
        socketService.on('opponentDisconnected', handleOpponentDisconnected);
        socketService.on('playerForfeited', handlePlayerForfeited);
        socketService.on('error', handleError);

        return () => {
            socketService.off('roomCreated', handleRoomCreated);
            socketService.off('waitingForOpponent', handleWaitingForOpponent);
            socketService.off('roomReady', handleRoomReady);
            socketService.off('gameStart', handleGameStart);
            socketService.off('gameUpdate', handleGameUpdate);
            socketService.off('gameOver', handleGameOver);
            socketService.off('gamePaused', handleGamePaused);
            socketService.off('gameResumed', handleGameResumed);
            socketService.off('opponentLeft', handleOpponentLeft);
            socketService.off('opponentDisconnected', handleOpponentDisconnected);
            socketService.off('playerForfeited', handlePlayerForfeited);
            socketService.off('error', handleError);
        };
    }, [
        handleRoomCreated,
        handleWaitingForOpponent,
        handleRoomReady,
        handleGameStart,
        handleGameUpdate,
        handleGameOver,
        handleGamePaused,
        handleGameResumed,
        handleOpponentLeft,
        handleOpponentDisconnected,
        handlePlayerForfeited,
        handleError,
    ]);

    return (
        <GameContext.Provider
            value={{
                showMatchModal,
                matchType,
                errorMessage: roomCode,
                showRoomView,
                gameState,
                isPlaying,
                isPaused,
                pauseCountdown,
                gameResult,
                playerName,
                countdown,
                gameType,
                selectMatchType,
                // createFriendlyRoom,
                // joinFriendlyRoom,
                createQuickMatch,
                joinQuickMatch,
                quickMatch,
                pauseGame,
                resumeGame,
                forfeitGame,
                leaveGame,
                playAgain,
                setShowRoomView,
                setGameType
            }}
        >
            {children}
        </GameContext.Provider>
    )
}