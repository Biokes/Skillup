# ChainSkills - On-Chain Competitive Gaming

ChainSkills is a decentralized competitive gaming platform built on the OneChain blockchain. Players can connect their wallets to compete in fast-paced Ping-Pong matches. The platform supports both free casual gameplay and high-stakes matches where players compete for real on-chain assets. Every win, loss, and achievement is recorded on-chain, creating a transparent and trustless gaming experience.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Move Smart Contract](#move-smart-contract)
  - [Game Backend](#game-backend)
  - [Frontend Application](#frontend-application)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features & Implementation](#key-features--implementation)
- [Game Mechanics](#game-mechanics)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Gameplay
- **Wallet Integration**: Players connect their OneChain wallets to participate
- **Free Play**: Casual matches with no stake for practice and fun
- **Staked Matches**: Competitive matches where players wager on-chain assets
- **Real-Time Multiplayer**: WebSocket-based real-time game synchronization
- **Physics-Based Gameplay**: Realistic ball physics with paddle collision detection

### Game Mechanics
- **Paddle Controls**: Smooth paddle movement with keyboard input
- **Power-Ups**: Three types of power-ups to enhance gameplay:
  - **Pad Stretch**: Temporarily increase paddle size
  - **Multi-Ball**: Multiple balls in play simultaneously
  - **Shield**: Protect against losing points for a limited time
- **Scoring System**: First to 5 points wins the match
- **ELO-like Rating**: Player stats tracked including wins, losses, and XP

### Blockchain Features
- **Smart Contract Vault**: OneChain Move contract manages game stakes and payouts
- **Escrow System**: Funds held securely in contract during staked matches
- **Dev Fee**: 5% fee on staked game payouts goes to platform treasury
- **Transaction Transparency**: All game outcomes recorded on-chain

## Architecture Overview

ChainSkills is built as a three-tier application:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│   - Wallet connection & authentication                       │
│   - Real-time game rendering                                │
│   - Game session management                                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┴────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│   - Session & game state management                          │
│   - Real-time game loop & physics                            │
│   - WebSocket multiplayer synchronization                    │
│   - Payment coordination                                      │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON/RPC
┌────────────────────────┴────────────────────────────────────┐
│   Blockchain Layer (OneChain + Move Smart Contract)         │
│   - Game vault management                                    │
│   - Stake escrow & payouts                                   │
│   - Transaction recording                                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Free Play Match:**
1. Player 1 connects wallet and initiates free game
2. Player 2 joins with matching game code
3. Backend creates game session and initializes physics
4. Real-time game loop runs at 60 FPS via WebSocket
5. Game concludes, results stored in PostgreSQL
6. Player stats updated

**Staked Match:**
1. Player 1 connects wallet and initiates staked match with amount
2. Player 1 calls `createGame()` on-chain, funds locked in vault
3. Player 2 joins with matching stake amount
4. Player 2 calls `joinGame()` on-chain, their funds locked in vault
5. Game plays with real-time synchronization
6. Winner calls `endGame()` on-chain, receives stake + prize
7. 5% dev fee automatically deducted to platform treasury

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **@onelabs/dapp-kit** - OneChain wallet integration
- **Socket.IO Client** - Real-time WebSocket communication
- **React Router** - Client-side routing

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type-safe backend code
- **Socket.IO** - Real-time multiplayer communication
- **TypeORM** - Database ORM
- **PostgreSQL** - Primary database
- **Zod** - Schema validation

### Smart Contract
- **Move Language** - OneChain smart contracts
- **OCT Token** - Primary staking currency
- **OneChain Framework** - On-chain logic and events

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10.21.0 or higher) - [Install](https://pnpm.io/installation)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### For Smart Contract Development
- **Sui CLI** - [Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
- **Move VSCode Extension** (optional but recommended)

### For Wallet Testing
- **OneChain Wallet** - [Download](https://www.onelabs.io/)
- Test tokens or testnet OCT for stake testing

## Installation & Setup

### Move Smart Contract

The `chainskills_vault` directory contains the Move smart contract that manages game stakes and payouts.

**1. Install Move/Sui Tools**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked --git https://github.com/move-language/move move-cli
```

**2. Navigate to contract directory**
```bash
cd chainskills_vault
```

**3. Build the contract**
```bash
sui move build
```

**4. Run tests (optional)**
```bash
sui move test
```

**5. Deploy to OneChain**
```bash
# First, ensure your wallet is configured with OneChain RPC
sui client publish --gas-budget 100000000
```

After deployment, update the `VAULT_PACKAGE` and `VAULT_OBJECT_ID` in your frontend `.env` file with the deployed addresses.

**Key Contract Functions:**
- `create_game(vault, stake_amount)` - Player 1 initiates a staked game
- `join_game(vault, game, stake_amount)` - Player 2 joins with matching stake
- `end_game(vault, game, winner_address)` - Owner settles the game and distributes payouts

### Game Backend

**1. Navigate to backend directory**
```bash
cd gameBackend
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Set up PostgreSQL database**

Create a new PostgreSQL database and user:
```sql
CREATE DATABASE chainskills_db;
CREATE USER chainskills_user WITH PASSWORD 'your_secure_password';
ALTER ROLE chainskills_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE chainskills_db TO chainskills_user;
```

**4. Create environment configuration**

Create `.env` file in `gameBackend/` directory:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=chainskills_user
DB_PASSWORD=your_secure_password
DB_DATABASE=chainskills_db

# Blockchain Configuration (Optional - for future payment tracking)
ONECHAIN_RPC_URL=https://onechain-testnet-rpc.example.com
```

**5. Build TypeScript**
```bash
pnpm run build
```

**6. Verify setup**
```bash
pnpm run dev
```

You should see:
```
🚀 Server started on port 5000
🔌 Socket.IO available at ws://localhost:5000/socket.io/
```

### Frontend Application

**1. Navigate to frontend directory**
```bash
cd frontend
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Create environment configuration**

Create `.env` file in `frontend/` directory:
```bash
# Backend API Configuration
VITE_BACKEND_URL=http://localhost:5000
VITE_DEBUG=true

# OneChain Configuration
VITE_ONECHAIN_RPC=https://onechain-testnet-rpc.example.com

# Smart Contract Configuration
VITE_VAULT_PACKAGE=<deployed_package_id_from_contract_deployment>
VITE_VAULT_OBJECT_ID=<deployed_object_id_from_contract_deployment>
```

**4. Build and serve**
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## Configuration

### Backend Configuration Details

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` \| `production` \| `test` |
| `FRONTEND_URL` | CORS-allowed origin | `http://localhost:5173` |
| `DB_HOST` | Database hostname | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database user | `chainskills_user` |
| `DB_PASSWORD` | Database password | `your_secure_password` |
| `DB_DATABASE` | Database name | `chainskills_db` |

### Frontend Configuration Details

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_DEBUG` | Enable debug logging | `true` \| `false` |
| `VITE_VAULT_PACKAGE` | Move package ID | `0x1234...` |
| `VITE_VAULT_OBJECT_ID` | Vault object ID | `0x5678...` |

## Running the Application

### Start All Services

**Terminal 1 - Backend Server**
```bash
cd gameBackend
pnpm run dev
```

**Terminal 2 - Frontend Development Server**
```bash
cd frontend
pnpm run dev
```

**Terminal 3 - PostgreSQL (if not running as service)**
```bash
# On Windows
pg_ctl -D "C:\Program Files\PostgreSQL\data" start

# On macOS/Linux
brew services start postgresql
```

### Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **WebSocket**: ws://localhost:5000/socket.io/

### Testing the Application

**1. Connect Wallet**
- Click "Connect Wallet" on the landing page
- Select OneChain wallet
- Sign the connection request

**2. Free Play Match**
- Click "Quick Match" or "Create Game Code"
- Share code with another player or open in another browser tab
- Join and play

**3. Staked Match**
- In game creation, enter stake amount (ensure you have sufficient OCT)
- Approve transaction in wallet
- Wait for another player to join with matching stake
- Game begins with real assets at stake

### Running Tests

**Backend Unit Tests**
```bash
cd gameBackend
pnpm run test
```

**Backend Test Watch Mode**
```bash
cd gameBackend
pnpm run test:watch
```

**Test Coverage**
```bash
cd gameBackend
pnpm run test:coverage
```

## Project Structure

```
chain-skill-games/
├── chainskills_vault/          # Move smart contract
│   ├── sources/
│   │   └── chainskills_vault.move    # Main vault contract
│   ├── tests/
│   │   └── chainskills_vault_tests.move
│   ├── build/                   # Compiled contract
│   └── Move.toml               # Move package manifest
│
├── gameBackend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── server.ts           # Express server setup
│   │   ├── config/
│   │   │   └── dbSource.ts     # TypeORM database config
│   │   ├── data/
│   │   │   ├── models/         # Database entities
│   │   │   ├── repositories/   # Data access layer
│   │   │   └── DTO/            # Data transfer objects
│   │   ├── services/
│   │   │   ├── GameService.ts  # Game logic & state
│   │   │   ├── SessionService.ts    # Session management
│   │   │   ├── PaymentService.ts    # Payment handling
│   │   │   └── PlayerService.ts     # Player management
│   │   ├── websocket/
│   │   │   └── index.ts        # Socket.IO setup
│   │   ├── routers/
│   │   │   └── index.ts        # API routes
│   │   ├── utils/
│   │   │   ├── GamePhysics.ts  # Physics engine
│   │   │   ├── PowerUpManager.ts    # Power-up logic
│   │   │   └── index.ts        # Utilities
│   │   └── exceptions/
│   │       └── index.ts        # Custom exceptions
│   ├── test/
│   │   └── services/           # Service tests
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
└── frontend/                    # React/Vite frontend
    ├── src/
    │   ├── App.tsx             # Main app component
    │   ├── main.tsx            # Entry point
    │   ├── pages/
    │   │   ├── pong.tsx        # Game UI page
    │   │   ├── landingPage.tsx # Landing page
    │   │   └── NotFound.tsx    # 404 page
    │   ├── components/
    │   │   ├── pingpong/       # Game canvas & logic
    │   │   ├── modals/         # Modal dialogs
    │   │   ├── commons/        # Shared components
    │   │   └── ui/             # UI component library
    │   ├── contexts/
    │   │   ├── OneChainProvider.tsx   # Wallet context
    │   │   └── OneChainGameContext.tsx    # Game state
    │   ├── hooks/
    │   │   ├── useOneChainGameContext.ts  # Game hooks
    │   │   └── use-mobile.tsx            # Responsive hook
    │   ├── services/
    │   │   └── socketService.ts         # WebSocket client
    │   ├── types/
    │   │   └── index.ts        # TypeScript definitions
    │   ├── lib/
    │   │   ├── utils.ts        # Utility functions
    │   │   └── reusables.tsx   # Reusable UI logic
    │   ├── App.css
    │   └── index.css
    ├── public/                  # Static assets
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    └── eslint.config.js
```

## Key Features & Implementation

### Real-Time Game Loop

The backend runs a 60 FPS game loop that:
- Updates ball physics and paddle positions
- Checks collision detection
- Manages power-up durations and cooldowns
- Synchronizes game state with both players via WebSocket
- Detects scoring and game end conditions

**Location**: `gameBackend/src/services/GameService.ts`

### Physics Engine

Implements realistic Pong physics:
- Paddle collision detection with ball acceleration
- Wall bounce mechanics
- Scoring detection
- Speed limits to prevent infinite acceleration

**Location**: `gameBackend/src/utils/GamePhysics.ts`

### Power-Up System

Three power-ups enhance gameplay:
- **Pad Stretch**: Increases paddle height by 50% for 5 seconds
- **Multi-Ball**: Visual effect of multiple balls (currently visual)
- **Shield**: Prevents one score against the player for 5 seconds

Power-ups have cooldown timers to prevent spam usage.

**Location**: `gameBackend/src/utils/PowerUpManager.ts`

### Wallet Integration

Uses OneChain's dApp kit for:
- Wallet connection and authentication
- Transaction signing
- Balance queries
- Smart contract interaction

**Location**: `frontend/src/contexts/OneChainProvider.tsx`

### Game Session Management

Supports two modes:
1. **Free Play**: Players join with a room code, no stake
2. **Staked Match**: Players wager OCT tokens, outcomes recorded on-chain

**Location**: `gameBackend/src/services/SessionService.ts`

### Database Schema

**Player**: Stores player address, username, stats
**Session**: Manages game sessions, players, and status
**Game**: Links sessions to game instances
**Stats**: Tracks wins, losses, XP, rating
**Transaction**: Records staked game outcomes and payouts

## Game Mechanics

### Scoring & Win Condition
- First player to score 5 points wins the match
- Each point resets the ball to center
- 3-second countdown between points

### Power-Up Mechanics
- Power-ups randomly spawn during gameplay
- Each player can have one active power-up
- Power-ups have cooldown timers (3 seconds)
- Shield blocks exactly one incoming point

### Disconnect Handling
- If a player disconnects, opponent wins by default after 5 seconds
- Reconnection support (in development)
- Session preserves state during temporary disconnections

### Rating & Progression
- Win: +100 XP
- Loss: +30 XP
- Stats displayed on player profile (future feature)

## Roadmap

### MVP (Current - v1.0)
- ✅ Ping-Pong gameplay with real-time multiplayer
- ✅ Free play mode with room codes
- ✅ Staked matches with on-chain settlement
- ✅ Player stats and leaderboard (database ready)

### Phase 2 (Planned)
- Mobile app (React Native)
- Enhanced UI/UX
- Tournament system
- Seasonal rankings
- Cosmetics and NFT skins
- Power-up system

### Phase 3 (Future)
- Additional games beyond Ping-Pong
- Cross-chain support
- DAO governance
- Community-driven game development

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add feature description'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Workflow

- Keep commits atomic and well-described
- Write tests for new features
- Ensure TypeScript compilation passes: `pnpm run build`
- Follow existing code style and conventions

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## Support & Community

For issues, questions, or feedback:
- Open an issue on GitHub
- Check existing documentation in `chainskills_vault/README.md`
- Review smart contract flow documentation for on-chain mechanics

**Current Status**: MVP - Actively Developed
**Latest Branch**: gamePhysics (physics engine refinements)
**Repository**: https://github.com/Biokes/Skillup
