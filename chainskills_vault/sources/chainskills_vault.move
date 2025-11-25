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

    const ERROR_GAMEPLAY_PAUSED: u64 = 1001;
    const INVALID_AMOUNT: u64= 1002;
    const ERROR_GAME_ACTIVE:u64 = 1003;
    const ERR_UNAUTHORISED: u64 = 1004;
    const INVALID_ACTION: u64 = 1005;
    const ERR_PLAYER2_SLOT_NOT_EMPTY: u64 = 1006;
    const ERR_CANNOT_JOIN_OWN_GAME: u64 = 1007;

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

    public struct GameCreated has copy, drop{
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

    public fun createGame(vault: &mut GameVault,payment: Coin<SUI>, context: &mut TxContext): UID{
        let sender = tx_context::sender(context);
        let amountPaid = coin::value(payment);
        assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
        assert!(amountPaid > 0, INVALID_AMOUNT);
        let stake_balance = coin::into_balance(payment); 
        balance::join(&mut vault.active_stakes, stake_balance);
        let game_id: u64 = vault.total_games + 1;
        vault.total_games = game_id;

        let game: GameSession = GameSession{
            id : object::new(context),
            game_id: vault.total_games,
            player1: sender,
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

        sui::event::emit(GameCreated{
            game_id,
            game.player1,
            game.stake_amount, 
            game.created_at,
            game.status
        });

        game.id
    }

    public fun requestRefund(vault: &mut GameVault, game: &mut GameSession, context: &mut TxContext): Coin<SUI>{
        assert!(!vault.paused,ERROR_GAMEPLAY_PAUSED );
        assert!(game.status == ACTIVE_STATUS, ERROR_GAME_ACTIVE);
        // let msgSender = tx_context::sender(ctx);
        assert!(game.player1 == msg.sender,ERR_UNAUTHORISED);
        let refund_amount = game.stake_amount;
        let refund_balance: u64 = balance::split(&mut vault.active_stakes, refund_amount);
        game.isRefunded = true;
        game.status = CANCELLED_STATUS;
        sui::event::emit(RefundClaimed {
                game_id: game.game_id,
                player: sender,
                amount: refund_amount,
                timestamp: tx_context::epoch(ctx),
            });
        coin::from_balance(refund_balance, ctx)
    }

    public entry fun ownerWithdrawal( vault: &mut GameVault, ctx: &mut TxContext): Coin<SUI> {
        assert!(tx_context::sender(ctx) == vault.owner, ERR_UNAUTHORISED);
        let fee_balance = balance::split(&mut vault.dev_fee_vault, vault.dev_fee_vault);
        coin::from_balance(fee_balance, ctx)
    }

    public fun joinGame(vault: &mut GameVault,game: &mut GameSession ,context: &mut TxContext,payment: Coin<SUI>){
        let sender = tx_context::sender(ctx);
        let stakeAmount = coin::value(&payment);

        assert!(!vault.paused, ERROR_GAMEPLAY_PAUSED);
        assert!(game.status == WAITING_STATUS,INVALID_ACTION);
        assert!(game.stake_amount == stakeAmount, INVALID_AMOUNT);
        assert!(option::is_none(&game.player2), ERR_PLAYER2_SLOT_NOT_EMPTY);
        assert!(sender != game.player1, ERR_CANNOT_JOIN_OWN_GAME);

        let stake_balance = coin::into_balance(payment);
        balance::join(&mut vault.active_stakes, stake_balance);

        game.player2 = option::some(sender);
        game.total_pool = game.stake_amount * 2;
        game.status = ACTIVE_STATUS;

        sui::event::emit(StakeCreated {
            game_id: game.game_id,
            player: sender,
            amount,
            timestamp: tx_context::epoch(ctx),
        });
    }
//claim wins after game
//complete game/ end game

    public fun toggleVaultPause( vault: &mut GameVault, ctx: &mut TxContext,) {
        assert!(tx_context::sender(ctx) == vault.owner, 1006);
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