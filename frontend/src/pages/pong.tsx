import Navbar from "@/components/commons/navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, VAULT_PACKAGE, TIMEOUT_DURATION, TOKEN_DECIMALS, VAULT_OBJECT_ID, paymentClient } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, JoinWithCodeResponse, PaidGameWaitingResponse, PlayerStat } from "@/types";
import { toast } from "sonner";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@onelabs/dapp-kit"
import { Transaction } from "@onelabs/sui/transactions";
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";
import {CodeInput, ConnectingSection, FailedConnectionSection, PaymentInput} from "@/lib/reusables.tsx";
import { SuiObjectChange } from "@onelabs/sui/client";

export default function Pong() {
    const { quickMatch, retryQuickMatch, cancelQuickMatch, cancelCreateOrJoinMatch, connectFreeWithCode } = useOneChainGame();
    const navigate = useNavigate();
    const account = useCurrentAccount();
    const address = account?.address ?? null;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [code, setCode] = useState("");
    const [timedOut, setTimedOut] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<number>(0);
    const { mutate } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await client.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showObjectChanges: true,
                },
            }),
    });
    const client = useSuiClient()
    const [modal, setModal] = useState<{
        mode: "connecting" | "failed" | "enterCode" | "stake" | 'friendlyStake' | null;
        open: boolean;
        header: string;
        description: string;
        currentAction: "quickMatch" | "codeMatch" | "stakeMatch" | 'friendlyStake' | null;
    }>({ open: false, mode: null, header: "", description: "", currentAction: null });
    const [paidGameResponse, setPaidGameResponse] = useState<PaidGameWaitingResponse>({
        sessionId: '',
        status: '',
        isStaked: false,
        player1: '',
        amount: 0,
        transaction: ''
    })
    const [userBalance, setUserBalance] = useState<number>(0);

    useEffect(() => {
        if (!socketService.isConnected()) {
            if (!address) return;
            socketService.connect(address);
        }

        const onJoined = (response: JoinGameResponse) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (address) {
                const joined =
                    response.player1.toLowerCase() === address.toLowerCase() ||
                    response.player2.toLowerCase() === address.toLowerCase();

                if (joined) {
                    setTimedOut(false);
                    setModal({ description: "", header: '', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: {...response, gameType: 'quickfree'}});
                }
            }
        };

        const joinWithCode = (response: JoinWithCodeResponse) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (address) {
                const joined =
                    response.player1.toLowerCase() === address.toLowerCase() ||
                    response.player2.toLowerCase() === address.toLowerCase();

                if (joined) {
                    setTimedOut(false);
                    setModal({ description: "", header: '', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: {...response, gameType: 'freeCoded'} });
                }
            }
        }

        const handleJoiningPaidGame = (response: { sessionId: string, status: string, isStaked: boolean, player1: string, player2: string, amount: number, game: string }) => {
             if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (address) { 
                const joined = response.player1.toLowerCase() === address.toLowerCase() || response.player2.toLowerCase() === address.toLowerCase();
                 if (joined) {
                    setTimedOut(false);
                    setModal({ description: "", header: '', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: {...response, status:"staked"} });
                }
            }

        }
        
        const handleWaitForPaidConection = (response: PaidGameWaitingResponse) => {
            const isOwnedConnection = response.player1.toLowerCase() === address;
        if (isOwnedConnection) setPaidGameResponse(response);
        }
        
        socketService.on("joined", onJoined);
        socketService.on('joinedWithCode', joinWithCode);
        socketService.on('waitingForPaidConnection', handleWaitForPaidConection)
        socketService.on('joinedPaidConnection',handleJoiningPaidGame)

        return () => {
            socketService.off("joined");
            socketService.off('joinedWithCode')
            socketService.off('joinedPaidConnection')
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [address, navigate]);

    const startTimeout = useCallback((cancelFn: () => void) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            cancelFn();
            setTimedOut(true);
        }, TIMEOUT_DURATION);
    }, []);

    const cancelConnection = useCallback((mode: "connecting" | 'failed' | 'enterCode' | "stake" | null) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        socketService.cancelMatch(address)
        setTimedOut(false);
        setModal({ currentAction: null, mode: mode, header: '', description: '', open: false });
    }, [address]);

    const handleRetryQuickMatch = useCallback(() => {
        setTimedOut(false);
        retryQuickMatch(address);
        startTimeout(() => cancelQuickMatch(address));
    }, [address, cancelQuickMatch, retryQuickMatch, startTimeout]);

    function findQuickMatch() {
        if (!address) return toast.info("Please connect wallet");
        setTimedOut(false);
        quickMatch(address);
        startTimeout(() => cancelQuickMatch(address));
        setModal({
            open: true,
            mode: "connecting",
            header: "Quick Match (Free)",
            description: "Connecting to play a quick match",
            currentAction: 'quickMatch'
        });
    }

    const getUserBalance = useCallback(async () => {
        try {
            const balanceData = await client.getBalance({ owner: address });
            const totalBalance = balanceData?.totalBalance ?? "0";
            setUserBalance(Number(totalBalance) / TOKEN_DECIMALS);
        } catch (error: unknown) {
            toast.error("Couldn't fetch balance, try refreshing");
            console.error('bal error: ', error)
            return 0;
        }
    }, [address, client])
    
    useEffect(() => {
        if (address) {
            getUserBalance();
        }
    }, [address, getUserBalance]);

    function createOrJoinCode() {
        if (!address) return toast.info("Please connect wallet");
        setModal({
            open: true,
            mode: "enterCode",
            header: "Create / Join Match",
            description: "Enter a room code to create or join",
            currentAction: 'codeMatch'
        });
    }

    const proceedCreateOrJoin = useCallback(() => {
        if (!address) return toast.info("Please connect wallet");
        setTimedOut(false);
        connectFreeWithCode(address, code)
        startTimeout(() => cancelCreateOrJoinMatch(address, code));
        setModal({
            open: true,
            mode: "connecting",
            header: "Create / Join Match",
            description: "Connecting to match...",
            currentAction: 'codeMatch'

        });
    }, [address, cancelCreateOrJoinMatch, code, connectFreeWithCode, startTimeout])
    
    const handleRetryCodeMatch = useCallback(() => {
        setTimedOut(false);
        connectFreeWithCode(address, code);
        startTimeout(() => proceedCreateOrJoin());
    }, [address, code, connectFreeWithCode, proceedCreateOrJoin, startTimeout]);

    function stake() {
        if (!address) return toast.error("Please Connect wallet");
        setModal({ open: true, mode: "stake", header: "Stake against anybody", description: "compete and earn against other players around the world", currentAction: 'stakeMatch' });
    }

    function stakeAgainstFriends() {
        if (!address) return toast.error("Please Connect wallet")
        setModal({ open: true, mode: "friendlyStake", header: "Stake against Friends", description: "compete and earn against friends and relatives around the world", currentAction: 'friendlyStake' });
    }

    function cancelPayment() {
        setStakeAmount(0);
        setModal((prev) => ({ ...prev, open: false }))
    }

    function handleRetryStakedMatch(){
        setTimedOut(false);
        this.socketService.getSocket().emit("onStakedGameConnection", { sessionId: paidGameResponse.sessionId, address, stakingPrice: paidGameResponse.amount,transactionId: paidGameResponse.transaction}) 
        startTimeout(() => this.socketService.emit("pauseStakedGameConnection", { sessionId: paidGameResponse.sessionId, address, stakingPrice: paidGameResponse.amount }))        
        stake()
    }
    
    function getRetryHandler() {
        if (modal.currentAction === "quickMatch") return handleRetryQuickMatch;
        if (modal.currentAction === "codeMatch") return handleRetryCodeMatch;
        if (modal.currentAction === "stakeMatch") return handleRetryStakedMatch;
        return () => {};
    }

    async function handleFriendlyStake() {
        return toast.info('Friendly stake coming soon');
    }
    async function handleStake() {
        const stakingPrice = stakeAmount * TOKEN_DECIMALS;
        
        if (stakingPrice > userBalance * TOKEN_DECIMALS) {
            return toast.error("StakeAmount is greater than your balance");
        }

        setModal({ 
            open: true, 
            mode: "connecting", 
            header: "Processing Payment...", 
            description: "Please wait while we check for available games", 
            currentAction: 'stakeMatch' 
        });

        try {
            const gameCheck = await new Promise<{ success: boolean; gameId: string }>((resolve) => {
                socketService.getSocket().emit('checkStakedGame', { price: stakingPrice, walletAddress: address.toLowerCase() },
                    (response: { success: boolean; gameId: string }) => resolve(response)
                );
            });

            const isExistingGame = gameCheck.success;
            const existingGameId = gameCheck.gameId || '';

            const allOctCoins = await client.getCoins({ 
                owner: address, 
                coinType: "0x2::oct::OCT",
                limit: 10
            });

            if (!allOctCoins.data.length) {
                setModal(prev => ({ ...prev, open: false }));
                return toast.error("No OCT coins found in your wallet");
            }

            if (allOctCoins.data.length > 1) {
                const consolidationTx = new Transaction();
                consolidationTx.setSender(address);
                const [primaryCoin, ...restCoins] = allOctCoins.data;
                consolidationTx.mergeCoins(
                    consolidationTx.object(primaryCoin.coinObjectId),
                    restCoins.map(coin => consolidationTx.object(coin.coinObjectId))
                );
                consolidationTx.setGasBudget(5000000);
                await new Promise<void>((resolve) => {
                    mutate({ transaction: consolidationTx }, {
                        onSuccess: (_response) => resolve(),
                        onError: (_error) => resolve()
                    });
                });
                await new Promise<void>(resolve => setTimeout(resolve, 2000));
            }

            const freshCoins = await client.getCoins({ 
                owner: address, 
                coinType: "0x2::oct::OCT",
                limit: 10
            });

            if (!freshCoins.data.length) {
                setModal(prev => ({ ...prev, open: false }));
                return toast.error("Failed to retrieve coins after consolidation");
            }

            const primaryCoinId = freshCoins.data[0].coinObjectId;
            const stakeTransaction = new Transaction();
            stakeTransaction.setSender(address);

            const [paymentCoin] = stakeTransaction.splitCoins(
                stakeTransaction.object(primaryCoinId), 
                [stakeTransaction.pure.u64(stakingPrice)]
            );
            stakeTransaction.setGasBudget(5000000);

            if (!isExistingGame) {
                const dryRunResult = await client.devInspectTransactionBlock({
                    transactionBlock: stakeTransaction,
                    sender: address,
                });

                if (dryRunResult.error) {
                    setModal(prev => ({ ...prev, open: false }));
                    return toast.error(`Transaction validation failed: ${dryRunResult.error}`);
                }

                stakeTransaction.moveCall({
                    target: `${VAULT_PACKAGE}createGame`,
                    arguments: [
                        stakeTransaction.object(VAULT_OBJECT_ID),
                        paymentCoin
                    ],
                });

                setModal(prev => ({ ...prev, description: "Waiting for wallet confirmation..." }));

                await new Promise<void>((resolve) => {
                    mutate({ transaction: stakeTransaction }, {
                        onSuccess: (response) => {
                            const newGameId = response?.objectChanges
                                ?.filter((c) => c.type === "created")
                                .find((c) => c.objectType?.includes("GameSession"))
                                ?.objectId;

                            const paymentTransactionId = response?.digest;

                            if (newGameId && paymentTransactionId) {
                                socketService.createPaidMatch(newGameId, paymentTransactionId, address, stakingPrice);
                                setModal({
                                    open: true,
                                    mode: "connecting",
                                    header: "Waiting for Opponent",
                                    description: "Your staked game is ready. Waiting for another player to join...",
                                    currentAction: 'stakeMatch'
                                });
                            } else {
                                setModal(prev => ({ ...prev, open: false }));
                                toast.error("Failed to extract game ID from transaction response");
                            }
                            resolve();
                        },
                        onError: (_error) => {
                            console.error(_error)
                            setModal(prev => ({ ...prev, open: false }));
                            resolve();
                        }
                    });
                });
            } else {
                stakeTransaction.moveCall({
                    target: `${VAULT_PACKAGE}joinGame`,
                    arguments: [
                        stakeTransaction.object(VAULT_OBJECT_ID),
                        stakeTransaction.object(existingGameId),
                        paymentCoin
                    ],
                });

                setModal(prev => ({ ...prev, description: "Waiting for wallet confirmation..." }));

                await new Promise<void>((resolve) => {
                    mutate({ transaction: stakeTransaction }, {
                        onSuccess: (response) => {
                            const gameId = response?.objectChanges
                                ?.filter((c) => c.type === "mutated")
                                .find((c) => c.objectType?.includes("GameSession"))
                                ?.objectId;

                            const paymentTransactionId = response?.digest;

                            if (gameId && paymentTransactionId) {
                                socketService.getSocket().emit("joinStakedMatch", {
                                    gameId,
                                    paymentTransactionId,
                                    address,
                                    stakingPrice
                                });

                                setModal({
                                    open: true,
                                    mode: 'connecting',
                                    header: "Game Started",
                                    description: "Opponent found! Initializing game...",
                                    currentAction: 'stakeMatch'
                                });
                            } else {
                                setModal(prev => ({ ...prev, open: false }));
                                toast.error("Failed to extract game ID from transaction response");
                            }
                            resolve();
                        },
                        onError: (_error) => {
                            console.error(_error)
                            setModal(prev => ({ ...prev, open: false }));
                            resolve();
                        }
                    });
                });
            }
        } catch (error) {
            setModal(prev => ({ ...prev, open: false }));
            toast.error("Something went wrong processing your stake");
        }
    }


    async function joinExistingPaidGame(transaction: Transaction, existingGameId: string, paymentCoin: { $kind: "NestedResult"; NestedResult: [number, number]; }, stakingPrice: number) {
        transaction.moveCall({ target: `${VAULT_PACKAGE}joinGame`, arguments: [transaction.object(VAULT_OBJECT_ID), transaction.object(existingGameId), paymentCoin] });
        console.log('join new game');
        console.log(await transaction.toJSON())
        const response = await client.signAndExecuteTransaction({
            transaction: transaction,
            signer: paymentClient.getKeyPair(),
            options: {
                showEffects: true,
                showObjectChanges: true
            }
        })
        console.log('client: ', response);
        const status = response.effects?.status?.status;
        if (status === 'success') {
            console.log('create game Transaction successful');
            // const gameId = response.objectChanges?.find(object => object.type === 'mutated' && object.objectType?.includes('GameSession'))?.objectId;
            const gameId = response.objectChanges
                        ?.filter((c): c is Extract<SuiObjectChange, { type: "mutated",objectId: string; objectType: string }> => c.type === "mutated")
                        .find(c => c.objectType?.includes("GameSession"))
                        ?.objectId;
            const paymentTransactionId = response.digest;
            console.log("transaction id: ", paymentTransactionId);
            if (gameId) {
                socketService.getSocket().emit("joinStakedMatch", { gameId, paymentTransactionId, address, stakingPrice });
                setModal({
                    open: true,
                    mode: 'connecting',
                    header: "Waiting for Opponent",
                    description: "Your staked game is ready. Waiting for another player to join...",
                    currentAction: 'stakeMatch'
                });
            }
            else {
                setModal(prev => ({ ...prev, open: false }));
                toast.error("something went wrong connect with the blockchain");
                console.error("error response: ", response);
            }
        }
        else {
            const error = response.effects?.status?.error;
            if (error?.includes('1001')) {
                toast.error("Gameplay is paused");
            } else if (error?.includes('1002')) {
                toast.error("Invalid stake amount");
            } else if (error?.includes('1015')) {
                toast.error("Invalid game status");
            } else if (error?.includes('1013')) {
                toast.error("Insufficient balance");
            } else if (error?.includes('1012')) {
                toast.error("Invalid game status, try again");
            } else {
                toast.error("Failed to enter game");
            }
            setModal(prev => ({ ...prev, open: false }));
        }
    }

    async function createNewGameAndJoin(transaction: Transaction, paymentCoin: { $kind: "NestedResult"; NestedResult: [number, number]; }, stakingPrice: number) {
        //    console.log('create game Transaction successful');
        //    const newGameId = response.objectChanges?.find(object => object.type === 'created' && object.objectType?.includes('GameSession'))?.objectId;
        //    const paymentTransactionId = response.digest;
        //    console.log('Game ID:', newGameId);
        //    if (newGameId) {
        //        socketService.createPaidMatch(newGameId, paymentTransactionId, address, stakingPrice);
        //        setModal({
        //            open: true,
        //            mode: "connecting",
        //            header: "Waiting for Opponent",
        //            description: "Your staked game is ready. Waiting for another player to join...",
        //            currentAction: 'stakeMatch'
        //            //        startTimeout(() => {
        //            setTimedOut(true);
        //            socketService.getSocket().emit('pauseStakedGameConnection', { newGameId, paymentTransactionId, address, stakingPrice });
        //        });
        //    }
        //    else {
        //        setModal(prev => ({ ...prev, open: false }));
        //        toast.error("Failed to get game ID from transaction");
        //        console.error("error response: ", response);
        //    }
        //} else {
        //    const error = response.effects?.status?.error;
        //    if (error?.includes('1001')) {
        //        toast.error("Gameplay is paused");
        //    } else if (error?.includes('1002')) {
        //        toast.error("Invalid stake amount");
        //    } else if (error?.includes('1013')) {
        //        toast.error("Insufficient balance");
        //    } else {
        //        toast.error("Game creation failed");
        //    }
        //}
        toast.success("Joined match successfully!");
    }

    function getModalBody() {
        if (modal.mode === "connecting") {
            if (timedOut) {
                return <FailedConnectionSection onRetry={getRetryHandler()} onCancel={()=>{cancelConnection('connecting')}}/>;
            }
             return <ConnectingSection onCancel={() => { cancelConnection('connecting')}} />;
        }

        if (modal.mode === "enterCode") {
            if (timedOut) {
                return <FailedConnectionSection onRetry={proceedCreateOrJoin} onCancel={()=>{cancelConnection('enterCode')}} />;
            }
            return (
                <CodeInput code={code} setCode={setCode} onProceed={proceedCreateOrJoin} onCancel={() => {setModal((prev) => ({ ...prev, open: false }));}}/>
            );
        }
        if (modal.mode === 'stake') {
            if (timedOut) { 
                return <FailedConnectionSection onRetry={() => { }} onCancel={()=>{cancelConnection('connecting')}}/>
            }
            return <PaymentInput stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} balance={userBalance} onProceed={handleStake} onCancel={cancelPayment}/>
        }
        if (modal.mode === "friendlyStake") {
             if (timedOut) { 
                 return <FailedConnectionSection onRetry={()=>{}} onCancel={()=>{cancelConnection('connecting')}}/>
            }
            return <PaymentInput stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} balance={userBalance} onProceed={handleFriendlyStake} onCancel={cancelPayment}/>
        }
        return null;
    }

    const games = [
        { texts: "Quick Match", gameType: "Free", action: findQuickMatch },
        { texts: "Create / Join", gameType: "Free", action: createOrJoinCode },
        { texts: "Friendly Stake", gameType: "Stake", action: stakeAgainstFriends },
        { texts: "Compete", gameType: "Stake", action: stake },
    ];

     const powerups = [
        { name: 'Multiball mayhem', icon: '🎆', description: 'splits the ball for a burst of chaotic offence', owned: 0, },
        { name: 'Pat Stretch', icon: '💪', description: 'Increase the length of your pat for clutch saves', owned: 0,},
        { name: 'Guardian Shield', icon: '🛡️', description: 'Summons an energy barrier that block one goal', owned: 0,}
    ]

    const livegames =[]


    const BoostPack = () => (
        <section className="boostpack ">
            <nav>
                <h5>Inventory</h5>
                <Button className={cn("refresh ribeye")} disabled>refresh</Button>
            </nav>
            <div>
                {
                    powerups.map((powerUp, index) => (
                        <motion.article key={index}>
                            <nav className="flex gap-1 items-center">
                                <span>{powerUp.icon}</span>
                                <h5>{powerUp.name}</h5>
                            </nav>
                            <p>{powerUp.description}</p>
                            <h6>Owned: {powerUp.owned}</h6>
                        </motion.article>
                    ))
                }
            </div>
            <Button
                className={cn("w-[160px] h-[35px] rounded ribeye text-[1rem]")}
                onClick={() => { 
                    toast.info('Daily crate looting available soon')
                }}
            >Loot Daily crate</Button>
        </section>
    )
    
    const LiveGames = () => (
        <section className='livegames'>
            <header>Live Games</header>
            {
                livegames.length == 0 ?
                    <span>
                        <h3> No Live Game currently</h3>
                    </span>
                    :
                    <div>
                        { livegames.map((game, index) => (<article key={index}>{game}</article> ))}
                    </div>
            }
        </section>
    )

    const LeadersBoard = () => {
        const [players, setPlayers] = useState<PlayerStat[]>([])
        useEffect(() => { 
            const handleSetPlayers = (res: PlayerStat[]) => {
                setPlayers(res)
            }
            socketService.fetchLeaderBoard();
            socketService.on('leaderBoard',(res: PlayerStat[])=>handleSetPlayers(res))
            return () => { 
                socketService.off('leaderBoard')
            }
        },[])
        return (
            <div className="leadersBoard">
                <header>Live LeaderBoard</header>
                {
                    players.length == 0 ?
                        <span>
                            <h3> No Records currently</h3>
                        </span>
                        :
                        <div>
                            { 
                                players.map((player, index) => (
                                    <li key={index}>
                                        <p>
                                            <span>{index + 1}.</span>
                                            {`${player.walletAddress.substring(0, 7)}...${player.walletAddress.slice(-7)}`}
                                        </p>
                                        <p>{player.ratings} XP</p>
                                    </li>
                                ))
                            }
                        </div>
                }
            </div>
        )
    }

    const HowToPlay = () => (
        <article className="howToPlay">
            <header>
                How to play
            </header>
            <div>
                <p>1. Connect wallet</p>
                <p>2. Select mode of game to play</p>
                <p>3. Claim daily power ups for profie standards</p>
                <p>4. Master your skills and stake your OCT</p>
                <p className='!text-center italic'>...play for fun, earn for fun...</p>
            </div>
        </article>
    )
    
    const BottomCard = () => (
        <div className='bottomCard'>
            <LiveGames />
            <aside>
                <LeadersBoard />
                <HowToPlay />
            </aside>
        </div>
    )

    return (
        <>
            <Navbar />
            <div className='pong_hero'>
                <section>
                    {games.map((game, idx) => (
                        <motion.article key={idx}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.3, repeat: Infinity }}
                            whileHover={{ scale: [1.1, 1.3, 1.1] }}
                            onClick={game.action}
                        >
                            <h6 className="text-gradient">{game.texts} <br/> ({game.gameType})</h6>
                        </motion.article>
                    ))}
                </section>
            </div>
            <BoostPack />
            <BottomCard />
            <Dialog open={modal.open}>
                <DialogContent className="no-close">
                    <DialogHeader>
                        <DialogTitle className="text-gradient ribeye">
                            {modal.header}
                        </DialogTitle>
                        <DialogDescription>{modal.description}</DialogDescription>
                    </DialogHeader>
                    <div className="dialogBody">{getModalBody()}</div>
                </DialogContent>
            </Dialog>
        </>
    );
}
