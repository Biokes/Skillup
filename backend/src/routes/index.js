const express = require('express');
const LeaderboardService = require('../services/LeaderboardService');
const PaymentService = require('../services/PaymentService');
const GameRepository = require('../repositories/GameRepository');
const PlayerRepository = require('../repositories/PlayerRepository');
const PlayerGameStatsRepository = require('../repositories/PlayerGameStatsRepository');

const router = express.Router();

const leaderboardService = new LeaderboardService();
const paymentService = new PaymentService();
const gameRepo = new GameRepository();
const playerRepo = new PlayerRepository();
const statsRepo = new PlayerGameStatsRepository();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    frontend_url: process.env.FRONTEND_URL || 'not set',
    signer_address: paymentService.getSignerAddress()
  });
});

router.get('/leaderboard/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const leaderboard = await leaderboardService.getGameLeaderboard(gameType, limit, offset);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await leaderboardService.getGlobalLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch global leaderboard' });
  }
});

router.get('/players', async (req, res) => {
  try {
    const players = await playerRepo.find({}, { sort: { createdAt: -1 } });
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

router.get('/players/wallet/:address', async (req, res) => {
  try {
    const player = await playerRepo.findByWalletAddress(req.params.address);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

router.get('/players/:playerId/stats/:gameType', async (req, res) => {
  try {
    const { playerId, gameType } = req.params;
    const stats = await statsRepo.findByPlayerAndGame(playerId, gameType);

    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/players/:playerId/stats', async (req, res) => {
  try {
    const stats = await leaderboardService.getAllPlayerStats(req.params.playerId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/games/:roomCode', async (req, res) => {
  try {
    const game = await gameRepo.findByRoomCode(req.params.roomCode);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

router.get("/games/activeGames/:gameType", async (req, res) => {
  const gameType = req.params.gameType;
  const game = await gameRepo.getActiveGameByGameType(gameType)
  if (!game) {
    return res.status(200).json({
      isSuccessful: false,
      data: "no game available"
    })
  }
   else { 
       return res.status(200).json({
      isSuccessful: true,
      data: game
    })
   } 
})

router.get('/games/type/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const games = await gameRepo.findFinishedGames(gameType, limit);
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/games/player/:playerName/history', async (req, res) => {
  try {
    const { playerName } = req.params;
    const gameType = req.query.gameType;
    const filters = {
      result: req.query.result || 'all',
      staked: req.query.staked === 'true' ? true : req.query.staked === 'false' ? false : null,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const games = await gameRepo.getPlayerGameHistory(playerName, gameType, filters);
    const totalCount = await gameRepo.count({
      gameType,
      status: 'finished',
      $or: [
        { 'player1.name': playerName },
        { 'player2.name': playerName }
      ]
    });

    res.json({
      games,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

router.get('/payments/unclaimed/:address', async (req, res) => {
  try {
    const games = await paymentService.getUnclaimedWins(req.params.address);
    res.json(games);
  } catch (error) {
    console.error('Error fetching unclaimed wins:', error);
    res.status(500).json({ error: 'Failed to fetch unclaimed wins' });
  }
});

router.post('/payments/claim', async (req, res) => {
  try {
    const { gameId, claimTxHash } = req.body;

    if (!gameId || !claimTxHash) {
      return res.status(400).json({ error: 'gameId and claimTxHash are required' });
    }

    const game = await paymentService.markAsClaimed(gameId, claimTxHash);
    res.json({ success: true, game });
  } catch (error) {
    console.error('Error marking game as claimed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
