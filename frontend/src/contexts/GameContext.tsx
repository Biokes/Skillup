import { GameContext } from "@/hooks/useGameContext";
import { ReactNode } from "react";
import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socketService';
import { useHederaWallet } from '@/contexts/HederaWalletContext';
import { toast } from 'sonner';
import { MatchType, Player, GameState, GameResult, GameType } from '@/types/game';

export default function GameProviders({ children }: { children: ReactNode }) {
    const { accountId, isConnected } = useHederaWallet();
    const [gameType, setGameType] = useState < GameType | '' > ("")
    const [showMatchModal, setShowMatchModal] = useState(true);
    const [matchType, setMatchType] = useState<MatchType | null>(null);
    const [roomCode, setRoomCode] = useState<string>('');
    const [showRoomView, setShowRoomView] = useState<'create' | 'join' | 'waiting' | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [waitingToastId, setWaitingToastId] = useState<string | number | null>(null);

    const playerName = accountId || `Player_${Math.random().toString(36).substr(2, 6)}`;
    const walletAddress = accountId || '0x0000000000000000000000000000000000000000';

    useEffect(() => {
        socketService.connect(playerName, walletAddress);
        return () => {
            socketService.disconnect();
        };
    }, [playerName, walletAddress]);

    const handleRoomCreated = useCallback((data: { roomCode: string }) => {
        setRoomCode(data.roomCode);
        setShowRoomView('create');
        setShowMatchModal(false);
        const toastId = toast.loading('Waiting for Player 2 to join...', {
            duration: Infinity,
        });
        setWaitingToastId(toastId);
    }, []);

    const handleWaitingForOpponent = useCallback((data: { roomCode: string }) => {
        setRoomCode(data.roomCode);
        setShowRoomView('waiting');
        const toastId = toast.loading('Waiting for opponent to join...', { duration: Infinity });
        setWaitingToastId(toastId);
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
        toast.success('Game started!');
    }, []);

    const handleGameUpdate = useCallback((state: GameState) => {
        setGameState(state);
        setIsPaused(state.isPaused);
    }, []);

    const handleGameOver = useCallback((result: GameResult) => {
        setGameResult(result);
        setIsPlaying(false);
        setGameState(null);

        if (result.winnerName) {
            toast.success(`${result.winnerName} wins!`, { duration: 5000 });
        } else if (result.isDraw) {
            toast.info('Game ended in a draw!');
        }
    }, []);

    const handleGamePaused = useCallback((data: { pausesRemaining: number }) => {
        setIsPaused(true);
        toast.info(`Game paused (${data.pausesRemaining} pauses remaining)`);
    }, []);

    const handleGameResumed = useCallback(() => {
        setIsPaused(false);
        toast.info('Game resumed');
    }, []);

    const handleOpponentLeft = useCallback(() => {
        toast.error('Opponent left the game');
        setIsPlaying(false);
        setGameState(null);
    }, []);

    const handleOpponentDisconnected = useCallback(() => {
        toast.error('Opponent disconnected');
        setIsPlaying(false);
        setGameState(null);
    }, []);

    const handleError = useCallback((message: string) => {
        toast.error(message);
    }, []);

    const selectMatchType = useCallback((type: MatchType) => {
        setMatchType(type);

        if (type === 'staked') {
            if (!isConnected) {
                toast.error('Please connect your wallet first');
                return;
            }
            setShowMatchModal(false);
        } else if (type === 'quick' || type === 'friendly') {
            setShowMatchModal(false);
        }
    }, [isConnected]);

    const createFriendlyRoom = useCallback(() => {
        const player: Player = {
            name: playerName,
            rating: 1000,
            walletAddress,
        };
        socketService.createRoom(gameType as GameType, player);
    }, [gameType, playerName, walletAddress]);

    const createQuickMatch = useCallback(() => {
        const player: Player = {
            name: playerName,
            rating: 1000,
            walletAddress,
        };
        socketService.createQuickMatch(gameType as GameType, player);
        setShowRoomView('waiting');
    }, [gameType, playerName, walletAddress]);

    const joinQuickMatch = useCallback(() => {
        const player: Player = {
            name: playerName,
            rating: 1000,
            walletAddress,
        };
        socketService.joinQuickMatch(gameType, player);
        setShowRoomView('waiting');
    }, [gameType, playerName, walletAddress]);
    
    const joinFriendlyRoom = useCallback((code: string) => {
        const player: Player = {
            name: playerName,
            rating: 1000,
            walletAddress,
        };
        socketService.joinRoom(code, player);
    }, [playerName, walletAddress]);


    const pauseGame = useCallback(() => {
        if (!isPaused) {
            socketService.pauseGame();
        }
    }, [isPaused]);

    const resumeGame = useCallback(() => {
        if (isPaused) {
            socketService.resumeGame();
        }
    }, [isPaused]);

    const forfeitGame = useCallback(() => {
        socketService.forfeitGame();
    }, []);

    const leaveGame = useCallback(() => {
        socketService.leaveRoom();
        setIsPlaying(false);
        setGameState(null);
        setShowMatchModal(true);
    }, []);

    const playAgain = useCallback(() => {
        setGameResult(null);
        setShowMatchModal(true);
    }, []);

    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
                toast.info(`${countdown}`, {
                    duration: 1000,
                    position: 'top-center',
                });
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setCountdown(null);
            setShowRoomView(null);
        }
    }, [countdown]);

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
        handleError,
    ]);

    return (
        <GameContext.Provider
            value={{
                showMatchModal,
                matchType,
                roomCode,
                showRoomView,
                gameState,
                isPlaying,
                isPaused,
                gameResult,
                playerName,
                countdown,
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
                gameType,
                setGameType
            }}
        >
            {children}
        </GameContext.Provider>
    )
}
