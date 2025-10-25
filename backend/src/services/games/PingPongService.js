const BaseGameService = require('../base/BaseGameService');

class PingPongService extends BaseGameService {
  constructor() {
    super('pingpong');
  }

  getInitialGameState() {
    return {
      score: [0, 0],
      ballPos: { x: 0, y: 0 },
      ballVelocity: this.getInitialBallVelocity(),
      paddles: {
        player1: { y: 0 },
        player2: { y: 0 }
      },
      hits: 0
    };
  }

  updateGameState(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game || game.isPaused) return null;

    // Update ball position
    game.ballPos.x += game.ballVelocity.x * 0.0055;
    game.ballPos.y += game.ballVelocity.y * 0.0055;

    // Wall collisions
    if (Math.abs(game.ballPos.y) > 0.95) {
      game.ballVelocity.y *= -1;
      game.ballPos.y = Math.sign(game.ballPos.y) * 0.95;
    }

    // Scoring
    if (Math.abs(game.ballPos.x) > 1) {
      if (game.ballPos.x > 1) {
        game.score[0]++;
      } else {
        game.score[1]++;
      }

      // Check for game over
      const gameOverCheck = this.checkGameOver(game);
      if (gameOverCheck.gameOver) {
        return { ...game, ...gameOverCheck };
      }

      // Reset ball
      this.resetBall(game);
      return game;
    }

    // Paddle collisions
    this.checkPaddleCollisions(game);

    return game;
  }

  checkGameOver(gameState) {
    const winningScore = 5;
    const maxScore = Math.max(...gameState.score);

    if (maxScore >= winningScore) {
      const winnerIndex = gameState.score[0] > gameState.score[1] ? 0 : 1;
      return {
        gameOver: true,
        winner: gameState.players[winnerIndex],
        isDraw: false
      };
    }

    return { gameOver: false };
  }

  updatePaddle(roomCode, socketId, position) {
    const game = this.activeGames.get(roomCode);
    if (!game) return null;

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const paddleKey = `player${playerIndex + 1}`;
    const currentPos = game.paddles[paddleKey].y;
    const damping = 0.8;

    game.paddles[paddleKey].y = currentPos + (position - currentPos) * damping;

    return game;
  }

  checkPaddleCollisions(game) {
    const paddleIds = ['player1', 'player2'];

    for (let i = 0; i < paddleIds.length; i++) {
      const paddleId = paddleIds[i];
      const paddle = game.paddles[paddleId];
      const isLeftPaddle = i === 0;
      const paddleX = isLeftPaddle ? -0.95 : 0.95;
      const paddleHitboxSize = 0.18;

      const ballNearPaddleX = isLeftPaddle
        ? (game.ballPos.x <= paddleX + 0.02 && game.ballVelocity.x < 0)
        : (game.ballPos.x >= paddleX - 0.02 && game.ballVelocity.x > 0);

      if (ballNearPaddleX && Math.abs(game.ballPos.y - paddle.y) <= paddleHitboxSize) {
        game.ballVelocity.x *= -1.05;
        game.hits = (game.hits || 0) + 1;

        const hitPosition = (game.ballPos.y - paddle.y) / paddleHitboxSize;
        game.ballVelocity.y = hitPosition * 2;

        const maxYVelocity = Math.abs(game.ballVelocity.x) * Math.tan(Math.PI / 6);
        game.ballVelocity.y = Math.max(Math.min(game.ballVelocity.y, maxYVelocity), -maxYVelocity);

        game.ballPos.x = paddleX + (isLeftPaddle ? 0.03 : -0.03);
      }
    }
  }

  resetBall(game) {
    game.ballPos = { x: 0, y: 0 };
    game.ballVelocity = this.getInitialBallVelocity();
  }

  getInitialBallVelocity() {
    const speed = 2.2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    return {
      x: speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1),
      y: speed * Math.sin(angle)
    };
  }
}

module.exports = PingPongService;
