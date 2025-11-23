import Navbar from "@/components/commons/navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, TIMEOUT_DURATION } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, JoinWithCodeResponse, PopupProps } from "@/types";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";


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
            <p>Cannot find opponent</p>
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
            <input type="text" placeholder="Enter code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <div>
                <Button disabled={code.length !== 6} onClick={onProceed}>Proceed</Button>
                <Button onClick={onCancel}>Cancel</Button>
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
    const [modal, setModal] = useState<{
        mode: "connecting" | "failed" | "enterCode" | null;
        open: boolean;
        header: string;
        description: string;
        currentAction: "quickMatch" | "codeMatch" | null; 
    }>({ open: false, mode: null, header: "", description: "", currentAction: null});

    const [code, setCode] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [timedOut, setTimedOut] = useState(false);

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
                    setIsConnecting(false);
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
                    setIsConnecting(false);
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

    const cancelConnection = useCallback((mode:"connecting"| 'failed'|'enterCode'|null) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        socketService.cancelMatch(address)
        setTimedOut(false);
        setIsConnecting(false);
        setModal({ currentAction:null,mode:mode, header:'', description:'', open: false });
    }, [address]);

    const handleRetryQuickMatch = useCallback(() => {
        setTimedOut(false);
        setIsConnecting(true);

        retryQuickMatch(address);

        startTimeout(() => cancelQuickMatch(address));
    }, [address, cancelQuickMatch, retryQuickMatch, startTimeout]);

    function findQuickMatch() {
        if (!address) return toast.info("Please connect wallet");
        setIsConnecting(true);
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
        setIsConnecting(true);
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
        setIsConnecting(true);
        connectFreeWithCode(address, code);
        startTimeout(() => proceedCreateOrJoin());
    }, [address, code, connectFreeWithCode, proceedCreateOrJoin, startTimeout]);

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

        return null;
    }

    const games = [
        { texts: "Quick Match", gameType: "Free", action: findQuickMatch },
        { texts: "Create / Join", gameType: "Free", action: createOrJoinCode },
        { texts: "Friendly Stake", gameType: "Stake", action: () => {} },
        { texts: "Compete", gameType: "Stake", action: () => {} },
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
