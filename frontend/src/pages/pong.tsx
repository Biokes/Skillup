import Navbar from "@/components/commons/navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, TIMEOUT_DURATION, TOKEN_DECIMALS } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, JoinWithCodeResponse } from "@/types";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { Input } from "@/components/ui/input";

function ConnectingSection({ onCancel }: { onCancel: () => void }) {
    return (
        <section className='connecting'>
            <Loader2 className="loading" />
            <motion.h5
                className="ribeye text-gradient"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >
                Connecting to game server
            </motion.h5>
            <Button className="cancelButton" onClick={onCancel}>Cancel</Button>
        </section>
    );
}

function FailedConnectionSection({ onRetry, onCancel }: { onRetry: () => void; onCancel: () => void }) {
    return (
        <section className="failedConnection">
            <p className="text-gradient">Cannot find opponent</p>
            <footer>
                <Button onClick={onRetry}>Try Again</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </footer>
        </section>
    );
}

function CodeInput({ code, setCode, onProceed, onCancel }: { code: string; setCode: (v: string) => void; onProceed: () => void; onCancel: () => void}) {
    return (
        <section className='codeCreator'>
            <Input type="text" placeholder="Enter code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <div>
                <Button disabled={code.length !== 6} onClick={onProceed}>Proceed</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </div>
        </section>
    );
}

function PaymentInput({ stakeAmount, setStakeAmount, onProceed, onCancel, balance }: { balance: number; stakeAmount: number; setStakeAmount: (v: number) => void; onProceed: () => void; onCancel: () => void }) {
    const [pos, setPos] = useState<number>(-1);
    return (
        <section className='codeCreator'>
            <section>
               <p>Bal: {balance}</p>
            </section>
            <div >
                {['0.1','0.5','1','5'].map((val, index) => (
                    <p key={index} className={`${pos === index ? 'bg-primary/20' : ''}`}
                        onClick={() => { 
                            setPos(index)
                            setStakeAmount(Number(val))
                        }}
                    >{val} ONE</p>
                ))}
            </div>
            <div>
                <Button disabled={stakeAmount<0 || pos === -1 || balance < stakeAmount} onClick={onProceed}>Pay</Button>
                <Button onClick={() => {
                    setPos(-1)
                    setStakeAmount(0)
                    onCancel()
                }}>Cancel</Button>
            </div>
        </section>
    );
}

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
        currentAction: "quickMatch" | "codeMatch"| "stake" | null; 
    }>({ open: false, mode: null, header: "", description: "", currentAction: null });
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
                    // setIsConnecting(false);
                    setModal({ description:"",header:'', currentAction: null, mode: null, open: false });
                    navigate("/pong", { state: response });
                }
            }
        }

        socketService.on("joined", onJoined);
        socketService.on('joinedWithCode',joinWithCode)

        return () => {
            socketService.off("joined", onJoined);
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
        // setIsConnecting(false);
        setModal({ currentAction:null,mode:mode, header:'', description:'', open: false });
    }, [address]);

    const handleRetryQuickMatch = useCallback(() => {
        setTimedOut(false);
        // setIsConnecting(true);
        retryQuickMatch(address);
        startTimeout(() => cancelQuickMatch(address));
    }, [address, cancelQuickMatch, retryQuickMatch, startTimeout]);

    function findQuickMatch() {
        if (!address) return toast.info("Please connect wallet");
        // setIsConnecting(true);
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
    async function getUserBalance() {
        try {
            const balanceData = await client.getBalance({ owner: address });
            const totalBalance = balanceData?.totalBalance ?? "0";
            return Number(totalBalance) / TOKEN_DECIMALS;
        } catch (error: unknown) { 
            toast.error("Couldn't fetch balance, check your internet connection or refresh");
            console.error('bal error: ', error)
            return 0;
        }
    }
    useEffect(() => {
        if (address) {
            getUserBalance().then(balance => {
                setUserBalance(balance);
            });
        }
    }, [address]);

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
        // setIsConnecting(true);
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
        // setIsConnecting(true);
        connectFreeWithCode(address, code);
        startTimeout(() => proceedCreateOrJoin());
    }, [address, code, connectFreeWithCode, proceedCreateOrJoin, startTimeout]);

    function stake() {
        if (!address){
            toast.error("Please Connect wallet");
            return;
        }
         setModal({
            open: true,
            mode: "stake",
            header: "Stake against anybody",
            description: "compete and earn against other players around the world",
            currentAction: 'stake'
         });        
    }

    function stakeAgainstFriends() {
        if (!address) {
            toast.error("Please Connect wallet")
            return;
        }
        setModal({
        open: true,
        mode: "friendlyStake",
        header: "Stake against Friends",
        description: "compete and earn against friends and relatives around the world",
        currentAction: 'stake'
        });
    }
    function cancelPayment() {
        setStakeAmount(0);
        setModal((prev) => ({ ...prev, open: false }))
    }
    function getRetryHandler() {
        if (modal.currentAction === "quickMatch") return handleRetryQuickMatch;
        if (modal.currentAction === "codeMatch") return handleRetryCodeMatch;
        return () => {};
    }

    function getModalBody() {
        if (modal.mode === "connecting") {
            if (!timedOut) {
                return <ConnectingSection onCancel={() => { cancelConnection('connecting')}} />;
            } 
            return (<FailedConnectionSection onRetry={getRetryHandler()} onCancel={()=>{cancelConnection('connecting')}}/>);
        }

        if (modal.mode === "enterCode") {
            if (timedOut) {
                return (<FailedConnectionSection onRetry={proceedCreateOrJoin} onCancel={()=>{cancelConnection('enterCode')}} />);
            }
            return (
                <CodeInput code={code} setCode={setCode} onProceed={proceedCreateOrJoin} onCancel={() => {
                    setModal((prev) =>({...prev, open:false}))
                }}/>
            );
        }
        if (modal.mode === 'stake') { 
            return (
                <PaymentInput stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} balance={userBalance} onProceed={async () => {
                    // const userBalance = await client.getBalance({ owner: address }).totalBalance;
                    if (stakeAmount > (userBalance / TOKEN_DECIMALS)) { 
                        return toast.error("StakeAmount is greater than your balance")
                    }
                    const tx = new Transaction();
                    const paymentFees = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(stakeAmount * TOKEN_DECIMALS))]);
                    tx.moveCall({
                        target: 'module::vault::stake',
                        arguments:[paymentFees]
                    })
                    try {
                        const result = await signAndExecute({ transaction: tx});
                        toast.success("Joined match successfully!");
                        console.log(result);
                    }
                    catch (err) {
                        toast.error("Payment failed,please try again.");
                        console.error(err);
                    }
                }} onCancel={cancelPayment}/>
            )
        }
        if (modal.mode === "friendlyStake") {
            return (
                <PaymentInput stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} balance={userBalance} onProceed={async () => {
                    // const owner = await client.getBalance({owner: address})
                    // console.log("owner: ", owner.totalBalance);
                    // // console.log(client.getClient().options?.url)
                    // // console.log(client.transport);
                    // const tx = new Transaction();
                }} onCancel={cancelPayment} />
            )
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
