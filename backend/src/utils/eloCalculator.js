/**
 * ELO Rating Calculator
 * Used for calculating player ratings across all games
 */

const K_FACTOR = 32;

/**
 * Calculate expected score for a player
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's current rating
 * @returns {number} Expected score (0-1)
 */
function calculateExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's current rating
 * @param {string} outcome - 'win', 'loss', or 'draw'
 * @returns {number} New rating
 */
function calculateElo(playerRating, opponentRating, outcome) {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);

  let actualScore;
  if (outcome === 'win') {
    actualScore = 1;
  } else if (outcome === 'loss') {
    actualScore = 0;
  } else if (outcome === 'draw') {
    actualScore = 0.5;
  } else {
    throw new Error('Invalid outcome. Must be "win", "loss", or "draw"');
  }

  const newRating = playerRating + K_FACTOR * (actualScore - expectedScore);
  return Math.round(newRating);
}

/**
 * Calculate rating changes for both players
 * @param {number} winnerRating - Winner's current rating
 * @param {number} loserRating - Loser's current rating
 * @param {boolean} isDraw - Whether the game was a draw
 * @returns {object} { winnerNewRating, loserNewRating }
 */
function calculateRatingChanges(winnerRating, loserRating, isDraw = false) {
  if (isDraw) {
    return {
      player1NewRating: calculateElo(winnerRating, loserRating, 'draw'),
      player2NewRating: calculateElo(loserRating, winnerRating, 'draw')
    };
  }

  const winnerNewRating = calculateElo(winnerRating, loserRating, 'win');
  const loserNewRating = calculateElo(loserRating, winnerRating, 'loss');

  // Ensure winner always gains at least 5 points
  const finalWinnerRating = Math.max(winnerNewRating, winnerRating + 5);

  return {
    winnerNewRating: finalWinnerRating,
    loserNewRating
  };
}

module.exports = {
  calculateElo,
  calculateExpectedScore,
  calculateRatingChanges
};
