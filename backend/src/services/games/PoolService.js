const BaseGameService = require('../base/BaseGameService');

/**
 * Pool/Billiards Service
 * Note: This is a placeholder. Full pool implementation requires:
 * - Complex physics for ball collisions
 * - Pocket detection
 * - Turn-based gameplay
 * - Foul detection
 * - 8-ball/9-ball rules
 */
class PoolService extends BaseGameService {
  constructor() {
    super('pool');
  }

  getInitialGameState() {
    return {
      balls: this.getInitialBalls(),
      cueBall: { x: -0.5, y: 0, vx: 0, vy: 0 },
      cueStick: { angle: 0, power: 0 },
      currentPlayer: 0,
      playerBalls: { player1: null, player2: null }, // 'solids' or 'stripes'
      pocketed: [],
      score: [0, 0],
      foulCount: [0, 0],
      isAiming: false,
      isShooting: false,
      friction: 0.985
    };
  }

  getInitialBalls() {
    // Triangle rack formation for 8-ball
    // TODO: Implement full ball physics
    return [
      // Ball 1-7 (solids)
      { id: 1, x: 0.5, y: 0, vx: 0, vy: 0, type: 'solid' },
      { id: 2, x: 0.55, y: 0.025, vx: 0, vy: 0, type: 'solid' },
      // ... more balls
      // Ball 8 (black)
      { id: 8, x: 0.6, y: 0, vx: 0, vy: 0, type: 'eight' },
      // Ball 9-15 (stripes)
      { id: 9, x: 0.65, y: 0.025, vx: 0, vy: 0, type: 'stripe' }
      // ... more balls
    ];
  }

  updateGameState(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game || game.isPaused || !game.isShooting) return null;

    // Update ball physics
    let anyMoving = false;

    // Update cue ball
    if (Math.abs(game.cueBall.vx) > 0.001 || Math.abs(game.cueBall.vy) > 0.001) {
      game.cueBall.x += game.cueBall.vx;
      game.cueBall.y += game.cueBall.vy;
      game.cueBall.vx *= game.friction;
      game.cueBall.vy *= game.friction;
      anyMoving = true;
    } else {
      game.cueBall.vx = 0;
      game.cueBall.vy = 0;
    }

    // Update other balls
    for (const ball of game.balls) {
      if (Math.abs(ball.vx) > 0.001 || Math.abs(ball.vy) > 0.001) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= game.friction;
        ball.vy *= game.friction;
        anyMoving = true;
      } else {
        ball.vx = 0;
        ball.vy = 0;
      }

      // Check pocket collisions
      this.checkPocketCollisions(game, ball);
    }

    // Check ball-to-ball collisions
    this.checkBallCollisions(game);

    // Check wall collisions
    this.checkWallCollisions(game);

    // If no balls moving, turn ends
    if (!anyMoving && game.isShooting) {
      game.isShooting = false;
      game.isAiming = true;
      game.currentPlayer = 1 - game.currentPlayer;
    }

    return game;
  }

  shoot(roomCode, socketId, angle, power) {
    const game = this.activeGames.get(roomCode);
    if (!game) return { success: false, error: 'Game not found' };

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex !== game.currentPlayer) {
      return { success: false, error: 'Not your turn' };
    }

    if (!game.isAiming) {
      return { success: false, error: 'Cannot shoot now' };
    }

    // Apply force to cue ball
    const maxPower = 5;
    const actualPower = Math.min(power, maxPower);

    game.cueBall.vx = Math.cos(angle) * actualPower * 0.01;
    game.cueBall.vy = Math.sin(angle) * actualPower * 0.01;

    game.isAiming = false;
    game.isShooting = true;

    return { success: true, game };
  }

  checkPocketCollisions(game, ball) {
    // TODO: Implement pocket detection
    // Pockets at corners and middle of long sides
  }

  checkBallCollisions(game) {
    // TODO: Implement ball-to-ball collision physics
  }

  checkWallCollisions(game) {
    // TODO: Implement wall bounce physics
  }

  checkGameOver(gameState) {
    // Game over when 8-ball is pocketed (legally)
    const eightBallPocketed = gameState.pocketed.some(b => b.id === 8);

    if (eightBallPocketed) {
      // TODO: Check if pocketed legally
      const winnerIndex = gameState.currentPlayer;
      return {
        gameOver: true,
        winner: gameState.players[winnerIndex],
        isDraw: false
      };
    }

    return { gameOver: false };
  }
}

module.exports = PoolService;
