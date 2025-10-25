const BaseGameService = require('../base/BaseGameService');

class AirHockeyService extends BaseGameService {
  constructor() {
    super('airhockey');
  }

  getInitialGameState() {
    return {
      score: [0, 0],
      puckPos: { x: 0, y: 0 },
      puckVelocity: this.getInitialPuckVelocity(),
      strikers: {
        player1: { x: -0.6, y: 0 },
        player2: { x: 0.6, y: 0 }
      },
      hits: 0,
      friction: 0.98 // Air hockey has less friction
    };
  }

  updateGameState(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game || game.isPaused) return null;

    // Apply friction
    game.puckVelocity.x *= game.friction;
    game.puckVelocity.y *= game.friction;

    // Update puck position
    game.puckPos.x += game.puckVelocity.x * 0.006;
    game.puckPos.y += game.puckVelocity.y * 0.006;

    // Wall collisions (top and bottom)
    if (Math.abs(game.puckPos.y) > 0.9) {
      game.puckVelocity.y *= -0.95; // Energy loss on wall bounce
      game.puckPos.y = Math.sign(game.puckPos.y) * 0.9;
    }

    // Goal detection
    if (Math.abs(game.puckPos.x) > 1) {
      if (Math.abs(game.puckPos.y) < 0.3) { // Goal area
        if (game.puckPos.x > 1) {
          game.score[0]++;
        } else {
          game.score[1]++;
        }

        const gameOverCheck = this.checkGameOver(game);
        if (gameOverCheck.gameOver) {
          return { ...game, ...gameOverCheck };
        }

        this.resetPuck(game);
        return game;
      } else {
        // Hit side wall, bounce back
        game.puckVelocity.x *= -0.9;
        game.puckPos.x = Math.sign(game.puckPos.x) * 1;
      }
    }

    // Striker collisions
    this.checkStrikerCollisions(game);

    return game;
  }

  checkGameOver(gameState) {
    const winningScore = 7;
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

  updateStriker(roomCode, socketId, position) {
    const game = this.activeGames.get(roomCode);
    if (!game) return null;

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const strikerKey = `player${playerIndex + 1}`;

    // Restrict striker to player's half
    const maxX = playerIndex === 0 ? -0.1 : 1;
    const minX = playerIndex === 0 ? -1 : 0.1;

    game.strikers[strikerKey].x = Math.max(minX, Math.min(maxX, position.x));
    game.strikers[strikerKey].y = Math.max(-0.9, Math.min(0.9, position.y));

    return game;
  }

  checkStrikerCollisions(game) {
    const strikerIds = ['player1', 'player2'];
    const strikerRadius = 0.08;
    const puckRadius = 0.05;

    for (const strikerId of strikerIds) {
      const striker = game.strikers[strikerId];
      const dx = game.puckPos.x - striker.x;
      const dy = game.puckPos.y - striker.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < strikerRadius + puckRadius) {
        game.hits = (game.hits || 0) + 1;

        // Calculate bounce direction
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(game.puckVelocity.x ** 2 + game.puckVelocity.y ** 2);
        const hitStrength = Math.min(speed * 1.2, 4); // Max speed cap

        game.puckVelocity.x = Math.cos(angle) * hitStrength;
        game.puckVelocity.y = Math.sin(angle) * hitStrength;

        // Move puck away from striker
        const overlap = strikerRadius + puckRadius - distance;
        game.puckPos.x += Math.cos(angle) * overlap;
        game.puckPos.y += Math.sin(angle) * overlap;
      }
    }
  }

  resetPuck(game) {
    game.puckPos = { x: 0, y: 0 };
    game.puckVelocity = this.getInitialPuckVelocity();
  }

  getInitialPuckVelocity() {
    const speed = 1.5;
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    return {
      x: speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1),
      y: speed * Math.sin(angle)
    };
  }
}

module.exports = AirHockeyService;
