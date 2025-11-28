
// /*
// /// Module: chainskills_vault
// module chainskills_vault::chainskills_vault;
// */

// // For Move coding conventions, see
// // https://docs.sui.io/concepts/sui-move-concepts/conventions

module skillup::vault;

use one::coin::{Self, Coin};
use one::balance::{Self, Balance};
use one::oct::OCT;
use one::event;

const ERROR_GAMEPLAY_PAUSED: u64 = 1001;
const INVALID_AMOUNT: u64 = 1002;
const ERR_UNAUTHORISED: u64 = 1004;
const ERR_PLAYER2_SLOT_NOT_EMPTY: u64 = 1006;
const ERR_CANNOT_JOIN_OWN_GAME: u64 = 1007;
const ERR_INVALID_STATUS_TRANSITION: u64 = 1012;
const INSUFFICIENT_BALANCE: u64 = 1013;
const ERR_INVALID_STATUS: u64 = 1015;
const ERR_PLAYER2_NOT_JOINED: u64 = 1014;

const WAITING_STATUS: u8 = 1;
const ACTIVE_STATUS: u8 = 2;
const ENDED_STATUS: u8 = 3;
const CANCELLED_STATUS: u8 = 4;

const DEV_FEE_PERCENTAGE: u64 = 5;

const POWERUP_PAD_STRETCH: u8 = 1;
const POWERUP_MULTIBALL: u8 = 2;
const POWERUP_SHIELD: u8 = 3;

public struct GameVault has key {
    id: UID,
    dev_fee_vault: Balance<OCT>,
    owner: address,
    total_games: u64,
    paused: bool,
}

public struct PowerupInventory has key {
    id: UID,
    owner: address,
    pad_stretch_count: u64,
    multiball_count: u64,
    shield_count: u64,
}

public struct GameSession has key, store {
    id: UID,
    game_id: u64,
    player1: address,
    player2: Option<address>,
    stake_amount: u64,
    escrow_balance: Balance<OCT>,
    status: u8,
    winner: Option<address>,
    created_at: u64,
    completed_at: u64,
}

public struct GameCreated has copy, drop {
    game_id: u64,
    player1: address,
    stake_amount: u64,
    created_at: u64,
    status: u8
}

public struct GameEnded has copy, drop {
    game_id: u64,
    winner: address,
    loser: address,
    winner_amount: u64,
    dev_fee_amount: u64,
    completed_at: u64,
}

public struct RefundClaimed has copy, drop {
    game_id: u64,
    player: address,
    amount: u64,
    timestamp: u64,
}

public struct StakeCreated has copy, drop {
    game_id: u64,
    player: address,
    amount: u64,
    timestamp: u64,
}

public struct PowerupUsed has copy, drop {
    game_id: u64,
    player: address,
    powerup_type: u8,
    timestamp: u64,
}

public struct PowerupGranted has copy, drop {
    recipient: address,
    powerup_type: u8,
    count: u64,
    timestamp: u64,
}

public struct VaultPauseToggled has copy, drop {
    paused: bool,
    toggled_by: address,
    timestamp: u64,
}

public struct FeeWithdrawn has copy, drop {
    recipient: address,
    amount: u64,
    timestamp: u64,
}

fun validate_status_transition(current: u8, next: u8) {
    let valid = (current == WAITING_STATUS && next == ACTIVE_STATUS) ||
                (current == WAITING_STATUS && next == CANCELLED_STATUS) ||
                (current == ACTIVE_STATUS && next == ENDED_STATUS);
    assert!(valid, ERR_INVALID_STATUS_TRANSITION);
}

fun init(context: &mut TxContext) {
    let deployer = tx_context::sender(context);
    let vault = GameVault {
        id: object::new(context),
        dev_fee_vault: balance::zero<OCT>(),
        owner: deployer,
        total_games: 0,
        paused: false,
    };
    transfer::share_object(vault);
}

public entry fun createGame(vault: &mut GameVault, payment: Coin<OCT>, context: &mut TxContext) {
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    let sender = tx_context::sender(context);
    let amount_paid = coin::value(&payment);
    assert!(amount_paid > 0, INVALID_AMOUNT);

    let game_id = vault.total_games + 1;
    vault.total_games = game_id;

    let escrow_balance = coin::into_balance(payment);

    let game = GameSession {
        id: object::new(context),
        game_id,
        player1: sender,
        player2: option::none<address>(),
        stake_amount: amount_paid,
        escrow_balance,
        status: WAITING_STATUS,
        winner: option::none<address>(),
        created_at: tx_context::epoch(context),
        completed_at: 0,
    };

    event::emit(GameCreated {
        game_id,
        player1: sender,
        stake_amount: amount_paid,
        created_at: game.created_at,
        status: game.status
    });

    transfer::share_object(game);
}

public entry fun joinGame(vault: &mut GameVault, game: &mut GameSession, payment: Coin<OCT>, context: &mut TxContext) {
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    assert!(game.status == WAITING_STATUS, ERR_INVALID_STATUS);
    validate_status_transition(game.status, ACTIVE_STATUS);

    let sender = tx_context::sender(context);
    let stake_amount = coin::value(&payment);
    assert!(sender != game.player1, ERR_CANNOT_JOIN_OWN_GAME);
    assert!(option::is_none(&game.player2), ERR_PLAYER2_SLOT_NOT_EMPTY);
    assert!(stake_amount == game.stake_amount, INVALID_AMOUNT);

    let additional_balance = coin::into_balance(payment);
    balance::join(&mut game.escrow_balance, additional_balance);
    let expected_balance = game.stake_amount * 2;
    assert!(balance::value(&game.escrow_balance) == expected_balance, INVALID_AMOUNT);

    game.player2 = option::some(sender);
    game.status = ACTIVE_STATUS;

    event::emit(StakeCreated {
        game_id: game.game_id,
        player: sender,
        amount: stake_amount,
        timestamp: tx_context::epoch(context),
    });
}

public entry fun endGame(vault: &mut GameVault, game: &mut GameSession, winner: address, context: &mut TxContext) {
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    let sender = tx_context::sender(context);
    assert!(sender == vault.owner, ERR_UNAUTHORISED);
    assert!(game.status == ACTIVE_STATUS, ERR_INVALID_STATUS);
    assert!(option::is_some(&game.player2), ERR_PLAYER2_NOT_JOINED);
    
    validate_status_transition(game.status, ENDED_STATUS);

    let player2 = option::borrow(&game.player2);
    assert!(winner == game.player1 || winner == *player2, ERR_UNAUTHORISED);

    let total_balance = balance::value(&game.escrow_balance);
    assert!(total_balance > 0, INSUFFICIENT_BALANCE);

    let dev_fee = (total_balance * DEV_FEE_PERCENTAGE) / 100;
    let winner_amount = total_balance - dev_fee;

    let mut extracted_balance = balance::split(&mut game.escrow_balance, total_balance);
    let dev_balance = balance::split(&mut extracted_balance, dev_fee);
    balance::join(&mut vault.dev_fee_vault, dev_balance);

    let winner_coin = coin::from_balance(extracted_balance, context);
    transfer::public_transfer(winner_coin, winner);

    game.winner = option::some(winner);
    game.status = ENDED_STATUS;
    game.completed_at = tx_context::epoch(context);

    let loser = if (winner == game.player1) { *player2 } else { game.player1 };

    event::emit(GameEnded {
        game_id: game.game_id,
        winner,
        loser,
        winner_amount,
        dev_fee_amount: dev_fee,
        completed_at: game.completed_at,
    });
}

public entry fun requestRefund(vault: &GameVault, game: &mut GameSession, context: &mut TxContext) {
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    assert!(game.status == WAITING_STATUS, ERR_INVALID_STATUS);
    validate_status_transition(game.status, CANCELLED_STATUS);

    let sender = tx_context::sender(context);
    assert!(sender == game.player1, ERR_UNAUTHORISED);

    let refund_amount = balance::value(&game.escrow_balance);
    assert!(refund_amount > 0, INVALID_AMOUNT);

    game.completed_at = tx_context::epoch(context);

    event::emit(RefundClaimed {
        game_id: game.game_id,
        player: sender,
        amount: refund_amount,
        timestamp: game.completed_at,
    });
}

public entry fun grant_powerup_from_crate(vault: &GameVault, inventory: &mut PowerupInventory, powerup_type: u8, context: &mut TxContext) {
    assert!(tx_context::sender(context) == vault.owner, ERR_UNAUTHORISED);
    assert!(powerup_type >= 1 && powerup_type <= 3, INVALID_AMOUNT);

    let new_count = if (powerup_type == POWERUP_PAD_STRETCH) {
        inventory.pad_stretch_count = inventory.pad_stretch_count + 1;
        inventory.pad_stretch_count
    } else if (powerup_type == POWERUP_MULTIBALL) {
        inventory.multiball_count = inventory.multiball_count + 1;
        inventory.multiball_count
    } else {
        inventory.shield_count = inventory.shield_count + 1;
        inventory.shield_count
    };

    event::emit(PowerupGranted {
        recipient: inventory.owner,
        powerup_type,
        count: new_count,
        timestamp: tx_context::epoch(context),
    });
}

public entry fun use_powerup(vault: &GameVault, inventory: &mut PowerupInventory, game: &GameSession, powerup_type: u8, context: &mut TxContext) {
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    let sender = tx_context::sender(context);
    assert!(sender == inventory.owner, ERR_UNAUTHORISED);
    assert!(game.status == ACTIVE_STATUS, ERR_INVALID_STATUS);
    assert!(powerup_type >= 1 && powerup_type <= 3, INVALID_AMOUNT);

    if (powerup_type == POWERUP_PAD_STRETCH) {
        assert!(inventory.pad_stretch_count > 0, INVALID_AMOUNT);
        inventory.pad_stretch_count = inventory.pad_stretch_count - 1;
    } else if (powerup_type == POWERUP_MULTIBALL) {
        assert!(inventory.multiball_count > 0, INVALID_AMOUNT);
        inventory.multiball_count = inventory.multiball_count - 1;
    } else if (powerup_type == POWERUP_SHIELD) {
        assert!(inventory.shield_count > 0, INVALID_AMOUNT);
        inventory.shield_count = inventory.shield_count - 1;
    };

    event::emit(PowerupUsed {
        game_id: game.game_id,
        player: sender,
        powerup_type,
        timestamp: tx_context::epoch(context),
    });
}

public entry fun ownerWithdrawal(vault: &mut GameVault, context: &mut TxContext) {
    assert!(tx_context::sender(context) == vault.owner, ERR_UNAUTHORISED);
    let fee_amount = balance::value(&vault.dev_fee_vault);
    assert!(fee_amount > 0, INVALID_AMOUNT);
    let fee_balance = balance::split(&mut vault.dev_fee_vault, fee_amount);
    let fee_coin = coin::from_balance(fee_balance, context);
    transfer::public_transfer(fee_coin, vault.owner);

    event::emit(FeeWithdrawn {
        recipient: vault.owner,
        amount: fee_amount,
        timestamp: tx_context::epoch(context),
    });
}

public entry fun toggleVaultPause(vault: &mut GameVault, context: &mut TxContext) {
    assert!(tx_context::sender(context) == vault.owner, ERR_UNAUTHORISED);
    vault.paused = !vault.paused;
    event::emit(VaultPauseToggled {
        paused: vault.paused,
        toggled_by: tx_context::sender(context),
        timestamp: tx_context::epoch(context),
    });
}

public fun get_game_status(game: &GameSession): u8 { game.status }
public fun get_game_escrow_balance(game: &GameSession): u64 { balance::value(&game.escrow_balance) }
public fun getDevFees(vault: &GameVault): u64 { balance::value(&vault.dev_fee_vault) }
public fun isVaultPaused(vault: &GameVault): bool { vault.paused }
public fun getVaultTotalGames(vault: &GameVault): u64 { vault.total_games }

public fun get_or_create_inventory(context: &mut TxContext): PowerupInventory {
    let sender = tx_context::sender(context);
    PowerupInventory {
        id: object::new(context),
        owner: sender,
        pad_stretch_count: 0,
        multiball_count: 0,
        shield_count: 0,
    }
}

public fun get_powerup_count(inventory: &PowerupInventory, powerup_type: u8): u64 {
    if (powerup_type == POWERUP_PAD_STRETCH) {
        inventory.pad_stretch_count
    } else if (powerup_type == POWERUP_MULTIBALL) {
        inventory.multiball_count
    } else if (powerup_type == POWERUP_SHIELD) {
        inventory.shield_count
    } else {
        0
    }
}

public fun get_all_powerups(inventory: &PowerupInventory): (u64, u64, u64) {
    (inventory.pad_stretch_count, inventory.multiball_count, inventory.shield_count)
}