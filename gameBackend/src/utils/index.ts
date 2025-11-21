import dotenv from "dotenv";
dotenv.config()

const PORT = process.env.PORT;
export async function selfPing() {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/v1/`);
    if (response.ok) {
      return;
    }
    console.error(
      `[Ping] FAILED! Status: ${response.status} ${response.statusText}`
    );
  } catch (error) {
    console.error(`[Ping] ERROR during self-ping:`, error);
  }
}

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 500,
  PADDLE_WIDTH: 15,
  PADDLE_HEIGHT: 100,
  PADDLE_HEIGHT_STRETCHED: 150,
  BALL_RADIUS: 8,
  BALL_SPEED_INITIAL: 5,
  BALL_SPEED_MAX: 10,
  BALL_ACCELERATION: 1.05,
  WIN_SCORE: 5,
  POWERUP_DURATION_FRAMES: 300,
  POWERUP_COOLDOWN_MS: 3000,
  DISCONNECT_TIMEOUT_MS: 5000,
  COUNTDOWN_DURATION_MS: 3000,
  SCORE_PAUSE_DURATION_MS: 1000,
  GAME_LOOP_FPS: 60,
  GAME_LOOP_INTERVAL_MS: 1000 / 60,
};

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  radius: number;
}

export interface Paddle {
  y: number;
  height: number;
  speed: number;
}

export interface PlayerGameState {
  address: string;
  paddleY: number;
  score: number;
  activePowerup: string | null;
  powerupDuration: number;
  powerupCooldowns: Record<string, number>;
  shieldActive: boolean;
  disconnected: boolean;
  disconnectTime?: number;
}

export interface GameState {
  gameId: string;
  sessionId: string;
  player1: PlayerGameState;
  player2: PlayerGameState;
  ball: Ball;
  status: 'COUNTDOWN' | 'PLAYING' | 'SCORE_PAUSE' | 'ENDED';
  winner?: string;
  startTime: number;
  countdownStartTime?: number;
}

export interface GameUpdatePayload {
  ballX: number;
  ballY: number;
  paddle1Y: number;
  paddle2Y: number;
  paddle1Height: number;
  paddle2Height: number;
  score1: number;
  score2: number;
  activePowerups: { player1: string | null; player2: string | null };
  status: string;
}