# Chain Skill Games - Backend

Structured backend server with **Controller → Service → Repository** architecture supporting multiple games with independent leaderboards, blockchain integration, and multi-device synchronization.

## Architecture Overview

```
Controller Layer (HTTP/Socket.IO)
       ↓
Service Layer (Business Logic)
       ↓
Repository Layer (Database Access)
       ↓
Model Layer (Mongoose Schemas)
```

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── socket.js        # Socket.IO setup
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── Player.js        # Player profile
│   │   ├── PlayerGameStats.js   # Per-game player stats
│   │   ├── Game.js          # Game records
│   │   └── Session.js       # Multi-device sessions
│   │
│   ├── repositories/        # Database operations
│   │   ├── BaseRepository.js
│   │   ├── PlayerRepository.js
│   │   ├── PlayerGameStatsRepository.js
│   │   ├── GameRepository.js
│   │   └── SessionRepository.js
│   │
│   ├── services/            # Business logic
│   │   ├── base/
│   │   │   └── BaseGameService.js     # Abstract game service
│   │   ├── games/
│   │   │   ├── PingPongService.js
│   │   │   ├── AirHockeyService.js
│   │   │   ├── ChessService.js
│   │   │   └── PoolService.js
│   │   ├── LeaderboardService.js      # Per-game leaderboards
│   │   ├── PaymentService.js          # Blockchain payments
│   │   ├── ConnectionService.js       # Multi-device sync
│   │   ├── RoomService.js             # Room management
│   │   └── SignatureService.js        # Winner signatures
│   │
│   ├── handlers/            # Socket.IO handlers
│   │   └── GameHandler.js             # Unified game handler
│   │
│   ├── routes/              # Express routes
│   │   └── index.js                   # API routes
│   │
│   ├── utils/
│   │   └── eloCalculator.js           # ELO rating calculator
│   │
│   └── server.js            # Main entry point
│
├── .env.example
├── package.json
└── README.md
```

## Key Features

### 1. Per-Game Leaderboards
Each game (PingPong, AirHockey, Chess, Pool) has its own independent leaderboard:
- Separate ELO ratings per game
- Individual stats (wins, losses, win streak)
- Player can have different rankings in each game

### 2. Blockchain Integration
- Staked matches with ETH
- Winner signature generation
- Prize claim tracking
- Transaction verification

### 3. Multi-Device Synchronization
- Players can connect from multiple devices
- Game state synced across all devices
- Automatic reconnection handling

### 4. Contract Integration
- Payment management via smart contracts
- Signature service for winner verification
- Claim tracking

## Data Models

### Player
```javascript
{
  name: String,
  walletAddress: String (unique),
  avatar: String,
  lastActive: Date
}
```

### PlayerGameStats (Per-Game Stats)
```javascript
{
  playerId: ObjectId,
  playerName: String,
  gameType: 'pingpong' | 'airhockey' | 'chess' | 'pool',
  rating: Number (default: 1000),
  gamesPlayed: Number,
  wins: Number,
  losses: Number,
  winStreak: Number,
  totalEarnings: String
}
```

### Game
```javascript
{
  roomCode: String,
  gameType: String,
  player1: { name, rating, walletAddress },
  player2: { name, rating, walletAddress },
  winner: 'player1' | 'player2' | null,
  score: Object,
  isStaked: Boolean,
  stakeAmount: String,
  winnerSignature: String,
  claimed: Boolean,
  status: 'waiting' | 'playing' | 'finished'
}
```

## API Endpoints

### Leaderboards
- `GET /api/leaderboard/:gameType` - Get leaderboard for specific game
- `GET /api/leaderboard` - Get global leaderboard

### Players
- `GET /api/players` - Get all players
- `GET /api/players/wallet/:address` - Get player by wallet
- `GET /api/players/:playerId/stats/:gameType` - Get player stats for game
- `GET /api/players/:playerId/stats` - Get all stats for player

### Games
- `GET /api/games/:roomCode` - Get game by room code
- `GET /api/games/type/:gameType` - Get recent games for game type
- `GET /api/games/player/:playerName/history` - Get player game history

### Payments
- `GET /api/payments/unclaimed/:address` - Get unclaimed wins
- `POST /api/payments/claim` - Mark game as claimed

## Socket.IO Events

### Room Events
- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `leaveRoom` - Leave current room
- `getActiveGames` - Get list of active games

### Game Events (PingPong/AirHockey)
- `paddleMove` - Update paddle position
- `strikerMove` - Update striker position (air hockey)

### Chess Events
- `chessMove` - Make a chess move

### Pool Events
- `poolShoot` - Take a pool shot

### Common Events
- `pauseGame` - Pause the game
- `resumeGame` - Resume the game
- `forfeitGame` - Forfeit the game

### Payment Events
- `createStakedGame` - Create a staked match
- `player2StakeCompleted` - Player 2 completed stake

### Leaderboard Events
- `getLeaderboard` - Get leaderboard for game type
- `leaderboardUpdate` - (emitted) Leaderboard updated

### Server Events (emitted)
- `roomCreated` - Room created successfully
- `roomReady` - Room ready, game starting
- `gameStart` - Game started
- `gameUpdate` - Game state updated
- `gameOver` - Game ended
- `gamePaused` - Game paused
- `gameResumed` - Game resumed
- `playerForfeited` - Player forfeited
- `error` - Error occurred

## Installation & Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/chain-skill-games
   FRONTEND_URL=http://localhost:3000
   SIGNING_WALLET_PRIVATE_KEY=your_private_key_here
   ```

3. **Start MongoDB:**
   ```bash
   mongod
   ```

4. **Run the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Adding a New Game

To add a new game type:

1. **Create game service** in `src/services/games/`:
   ```javascript
   const BaseGameService = require('../base/BaseGameService');

   class MyGameService extends BaseGameService {
     constructor() {
       super('mygame');
     }

     getInitialGameState() {
       return { /* initial state */ };
     }

     updateGameState(roomCode) {
       // Game loop logic
     }

     checkGameOver(gameState) {
       // Win condition logic
     }
   }

   module.exports = MyGameService;
   ```

2. **Register in GameHandler** (`src/handlers/GameHandler.js`):
   ```javascript
   const MyGameService = require('../services/games/MyGameService');

   this.gameServices = {
     // ... existing games
     mygame: new MyGameService()
   };
   ```

3. **Add to GAME_TYPES** in `src/models/PlayerGameStats.js`:
   ```javascript
   const GAME_TYPES = ['pingpong', 'airhockey', 'chess', 'pool', 'mygame'];
   ```

4. **Update frontend** to use new game type

## How It Works

### Game Flow

1. **Player creates room:**
   ```javascript
   socket.emit('createRoom', {
     gameType: 'pingpong',
     player: { name: 'Alice', rating: 1000, walletAddress: '0x...' }
   });
   ```

2. **Player joins room:**
   ```javascript
   socket.emit('joinRoom', {
     roomCode: 'ABC123',
     player: { name: 'Bob', rating: 1050, walletAddress: '0x...' }
   });
   ```

3. **Game starts automatically** when both players are ready

4. **Game loop runs at 60 FPS**, emitting updates:
   ```javascript
   socket.on('gameUpdate', (gameState) => {
     // Update game UI
   });
   ```

5. **Game ends**, ratings update, leaderboard refreshes:
   ```javascript
   socket.on('gameOver', ({ winner, ratings }) => {
     // Show game over screen
   });
   ```

### Staked Matches

1. **Player 1 creates staked game:**
   ```javascript
   socket.emit('createStakedGame', {
     roomCode: 'ABC123',
     gameType: 'pingpong',
     player1: { name: 'Alice', rating: 1000 },
     stakeAmount: '0.01',
     player1Address: '0x...',
     player1TxHash: '0x...'
   });
   ```

2. **Player 2 joins and stakes:**
   ```javascript
   socket.emit('player2StakeCompleted', {
     roomCode: 'ABC123',
     player2: { name: 'Bob', rating: 1050 },
     player2Address: '0x...',
     player2TxHash: '0x...'
   });
   ```

3. **Game plays normally**, winner receives signature for claiming

## Multi-Device Support

Players can connect from multiple devices. Game state automatically syncs:

```javascript
// Connection includes deviceId
const socket = io(SERVER_URL, {
  query: {
    username: 'Alice',
    walletAddress: '0x...',
    deviceId: 'device-123'
  }
});

// All devices receive updates
socket.on('gameUpdate', (state) => {
  // Synced across all devices
});
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS
- `SIGNING_WALLET_PRIVATE_KEY` - Private key for signing winner proofs
- `NODE_ENV` - Environment (development/production)
- `KEEP_RENDER_ALIVE` - Keep-alive for cloud hosting (optional)

## Testing

Test the server:

1. **Health check:**
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Get leaderboard:**
   ```bash
   curl http://localhost:8080/api/leaderboard/pingpong
   ```

3. **WebSocket connection:**
   ```javascript
   const socket = io('http://localhost:8080', {
     query: { username: 'TestUser', walletAddress: '0x...' }
   });
   ```

## License

MIT
