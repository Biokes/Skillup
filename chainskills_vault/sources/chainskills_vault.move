/*
/// Module: chainskills_vault
module chainskills_vault::chainskills_vault;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module skillup::vault;


    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Table, Self};
    use std::vector;
    use std::option::{Self, Option};
    use sui::tx_context::epoch;
    use one::sui::SUI;

    const GAMEPLAY_PAUSED: u64 = 1001;
    const INVALID_AMOUNT: u64= 1002;

    const DEFAULT_STATUS:u8 = 0;
    const WAITING_STATUS:u8 = 1;
    const ACTIVE_STATUS:u8 = 2;
    const ENDED_STATUS:u8 = 3;
    const CANCELLED_STATUS:u8 = 4;

    public struct GameVault has key {
        id: UID,
        active_stakes: Balance<SUI>,
        dev_fee_vault: Balance<SUI>,
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
        status: u8,
        winner: Option<address>,
        created_at: u64,
        completed_at: u64,
        winner_claimed: bool,
        isRefunded: bool
    }

fun init(context: &mut TxContext){
    let deployer = tx_context::sender(context);
    let vault = GameVault {
            id: object::new(ctx),
            active_stakes: balance::zero<SUI>(),
            dev_fee_vault: balance::zero<SUI>(),
            owner: deployer,
            total_games: 0,
            paused: false,
        };
    transfer::share_object(vault);
}

public fun createGame(vault: &mut GameVault,payment: Coin<SUI>, context: &mut TxContext){
    let sender = tx_context::sender(context);
    let amountPaid = coin::value(payment);
    assert!(!vault.paused, GAMEPLAY_PAUSED);
    assert!(amountPaid > 0, INVALID_AMOUNT);
    let stake_balance = coin::into_balance(payment); 
    balance::join(&mut vault.active_stakes, stake_balance);
    let game_id: u64 = vault.total_games + 1;
    vault.total_games = game_id;

    let game: GameSession = GameSession{
        id : object::new(context),
        game_id: vault.total_games,
        player1: address,
        player2: Option<address>,
        stake_amount: u64,
        total_stakes: u64,
        status: WAITING_STATUS,
        winner: option::none(),
        created_at: tx_context::epoch(context),
        completed_at: 0,
        winner_claimed: false,
        isRefunded: false
    }
    sui::event::emit({
        
    })
}
// public fun joinGame 

