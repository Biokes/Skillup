// /*
// /// Module: chainskills_vault
// module chainskills_vault::chainskills_vault;
// */

// // For Move coding conventions, see
// // https://docs.sui.io/concepts/sui-move-concepts/conventions

module skillup::vault;

use one::coin::{Self, Coin};
use one::balance::{Self, Balance};
// use one::tx_context::{Self, TxContext};
// use one::transfer;
// use one::object::{Self, UID, ID};
use one::oct::OCT;
// use std::option::{Self, Option};
use one::event;

const ERROR_GAMEPLAY_PAUSED: u64 = 1001;
const INVALID_AMOUNT: u64 = 1002;
const ERROR_GAME_ACTIVE: u64 = 1003;
const ERR_UNAUTHORISED: u64 = 1004;
const INVALID_ACTION: u64 = 1005;
const ERR_PLAYER2_SLOT_NOT_EMPTY: u64 = 1006;
const ERR_CANNOT_JOIN_OWN_GAME: u64 = 1007;

const WAITING_STATUS: u8 = 1;
const ACTIVE_STATUS: u8 = 2;
const ENDED_STATUS: u8 = 3;
const CANCELLED_STATUS: u8 = 4;

public struct GameVault has key {
    id: UID,
    active_stakes: Balance<OCT>,
    dev_fee_vault: Balance<OCT>,
    owner: address,
    total_games: u64,
    paused: bool,
}

public struct GameSession has key, store {
    id: UID,
    game_id: u64,
    player1: address,
    player2: Option<address>,
    stake_amount: u64,
    total_stakes: u64,
    total_pool: u64,
    status: u8,
    winner: Option<address>,
    created_at: u64,
    completed_at: u64,
    winner_claimed: bool,
    isRefunded: bool
}

public struct GameCreated has copy, drop {
    game_id: u64,
    player1: address,
    stake_amount: u64,
    created_at: u64,
    status: u8
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

fun init(context: &mut TxContext) {
    let deployer = tx_context::sender(context);
    let vault = GameVault {
        id: object::new(context),
        active_stakes: balance::zero<OCT>(),
        dev_fee_vault: balance::zero<OCT>(),
        owner: deployer,
        total_games: 0,
        paused: false,
    };
    transfer::share_object(vault);
}

public fun createGame(vault: &mut GameVault, payment: Coin<OCT>, context: &mut TxContext): ID {
    let sender = tx_context::sender(context);
    let amount_paid = coin::value(&payment);
    
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    assert!(amount_paid > 0, INVALID_AMOUNT);
    
    let stake_balance = coin::into_balance(payment);
    balance::join(&mut vault.active_stakes, stake_balance);
    
    let game_id: u64 = vault.total_games + 1;
    vault.total_games = game_id;

    let game = GameSession {
        id: object::new(context),
        game_id: vault.total_games,
        player1: sender,
        player2: option::none<address>(),
        stake_amount: amount_paid,
        total_stakes: amount_paid,
        total_pool: 0,
        status: WAITING_STATUS,
        winner: option::none<address>(),
        created_at: tx_context::epoch(context),
        completed_at: 0,
        winner_claimed: false,
        isRefunded: false
    };

    let game_id_emit = game.game_id;
    let player1_emit = game.player1;
    let stake_amount_emit = game.stake_amount;
    let created_at_emit = game.created_at;
    let status_emit = game.status;
    let game_uid = object::id(&game);

    event::emit(GameCreated {
        game_id: game_id_emit,
        player1: player1_emit,
        stake_amount: stake_amount_emit,
        created_at: created_at_emit,
        status: status_emit
    });

    transfer::share_object(game);
    game_uid
}

public fun requestRefund(vault: &mut GameVault, game: &mut GameSession, context: &mut TxContext): Coin<OCT> {
    let sender = tx_context::sender(context);
    
    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    assert!(game.status == WAITING_STATUS, ERROR_GAME_ACTIVE);
    assert!(game.player1 == sender, ERR_UNAUTHORISED);
    
    let refund_amount = game.stake_amount;
    let refund_balance = balance::split(&mut vault.active_stakes, refund_amount);
    
    game.isRefunded = true;
    game.status = CANCELLED_STATUS;
    
    event::emit(RefundClaimed {
        game_id: game.game_id,
        player: sender,
        amount: refund_amount,
        timestamp: tx_context::epoch(context),
    });
    
    coin::from_balance(refund_balance, context)
}

public entry fun ownerWithdrawal(vault: &mut GameVault, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, ERR_UNAUTHORISED);
    
    let fee_amount = balance::value(&vault.dev_fee_vault);
    assert!(fee_amount > 0, INVALID_AMOUNT);
    
    let fee_balance = balance::split(&mut vault.dev_fee_vault, fee_amount);
    let fee_coin = coin::from_balance(fee_balance, ctx);
    
    transfer::public_transfer(fee_coin, vault.owner);
}

public fun joinGame( vault: &mut GameVault, game: &mut GameSession, context: &mut TxContext, payment: Coin<OCT>) {
    let sender = tx_context::sender(context);
    let stake_amount = coin::value(&payment);

    assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
    assert!(game.status == WAITING_STATUS, INVALID_ACTION);
    assert!(game.stake_amount == stake_amount, INVALID_AMOUNT);
    assert!(option::is_none(&game.player2), ERR_PLAYER2_SLOT_NOT_EMPTY);
    assert!(sender != game.player1, ERR_CANNOT_JOIN_OWN_GAME);

    let stake_balance = coin::into_balance(payment);
    balance::join(&mut vault.active_stakes, stake_balance);

    game.player2 = option::some(sender);
    game.total_pool = game.stake_amount * 2;
    game.status = ACTIVE_STATUS;

    event::emit(StakeCreated {
        game_id: game.game_id,
        player: sender,
        amount: stake_amount,
        timestamp: tx_context::epoch(context),
    });
}


public fun toggleVaultPause(vault: &mut GameVault, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, ERR_UNAUTHORISED);
    vault.paused = !vault.paused;
}

public fun get_game_status(game: &GameSession): u8 {
    game.status
}

public fun get_game_winner(game: &GameSession): Option<address> {
    game.winner
}

public fun getTotalStakes(vault: &GameVault): u64 {
    balance::value(&vault.active_stakes)
}

public fun getDevFees(vault: &GameVault): u64 {
    balance::value(&vault.dev_fee_vault)
}

public fun isVaultPaused(vault: &GameVault): bool {
    vault.paused
}

public fun getVaultTotalGames(vault: &GameVault): u64 {
    vault.total_games
}