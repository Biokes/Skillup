import Navbar from "@/components/commons/navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, VAULT_PACKAGE_ID, TIMEOUT_DURATION, TOKEN_DECIMALS, VAULT_OBJECT_ID } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, JoinWithCodeResponse, PaidGameWaitingResponse } from "@/types";
import { toast } from "sonner";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions";
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";
import {CodeInput, ConnectingSection, FailedConnectionSection, PaymentInput} from "@/lib/reusables.tsx";

export default function Pong() {
    const { quickMatch, retryQuickMatch, cancelQuickMatch, cancelCreateOrJoinMatch, connectFreeWithCode } = useOneChainGame();
    const navigate = useNavigate();
    const account = useCurrentAccount() ?? {};
    const address = account.address ?? null;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [code, setCode] = useState("");
    const [timedOut, setTimedOut] = useState(false);
    const [stakeAmount, setStakeAmount] = useState<number>(0);
    const { signAndExecute } = useSignAndExecuteTransaction();
    const client = useSuiClient()
    const [modal, setModal] = useState<{
        mode: "connecting" | "failed" | "enterCode" | "stake" | 'friendlyStake' |null;
        open: boolean;
        header: string;
        description: string;
        currentAction: "quickMatch" | "codeMatch"| "stakeMatch" | 'friendlyStake' |null; 
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
            console.log("🔌 Socket initialized");
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
                    setModal({ description:"",header:'', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: response });
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
                    setModal({ description:"",header:'', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: response });
                }
            }
        }
        const handleWaitForPaidConection = (response: PaidGameWaitingResponse) => { 
            const isOwnedConnection = response.player1.toLowerCase() === address;
            if (isOwnedConnection) setPaidGameResponse(response);
        }
        socketService.on("joined", onJoined);
        socketService.on('joinedWithCode', joinWithCode);
        socketService.on('waitingForPaidConnection',handleWaitForPaidConection)

        return () => {
            socketService.off("joined");
            socketService.off('joinedWithCode')
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

    const cancelConnection = useCallback((mode:"connecting"| 'failed'|'enterCode'| "stake" |null) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        socketService.cancelMatch(address)
        setTimedOut(false);
        setModal({ currentAction:null,mode:mode, header:'', description:'', open: false });
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
            currentAction:'quickMatch'
        });
    }

    const getUserBalance= useCallback(async ()=>{
        try {
            const balanceData = await client.getBalance({ owner: address });
            const totalBalance = balanceData?.totalBalance ?? "0";
            console.log("userbalance: ", totalBalance)
            console.log("userbalance1: ", Number(totalBalance) / TOKEN_DECIMALS)
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
            currentAction:'codeMatch'
        });
    }

    const  proceedCreateOrJoin= useCallback(()=>{
        if (!address) return toast.info("Please connect wallet");
        setTimedOut(false);
        connectFreeWithCode(address, code)
        startTimeout(() => cancelCreateOrJoinMatch(address, code));
        setModal({
            open: true,
            mode: "connecting",
            header: "Create / Join Match",
            description: "Connecting to match...",
            currentAction:'codeMatch'

        });
    }, [address, cancelCreateOrJoinMatch, code, connectFreeWithCode, startTimeout])
    
    const handleRetryCodeMatch = useCallback(() => {
        setTimedOut(false);
        connectFreeWithCode(address, code);
        startTimeout(() => proceedCreateOrJoin());
    }, [address, code, connectFreeWithCode, proceedCreateOrJoin, startTimeout]);

    function stake() {
        if (!address) return   toast.error("Please Connect wallet");
         setModal({open: true,mode: "stake",header: "Stake against anybody",description: "compete and earn against other players around the world",currentAction:'stakeMatch'});        
    }

    function stakeAgainstFriends() {
        if (!address) return toast.error("Please Connect wallet")
        setModal({open: true,mode: "friendlyStake",header: "Stake against Friends",description: "compete and earn against friends and relatives around the world",currentAction: 'friendlyStake'});
    }

    function cancelPayment() {
        setStakeAmount(0);
        setModal((prev) => ({ ...prev, open: false }))
    }

    function getRetryHandler() {
        if (modal.currentAction === "quickMatch") return handleRetryQuickMatch;
        if (modal.currentAction === "codeMatch") return handleRetryCodeMatch;
        if (modal.currentAction === "stakeMatch") return () => {}
        return () => {};
    }

    async function handleStake() {
        const stakingPrice = stakeAmount * TOKEN_DECIMALS;
        if ( stakingPrice > userBalance) return toast.error("StakeAmount is greater than your balance")
         setModal({open: true,mode: "connecting",header: "Processing Payment...",description: "Please wait while we check for available games",currentAction: 'stakeMatch'});
        const gameCheck = await new Promise<{ success: boolean, gameId: string }>((resolve) => {
            socketService.getSocket().emit('checkStakedGame',
                { price: stakingPrice, walletAddress: address.toLowerCase() },
                (response: { success: boolean, gameId: string }) => {
                    resolve(response);
                }
            );
        });

        const shouldCreateGame = gameCheck.success;
        const existingGameId = gameCheck.gameId || '';
        const createdCoins = await client.getCoins({ owner: address, coinType: "0x2::oct::OCT" });

        if (!createdCoins.data.length) { 
            setModal(prev => ({ ...prev, open: false }));
            return toast.error("An error occurred while processing payment");
        }

        const coinId = createdCoins.data[0].coinObjectId;
        const transaction = new Transaction();
        const [paymentCoin] = transaction.splitCoins(transaction.object(coinId), [transaction.pure.u64(stakingPrice)]);
        try {
            if (shouldCreateGame) {
                transaction.moveCall({ target: `${VAULT_PACKAGE_ID}::vault::createGame`, arguments: [transaction.object(VAULT_OBJECT_ID), paymentCoin] })
                await signAndExecute({ transaction: transaction }, {
                        onSuccess: (response) => {
                            const status = response.effects?.status?.status;
                            if (status === 'success') {
                                console.log('Transaction successful');

                                const newGameId = response.objectChanges?.find(object => object.type === 'created' && object.objectType?.includes('GameSession'))?.objectId;
                                const paymentTransactionId = response.digest;
                                console.log('Game ID:', newGameId);

                                socketService.createPaidMatch(newGameId, paymentTransactionId, address, stakingPrice);
                                setModal({
                                    open: true, mode: "connecting", header: "Waiting for Opponent",
                                    description: "Your staked game is ready. Waiting for another player to join...",
                                    currentAction: 'stakeMatch'
                                });

                                startTimeout(() => {
                                    setTimedOut(true);
                                    socketService.getSocket().emit('pauseStakedGameConnection', { newGameId, paymentTransactionId, address, stakingPrice });
                                });

                            } else {
                                const error = response.effects?.status?.error;
                                if (error?.includes('1001')) {
                                    toast.error("Gameplay is paused");
                                } else if (error?.includes('1002')) {
                                    toast.error("Invalid stake amount");
                                } else if (error?.includes('1013')) {
                                    toast.error("Insufficient balance");
                                } else {
                                    toast.error("Game creation failed");
                                }
                            }
                        },
                        onError: (error) => {
                            toast.error("Payment failed, please try again.");
                            console.error(error);
                        }
                    });
                toast.success("Joined match successfully!");

            }
        // catch (err) {
        //     toast.error("something went wrong joining game.");
        //     console.error(err);
        // }
        // return;
        }
            // transaction.moveCall({ target: `${VAULT_PACKAGE_ID}::vault::joinGame`, arguments: [transaction.object(VAULT_OBJECT_ID), transaction.object(gameId), paymentCoin] })
            // try {
            //     const result = await signAndExecute({ transaction: transaction }, {
            //         onSuccess: (response) => {
            //             const status = response.effects?.status?.status;
            //             if (status === 'success') {
            //                 console.log('Transaction successful');
            //                 const gameId = response.objectChanges?.find(object => object.type === 'mutated' && object.objectType?.includes('GameSession'))?.objectId;
            //                 const paymentTransactionId = response.digest;
            //                 console.log('Game ID:', gameId);
            //                 socketService.createPaidMatch(gameId, paymentTransactionId, address, stakingPrice);
            //             } else {
            //                 const error = response.effects?.status?.error;
            //                 if (error?.includes('1001')) {
            //                     toast.error("Gameplay is paused");
            //                 } else if (error?.includes('1015')) {
            //                     toast.error("Invalid Game State");
            //                 } else if (error?.includes('1002')) {
            //                     toast.error("Invalid amount to join game");
            //                 } else if (error?.includes('1012')) {
            //                     toast.error("Invalid game");
            //                 } else {
            //                     toast.error("Game Joining failed");
            //                 }
            //             }
            //         },
            //         onError: (error) => {
            //             toast.error("Payment failed, please try again.");
            //             console.error("error response: ", error);
            //         }
            //     })

            // }
            
        catch (error) {
            toast.error("something went wrong joining game.");
            console.error("error joining game: ", error);
        }
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
            return <PaymentInput stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} balance={userBalance} onProceed={()=>{}} onCancel={cancelPayment}/>
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
    const players = []

    const BoostPack = () => (
        <section className="boostpack ">
            <nav>
                <h5>Inventory</h5>
                <Button className={cn("refresh ribeye")}>refresh</Button>
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
            <Button className={cn("w-[160px] h-[35px] rounded ribeye text-[1rem]")}>Loot Daily crate</Button>
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

    const LeadersBoard = () => (
        <div className="leadersBoard">
            <header>Live LeaderBoard</header>
            {
                players.length == 0 ?
                    <span>
                        <h3> No Records currently</h3>
                    </span>
                    :
                    <div>
                    </div>
            }
        </div>
    )

    const HowToPlay = () => (
        <article className="howToPlay">
            <header>
                How to play
            </header>
            <p>
                this is how to play or what is the text of the cow becoming a cook when the rator doesnt
                find the set Pause Count down at the top of the roof.
            </p>
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
