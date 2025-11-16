import { io, Socket } from "socket.io-client";
import { GameType, Player, GameState, GameResult } from "@/types/game";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(username: string, walletAddress: string) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
    if (this.socket && this.socket.connected) {
      console.log("⚠️ Socket already connected. Skipping new connection.");
      return;
    }

    if (this.socket) {
      console.log("🧹 Cleaning up old socket before reconnecting...");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(backendUrl, {
      query: { username, walletAddress},
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to backend");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from backend:", reason);
    });

    this.socket.on("error", (data: { message: string }) => {
      console.log("⚠️ Socket error:", data);
      this.emit("error", data.message);
    });

    this.setupGameEventListeners();
  }

  private ensureConnected() {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket is not connected. Reconnecting...");
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      this.socket = io(backendUrl, { transports: ["websocket"] });
    }
  }

  private setupGameEventListeners() {
    if (!this.socket) return;

    this.socket.on("roomCreated", (data: { roomCode: string; room: any }) => {
      this.emit("roomCreated", data);
    });

    this.socket.on("waitingForOpponent", (data: { roomCode: string }) => {
      this.emit("waitingForOpponent", data);
    });

    this.socket.on("roomReady", (data: { room: any }) => {
      this.emit("roomReady", data);
    });

    this.socket.on("gameStart", (gameState: GameState) => {
      this.emit("gameStart", gameState);
    });

    this.socket.on("gameUpdate", (gameState: GameState) => {
      this.emit("gameUpdate", gameState);
    });

    this.socket.on("gameOver", (result: GameResult) => {
      this.emit("gameOver", result);
    });

    this.socket.on("gamePaused", (data: { pausesRemaining: number }) => {
      this.emit("gamePaused", data);
    });

    this.socket.on("gameResumed", () => {
      this.emit("gameResumed");
    });

    this.socket.on("opponentLeft", () => {
      this.emit("opponentLeft");
    });

    this.socket.on("opponentDisconnected", () => {
      this.emit("opponentDisconnected");
    });

    this.socket.on("leaderboardUpdate", (data: { gameType: GameType; leaderboard: any[] }) => {
        this.emit("leaderboardUpdate", data);
      }
    );
  }

  createRoom(gameType: GameType, player: Player, roomCode?: string) {
    this.socket?.emit("createRoom", { gameType, player, roomCode });
  }

  joinRoom(roomCode: string, player: Player) {
    this.socket?.emit("joinRoom", { roomCode, player });
  }

  findQuickMatch(walletAddress:string, gameType: GameType, isStaked:boolean) {
    this.ensureConnected();
    this.socket?.emit("findQuickMatch", {walletAddress, gameType, isStaked});
  }

  createQuickMatch(gameType: GameType, player: Player) {
    this.ensureConnected();
    this.socket?.emit("createQuickMatch", { gameType, player });
  }

  joinQuickMatch(gameType: GameType, player: Player) {
    this.ensureConnected();
    this.socket?.emit("joinQuickMatch", { gameType, player });
  }

  createStakedGame(data: {
    roomCode: string;
    gameType: GameType;
    player1: Player;
    stakeAmount: string;
    player1Address: string;
    player1TxHash: string;
  }) {
    this.socket?.emit("createStakedGame", data);
  }

  leaveRoom() {
    this.socket?.emit("leaveRoom");
  }

  paddleMove(data: { position: number }) {
    this.socket?.emit("paddleMove", data);
  }

  // strikerMove(position: { x: number; y: number }) {
  //   this.socket?.emit("strikerMove", { position });
  // }

  // chessMove(moveData: { from: string; to: string; promotion?: string }) {
  //   this.socket?.emit("chessMove", moveData);
  // }

  // poolShoot(angle: number, power: number) {
  //   this.socket?.emit("poolShoot", { angle, power });
  // }

  // checkersMove(moveData: { from: { row: number; col: number }; to: { row: number; col: number } }) {
  //   this.socket?.emit("checkersMove", moveData);
  // }

  pauseGame() {
    this.socket?.emit("pauseGame");
  }

  resumeGame() {
    this.socket?.emit("resumeGame");
  }

  forfeitGame() {
    this.socket?.emit("forfeitGame");
  }

  getLeaderboard(gameType: GameType, limit = 10) {
    this.socket?.emit("getLeaderboard", { gameType, limit });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketService();
