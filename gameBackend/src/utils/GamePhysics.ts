import { Ball, GAME_CONSTANTS } from ".";

export class PongPhysics {
  static createBall(): Ball {
    const angle = (Math.random() - 0.5) * (Math.PI / 4);
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      x: GAME_CONSTANTS.CANVAS_WIDTH / 2,
      y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
      dx: Math.cos(angle) * GAME_CONSTANTS.BALL_SPEED_INITIAL * direction,
      dy: Math.sin(angle) * GAME_CONSTANTS.BALL_SPEED_INITIAL,
      speed: GAME_CONSTANTS.BALL_SPEED_INITIAL,
      radius: GAME_CONSTANTS.BALL_RADIUS,
    };
  }

  static resetBall(): Ball {
    return this.createBall();
  }

  static updateBall(ball: Ball, paddle1Y: number, paddle2Y: number, paddle1Height: number, paddle2Height: number) {
    const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH;
    const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT;
    const PADDLE_WIDTH = GAME_CONSTANTS.PADDLE_WIDTH;

    // Update position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > CANVAS_HEIGHT) {
      ball.dy = -ball.dy;
      ball.y = Math.max(ball.radius, Math.min(CANVAS_HEIGHT - ball.radius, ball.y));
    }

    // Left paddle collision
    if (
      ball.dx < 0 &&
      ball.x - ball.radius < PADDLE_WIDTH + 20 &&
      ball.y > paddle1Y &&
      ball.y < paddle1Y + paddle1Height
    ) {
      ball.dx = -ball.dx * GAME_CONSTANTS.BALL_ACCELERATION;
      ball.x = PADDLE_WIDTH + 20 + ball.radius;
      ball.speed = Math.min(ball.speed * GAME_CONSTANTS.BALL_ACCELERATION, GAME_CONSTANTS.BALL_SPEED_MAX);
    }

    if (
      ball.dx > 0 &&
      ball.x + ball.radius > CANVAS_WIDTH - PADDLE_WIDTH - 20 &&
      ball.y > paddle2Y &&
      ball.y < paddle2Y + paddle2Height
    ) {
      ball.dx = -ball.dx * GAME_CONSTANTS.BALL_ACCELERATION;
      ball.x = CANVAS_WIDTH - PADDLE_WIDTH - 20 - ball.radius;
      ball.speed = Math.min(ball.speed * GAME_CONSTANTS.BALL_ACCELERATION, GAME_CONSTANTS.BALL_SPEED_MAX);
    }

    return { scored: false, scoredBy: null };
  }

  static checkScoring(ball: Ball): { scored: boolean; scoredBy: number | null } {
    if (ball.x < 0) return { scored: true, scoredBy: 2 };
    if (ball.x > GAME_CONSTANTS.CANVAS_WIDTH) return { scored: true, scoredBy: 1 };
    return { scored: false, scoredBy: null };
  }
}
