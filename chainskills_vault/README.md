# Pinball Game Vault - Complete Flow Analysis

## 1. GAME LIFECYCLE FLOWS

### Flow 1.1: Successful Game Completion
**Status Progression: WAITING → ACTIVE → ENDED**

```
Player1 calls createGame(vault, payment)
  ├─ Validates vault not paused
  ├─ Validates payment > 0
  ├─ Creates GameSession with status = WAITING
  ├─ Deposits payment into escrow
  ├─ Increments vault.total_games
  ├─ Emits GameCreated event
  └─ Returns game UID
      │
      ├─ Player2 calls joinGame(vault, game, payment)
      │   ├─ Validates vault not paused
      │   ├─ Validates game.status == WAITING
      │   ├─ Validates Player2 != Player1
      │   ├─ Validates payment == game.stake_amount
      │   ├─ Deposits payment into escrow
      │   ├─ Updates game.status = ACTIVE
      │   ├─ Sets game.player2 = Player2
      │   ├─ Emits StakeCreated event
      │   └─ Escrow now holds: 2x stake_amount
      │       │
      │       └─ Owner calls endGame(vault, game, winner_address)
      │           ├─ Validates sender == vault.owner
      │           ├─ Validates game.status == ACTIVE
      │           ├─ Validates winner is Player1 or Player2
      │           ├─ Calculates dev_fee = (escrow * 5) / 100
      │           ├─ Calculates winner_amount = escrow - dev_fee
      │           ├─ Transfers winner_amount to winner
      │           ├─ Transfers dev_fee to vault.dev_fee_vault
      │           ├─ Updates game.status = ENDED
      │           ├─ Sets game.winner = winner
      │           ├─ Updates game.completed_at
      │           └─ Emits GameEnded event
      │               └─ Escrow now empty (0 balance)
```

**Constraints & Checks:**
- Both payments must be positive and equal
- Both players must be different addresses
- Only vault owner can end the game
- Winner must be one of the two players
- Game must be in ACTIVE state when ending
- Dev fee extracted before payout (5%)

**Outcome:** Winner receives 95% of total stake, dev gets 5%, loser loses full stake

---

### Flow 1.2: Game Refund (Cancelled)
**Status Progression: WAITING → CANCELLED**

```
Player1 calls createGame(vault, payment)
  ├─ Creates GameSession with status = WAITING
  ├─ Escrow balance = payment
  └─ No Player2 yet
      │
      └─ Player1 calls requestRefund(vault, game)
          ├─ Validates vault not paused
          ├─ Validates game.status == WAITING (no Player2 joined)
          ├─ Validates sender == Player1 (only creator)
          ├─ Extracts full refund_amount from escrow
          ├─ Updates game.status = CANCELLED
          ├─ Updates game.completed_at
          ├─ Emits RefundClaimed event
          └─ Returns Coin<OCT> to Player1
              └─ Escrow now empty (0 balance)
```

**Constraints & Checks:**
- Only Player1 can request refund
- Game must be in WAITING state (no other player joined)
- Refund amount must be > 0
- Can only occur before Player2 joins

**Outcome:** Player1 recovers full stake, game is cancelled

---

### Flow 1.3: Invalid Game Transitions (BLOCKED)

**Attempted: WAITING → ENDED**
```
Result: FAILS with ERR_INVALID_STATUS_TRANSITION
Reason: Status machine only allows: WAITING→ACTIVE, WAITING→CANCELLED, ACTIVE→ENDED
```

**Attempted: WAITING → ENDED** (without ACTIVE)
```
Result: FAILS with ERR_INVALID_STATUS
Reason: endGame requires game.status == ACTIVE
```

**Attempted: ACTIVE → CANCELLED**
```
Result: FAILS with ERR_INVALID_STATUS
Reason: validate_status_transition rejects ACTIVE→CANCELLED
```

**Attempted: ENDED → any state**
```
Result: FAILS with ERR_INVALID_STATUS_TRANSITION
Reason: No valid transitions defined from ENDED
```

---

### Flow 1.4: Edge Case - Duplicate Join Attempt

```
Player1 creates game → WAITING
Player2 joins → ACTIVE
Player3 attempts joinGame() on same game
  ├─ Validates game.status == WAITING
  ├─ Check: game.status is ACTIVE (not WAITING)
  └─ FAILS with ERR_INVALID_STATUS
```

---

### Flow 1.5: Edge Case - Player1 Self-Join Prevention

```
Player1 creates game → WAITING
Player1 attempts to joinGame() as Player2
  ├─ Validates sender != game.player1
  ├─ sender == Player1, game.player1 == Player1
  └─ FAILS with ERR_CANNOT_JOIN_OWN_GAME
```

---

## 2. POWERUP SYSTEM FLOWS

### Flow 2.1: Powerup Grant → Use → Consume

```
Owner calls grant_powerup_from_crate(vault, inventory, powerup_type)
  ├─ Validates sender == vault.owner
  ├─ Validates powerup_type ∈ {1, 2, 3}
  ├─ Increments appropriate counter:
  │   ├─ Type 1 (PAD_STRETCH): pad_stretch_count++
  │   ├─ Type 2 (MULTIBALL): multiball_count++
  │   └─ Type 3 (SHIELD): shield_count++
  ├─ Emits PowerupGranted event
  └─ inventory.pad_stretch_count = N (example)
      │
      ├─ Player calls use_powerup(vault, inventory, game, powerup_type)
      │   ├─ Validates vault not paused
      │   ├─ Validates sender == inventory.owner
      │   ├─ Validates game.status == ACTIVE (during active game only)
      │   ├─ Validates powerup_type ∈ {1, 2, 3}
      │   ├─ Validates appropriate count > 0
      │   ├─ Decrements appropriate counter
      │   ├─ Emits PowerupUsed event
      │   └─ Counter now = N - 1
      │       │
      │       └─ (repeat use_powerup until count reaches 0)
```

**Powerup Types:**
- Type 1 (POWERUP_PAD_STRETCH): Extends paddle
- Type 2 (POWERUP_MULTIBALL): Adds multiple balls
- Type 3 (POWERUP_SHIELD): Adds protection

**Constraints & Checks:**
- Only owner can grant powerups
- Only inventory owner can use powerups
- Powerups only usable during ACTIVE games
- Cannot use powerup if count = 0
- Type validation ensures 1-3 range

**Outcome:** Powerup consumed and unavailable for future use in that game

---

### Flow 2.2: Inventory Creation

```
Player calls get_or_create_inventory(context)
  ├─ Creates new PowerupInventory
  ├─ Sets owner = tx_context::sender
  ├─ Initializes all counts to 0:
  │   ├─ pad_stretch_count = 0
  │   ├─ multiball_count = 0
  │   └─ shield_count = 0
  └─ Returns PowerupInventory object
```

**Note:** This function creates new inventory but doesn't store it. Caller must handle storage or transfer.

---

### Flow 2.3: Powerup Query Flows

**Query Single Powerup Count:**
```
get_powerup_count(inventory, powerup_type) → u64
  ├─ Type 1: returns inventory.pad_stretch_count
  ├─ Type 2: returns inventory.multiball_count
  ├─ Type 3: returns inventory.shield_count
  └─ Invalid: returns 0
```

**Query All Powerups:**
```
get_all_powerups(inventory) → (u64, u64, u64)
  └─ Returns (pad_stretch_count, multiball_count, shield_count)
```

---

### Flow 2.4: Invalid Powerup Operations

**Attempt: Grant invalid powerup type**
```
grant_powerup_from_crate(vault, inventory, 5)
  ├─ Validates powerup_type >= 1 && powerup_type <= 3
  └─ FAILS with INVALID_AMOUNT
```

**Attempt: Use powerup on non-active game**
```
use_powerup(vault, inventory, game, 1)
  ├─ game.status = WAITING (not ACTIVE)
  ├─ Validates game.status == ACTIVE_STATUS
  └─ FAILS with ERR_INVALID_STATUS
```

**Attempt: Use powerup from wrong owner**
```
use_powerup(vault, inventory, game, 1)
  ├─ sender = Player_A
  ├─ inventory.owner = Player_B
  ├─ Validates sender == inventory.owner
  └─ FAILS with ERR_UNAUTHORISED
```

**Attempt: Use depleted powerup**
```
inventory.shield_count = 0
use_powerup(vault, inventory, game, 3)
  ├─ Validates inventory.shield_count > 0
  └─ FAILS with INVALID_AMOUNT
```

---

## 3. VAULT ADMINISTRATION FLOWS

### Flow 3.1: Owner Fee Withdrawal

```
Owner calls ownerWithdrawal(vault, context)
  ├─ Validates sender == vault.owner
  ├─ Reads current fee_amount from dev_fee_vault
  ├─ Validates fee_amount > 0
  ├─ Extracts full fee_amount as Balance<OCT>
  ├─ Converts Balance to Coin<OCT>
  ├─ Transfers Coin to vault.owner
  ├─ Emits FeeWithdrawn event
  └─ dev_fee_vault now empty (0 balance)
```

**Fee Accumulation Example:**
```
Game1 ends: dev_fee = 5 OCT → vault total = 5 OCT
Game2 ends: dev_fee = 8 OCT → vault total = 13 OCT
Game3 ends: dev_fee = 12 OCT → vault total = 25 OCT
Owner withdraws: receives 25 OCT → vault total = 0 OCT
```

---

### Flow 3.2: Vault Pause/Resume Toggle

```
Owner calls toggleVaultPause(vault, context)
  ├─ Validates sender == vault.owner
  ├─ Flips vault.paused: false → true (or true → false)
  ├─ Emits VaultPauseToggled event
  └─ All operations affected:
      ├─ createGame: BLOCKED if paused
      ├─ joinGame: BLOCKED if paused
      ├─ endGame: BLOCKED if paused
      ├─ requestRefund: BLOCKED if paused
      ├─ use_powerup: BLOCKED if paused
      └─ grant_powerup_from_crate: NOT blocked (owner action)
```

**Use Cases:**
- Emergency pause during security incident
- Maintenance window
- Upgrade preparation

---

### Flow 3.3: Query Vault State

```
getDevFees(vault) → u64
  └─ Returns current balance::value(&vault.dev_fee_vault)

isVaultPaused(vault) → bool
  └─ Returns vault.paused state

getVaultTotalGames(vault) → u64
  └─ Returns vault.total_games (cumulative counter)

get_game_status(game) → u8
  └─ Returns game.status (1-4)

get_game_escrow_balance(game) → u64
  └─ Returns balance::value(&game.escrow_balance)
```

---

### Flow 3.4: Authorization Failure Scenarios

**Non-owner attempts endGame:**
```
endGame(vault, game, winner)
  ├─ sender = Player_A (not owner)
  ├─ Validates sender == vault.owner
  └─ FAILS with ERR_UNAUTHORISED
```

**Non-owner attempts ownerWithdrawal:**
```
ownerWithdrawal(vault)
  ├─ sender = Player_A (not owner)
  ├─ Validates sender == vault.owner
  └─ FAILS with ERR_UNAUTHORISED
```

**Non-owner attempts toggleVaultPause:**
```
toggleVaultPause(vault)
  ├─ sender = Player_A (not owner)
  ├─ Validates sender == vault.owner
  └─ FAILS with ERR_UNAUTHORISED
```

**Non-owner attempts grant_powerup:**
```
grant_powerup_from_crate(vault, inventory, 1)
  ├─ sender = Player_A (not owner)
  ├─ Validates sender == vault.owner
  └─ FAILS with ERR_UNAUTHORISED
```

---

## 4. STAKE MISMATCH & VALIDATION FLOWS

### Flow 4.1: Unequal Stake Join Attempt

```
Player1 creates game with stake = 100 OCT
Player2 attempts joinGame with payment = 50 OCT
  ├─ Reads stake_amount = coin::value(&payment) = 50
  ├─ Validates stake_amount == game.stake_amount (100)
  ├─ 50 ≠ 100
  └─ FAILS with INVALID_AMOUNT
  
Game status remains WAITING
Player2 not added
```

---

### Flow 4.2: Zero or Negative Amount Flows

**Create game with zero payment:**
```
createGame(vault, Coin<OCT>(0), context)
  ├─ amount_paid = coin::value(&payment) = 0
  ├─ Validates amount_paid > 0
  └─ FAILS with INVALID_AMOUNT
```

**Join game with zero payment:**
```
joinGame(vault, game, Coin<OCT>(0), context)
  ├─ stake_amount = coin::value(&payment) = 0
  ├─ May pass initial check if game.stake_amount = 0
  ├─ BUT createGame prevents this initially
  └─ Effectively impossible scenario
```

---

### Flow 4.3: Escrow Balance Verification

```
Player1 creates game: stake = 100 OCT
  ├─ escrow_balance = 100 OCT
  
Player2 joins: stake = 100 OCT
  ├─ Adds 100 OCT to escrow
  ├─ Validates: balance::value(&game.escrow_balance) == (100 * 2)
  ├─ Check: 200 == 200 ✓
  └─ Status = ACTIVE
```

**Modified Escrow Scenario (if external manipulation was possible):**
```
Escrow somehow becomes 150 OCT instead of 200 OCT
Player2 tries joinGame:
  ├─ Adds 100 OCT → escrow = 250 OCT
  ├─ Validates: 250 == 200
  └─ FAILS with INVALID_AMOUNT (safety net)
```

---

## 5. PAUSED STATE FLOWS

### Flow 5.1: All Player Operations Blocked During Pause

```
Owner calls toggleVaultPause(vault) → vault.paused = true

Player1 attempts createGame(vault, payment):
  ├─ Validates !vault.paused
  └─ FAILS with ERROR_GAMEPLAY_PAUSED

Player2 attempts joinGame(vault, game, payment):
  ├─ Validates !vault.paused
  └─ FAILS with ERROR_GAMEPLAY_PAUSED

Player attempts use_powerup(vault, inventory, game, 1):
  ├─ Validates !vault.paused
  └─ FAILS with ERROR_GAMEPLAY_PAUSED

Player1 attempts requestRefund(vault, game):
  ├─ Validates !vault.paused
  └─ FAILS with ERROR_GAMEPLAY_PAUSED
```

### Flow 5.2: Owner Operations NOT Blocked

```
vault.paused = true

Owner CAN call:
  ├─ endGame(vault, game, winner) ✓
  ├─ ownerWithdrawal(vault) ✓
  ├─ toggleVaultPause(vault) ✓
  └─ grant_powerup_from_crate(vault, inventory, type) ✓
```

---

## 6. COMPLETE MULTI-GAME SCENARIO

```
===== GAME 1: Completed =====
Player_A creates game: 50 OCT → total_games = 1, Game1.status = WAITING
Player_B joins: 50 OCT → Game1.status = ACTIVE, escrow = 100 OCT
  Player_B grants self SHIELD powerup (via owner)
  Player_B uses SHIELD in game (shield_count: 1 → 0)
Owner calls endGame → winner = Player_B:
  ├─ dev_fee = (100 * 5) / 100 = 5 OCT
  ├─ winner_payout = 95 OCT
  ├─ Game1.status = ENDED
  └─ vault.dev_fee_vault = 5 OCT

===== GAME 2: Completed =====
Player_C creates game: 30 OCT → total_games = 2, Game2.status = WAITING
Player_D joins: 30 OCT → Game2.status = ACTIVE, escrow = 60 OCT
Owner calls endGame → winner = Player_C:
  ├─ dev_fee = (60 * 5) / 100 = 3 OCT
  ├─ winner_payout = 57 OCT
  ├─ Game2.status = ENDED
  └─ vault.dev_fee_vault = 5 + 3 = 8 OCT

===== GAME 3: Cancelled =====
Player_E creates game: 25 OCT → total_games = 3, Game3.status = WAITING
Player_E calls requestRefund:
  ├─ Receives 25 OCT refund
  ├─ Game3.status = CANCELLED
  └─ vault.dev_fee_vault = 8 OCT (unchanged)

===== OWNER WITHDRAWAL =====
Owner calls ownerWithdrawal:
  ├─ Receives 8 OCT
  └─ vault.dev_fee_vault = 0 OCT

===== FINAL STATE =====
vault.total_games = 3
vault.paused = false
vault.dev_fee_vault = 0 OCT
```

---

## 7. ERROR CODE REFERENCE

| Code | Name | Trigger |
|------|------|---------|
| 1001 | ERROR_GAMEPLAY_PAUSED | Operation attempted while vault paused |
| 1002 | INVALID_AMOUNT | Zero payment, mismatched stakes, invalid powerup type |
| 1004 | ERR_UNAUTHORISED | Non-owner admin action, wrong player action |
| 1006 | ERR_PLAYER2_SLOT_NOT_EMPTY | Second player slot already filled |
| 1007 | ERR_CANNOT_JOIN_OWN_GAME | Player1 attempts to join own game |
| 1012 | ERR_INVALID_STATUS_TRANSITION | Illegal state machine transition |
| 1013 | INSUFFICIENT_BALANCE | Escrow has no funds when needed |
| 1014 | ERR_PLAYER2_NOT_JOINED | endGame without both players |
| 1015 | ERR_INVALID_STATUS | Operation incompatible with current status |

---

## 8. KEY FLOW CHARACTERISTICS

**Linear vs Branching:**
- Game lifecycle is LINEAR with controlled branching at WAITING state
- Can go WAITING→ACTIVE→ENDED (main path) or WAITING→CANCELLED (alternate path)
- No backtracking or state reversals possible

**Atomicity:**
- Each function is atomic
- Either all state changes complete or entire transaction reverts
- No partial updates possible

**Access Control Levels:**
- **Public player actions:** createGame, joinGame, requestRefund, use_powerup
- **Owner-only actions:** endGame, ownerWithdrawal, toggleVaultPause, grant_powerup_from_crate
- **Query functions:** all getter functions (public read-only)

**Fee Structure:**
- Fixed 5% of final pot extracted when game ends
- Dev fees accumulate in vault
- Owner must explicitly withdraw fees