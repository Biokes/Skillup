import Navbar from "@/components/commons/navbar";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, TIMEOUT_DURATION } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, PopupProps } from "@/types";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";


export default function Pong() {
    const { quickMatch, retryQuickMatch, cancelQuickMatch, cancelCreateOrJoinMatch } = useOneChainGame();
    const [modalProps, setModalProps] = useState<PopupProps>({
        isOpen: false,
        headerText: '',
        description: '',
        body: <></>
    })
    const navigate = useNavigate()
    const account = useCurrentAccount() ?? {};
    const address = account?.address ?? null;
    const [isActiveTimed, setActiveTimed] = useState<boolean>(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        if (!socketService.isConnected()) {
            socketService.connect(address || "");
            console.log("🔌 Socket initialized");
        }
        const handleJoined = (joinResponse: JoinGameResponse) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            if (address) {
                const hasJoined: boolean = 
                    joinResponse.player1.toLowerCase() === String(address).toLowerCase() ||
                    joinResponse.player2.toLowerCase() === String(address).toLowerCase();
                
                if (hasJoined) {
                    setActiveTimed(false);
                    setIsConnecting(false);
                    setModalProps(prev => ({ ...prev, isOpen: false }));
                    navigate('/pong', { state: joinResponse });
                }
            }
        };

        socketService.on('joined', handleJoined);

        return () => {
            socketService.off('joined', handleJoined);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [address, navigate])

    const startConnectionTimeout = useCallback((cancelQuickMatch: ()=>void) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            cancelQuickMatch()
            setActiveTimed(true);
        }, TIMEOUT_DURATION);
    }, [])

    const handleRetryQuickMatch = useCallback(() => {
        setActiveTimed(false);
        setIsConnecting(true);
        retryQuickMatch(address);
        const cancel =()=>cancelQuickMatch(address)
        startConnectionTimeout(cancel);
    }, [address, retryQuickMatch, startConnectionTimeout, cancelQuickMatch])

    const handleCancelTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        cancelQuickMatch(address);
        setActiveTimed(false);
        setIsConnecting(false);
        setModalProps(prev => ({ ...prev, isOpen: false }));
    }, [address, cancelQuickMatch])
    
    const ConnectingSection = () => (
        <section className='connecting'>
            <Loader2 className="loading" />
            <motion.h5
                className="ribeye text-gradient"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >Connecting to game server</motion.h5>
            <Button className={cn('cancelButton')} onClick={handleCancelTimeout}>
                Cancel
            </Button>
        </section>
    )

    const cancelConnection=  useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setActiveTimed(false);
        setIsConnecting(false);
        setModalProps(prev => ({ ...prev, isOpen: false }));
    }, [])

    const FailedConnectionSection = ({handleRetry}:{handleRetry: ()=>void}) => (
        <section className="failedConnection">
            <p>
                Cannot find opponent
            </p>
            <footer>
                <Button onClick={handleRetry}>
                    Try Again
                </Button>
                <Button onClick={cancelConnection}>
                    Cancel
                </Button>
            </footer>
        </section>
    )

    const getConnectionNode = ({handleRetry}:{handleRetry: ()=>void}) => {
        if (!isActiveTimed && isConnecting) {
            return <ConnectingSection />
        } else if (isActiveTimed && isConnecting) {
            return <FailedConnectionSection handleRetry={handleRetry}/>
        }
        return <ConnectingSection />
    }

    function findQuickMatch() {
        if (!address) {
            toast.info("please connect wallet")
            return;
        }
        setIsConnecting(true);
        setActiveTimed(false);
        
        quickMatch(address);
        const cancel =()=>cancelQuickMatch(address)
        startConnectionTimeout(cancel);

        setModalProps({
            body: getConnectionNode({handleRetry: handleRetryQuickMatch}),
            isOpen: true,
            headerText: 'Quick Match (Free)',
            description: 'Connecting to play a quick free match',
        })
    }

    
    function createOrJoinMatch() { 
         if (!address) {
            toast.info("please connect wallet")
            return;
        }
        setIsConnecting(true);
        setActiveTimed(false);
        const cancel = () => cancelCreateOrJoinMatch(address);
        startConnectionTimeout(cancel);
        setModalProps({
            body: getConnectionNode({handleRetry: handleRetryQuickMatch}),
            isOpen: true,
            headerText: 'Create Or Join a Match',
            description: 'Connect with other players with code.'
        })
    }

    const games = [
        {
            texts: 'Quick match',
            gameType: 'free',
            icon: <Zap className='h-5 w-5' />,
            action: findQuickMatch
        },
        {
            texts: 'Create/join room',
            gameType: 'free',
            icon: <Zap className='h-5 w-5' />,
            action: createOrJoinMatch
        },
        {
            texts: 'Friendly Stake',
            gameType: 'Stake',
            icon: <Zap className='h-5 w-5' />,
            action: () => { }
        },
        {
            texts: 'Compete',
            gameType: 'Stake',
            icon: <Zap className='h-5 w-5' />,
            action: () => { }
        },
    ]
    const powerups = [
        {
            name: 'Multiball mayhem',
            icon: '🎆',
            description: 'splits the ball for a burst of chaotic offence',
            owned: 0,
        },
        {
            name: 'Pat Stretch',
            icon: '💪',
            description: 'Increase the length of your pat for clutch saves',
            owned: 0,
        },
        {
            name: 'Guardian Shield',
            icon: '🛡️',
            description: 'Summons an energy barrier that block one goal',
            owned: 0,
        }
    ]
    const livegames = []
    const players = []

    const MenuDialog = ({ modalProps }: { modalProps: PopupProps }) => (
        <Dialog open={modalProps.isOpen} onOpenChange={(open) => { if (!open) return }}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className={'text-start text-gradient ribeye'}>
                        {modalProps.headerText}
                    </DialogTitle>
                    <DialogDescription>
                        {modalProps.description}
                    </DialogDescription>
                </DialogHeader>
                <div className="dialogBody">
                    {getConnectionNode({handleRetry: handleRetryQuickMatch})}
                </div>
            </DialogContent>
        </Dialog>
    )

    const PongHero = () => (
        <div className='pong_hero'>
            <section>
                {
                    games.map((game, index) => (
                        <motion.article key={index}
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            transition={{ duration: 0.2, ease: "easeInOut", repeat: Infinity }}
                            whileHover={{ scale: [1.1, 1.3, 1.1], rotate: [0, 2, -2, 0] }}
                            onClick={game.action}
                        >
                            {/* {game.icon} */}
                            <h6 className={'text-gradient'}>{game.texts} <br /> ({game.gameType})</h6>
                        </motion.article>
                    ))
                }
            </section>
        </div>
    )
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
                    <span className="">
                        <h3>
                            No Live Game currently
                        </h3>
                    </span>
                    :
                    <div className="">
                        {
                            livegames.map((game, index) => (
                                <article key={index}>
                                    {game}
                                </article>
                            ))
                        }
                    </div>
            }
        </section>
    )
    const LeadersBoard = () => (
        <div className="leadersBoard">
            <header>Live LeaderBoard</header>
            {
                players.length == 0 ?
                    <span className="">
                        <h3>
                            No Records currently
                        </h3>
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
            <PongHero />
            <BoostPack />
            <BottomCard />
            <MenuDialog modalProps={modalProps} />
        </>
    )
}