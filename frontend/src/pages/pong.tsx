import Navbar from "@/components/commons/navbar";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinGameResponse, PopupProps } from "@/types";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useOneChainGame } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService"; 
import { useNavigate } from "react-router-dom";

export default function Pong() {
    const { quickMatch, retryQuickMatch, cancelQuickMatch } = useOneChainGame();
    const [modalProps, setMmodalProps] = useState<PopupProps>({
        isOpen: false,
        headerText: '',
        description: '',
        body: <></>
    })
    const navigate= useNavigate()
    const socket = socketService.getSocket();
    const account = useCurrentAccount() ?? {};
    const address = account?.address ?? null;
    const [isActiveTimed, activeTimed] = useState<boolean>(false)

    useEffect(() => {
        socket.on('joined', (joinResponse: JoinGameResponse) => { 
            if (address) { 
                const hasJoined: boolean = joinResponse.player1.toLowerCase() === String(address).toLowerCase() || joinResponse.player2.toLowerCase() === String(address).toLowerCase();
                if (hasJoined) {
                    navigate('/pong', {state: joinResponse})
                }
            }
        })
        return () => {
            socketService.off("joined")
        };
     },[socket, address, navigate])
    
    const [connectionNode, setConnectionNode] = useState(
        <section className='connecting'>
            <Loader2 className="loading" />
            <motion.h5
                className="ribeye text-gradient"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >Connecting to game server</motion.h5>
            <Button className={cn('cancelButton')} onClick={cancelConnection}>
                Cancel
            </Button>
        </section>
    )

    const handleRetry= useCallback(()=>{
        activeTimed(false);
        setTimeout(() => {
            activeTimed(true);
        }, 20000);
        retryQuickMatch(address);
    }, [address, retryQuickMatch])

    const handleCancelTimeout = useCallback(()=>{
        cancelQuickMatch(address);
        activeTimed(false);
        setMmodalProps(prev => ({ ...prev, isOpen: false }));
    }, [address, cancelQuickMatch])
    
    useEffect(() => { 
        setConnectionNode(!isActiveTimed ?
             <section className='connecting'>
                    <Loader2 className="loading" />
                    <motion.h5
                        className="ribeye text-gradient"
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                    >Connecting to game server</motion.h5>
                    <Button className={cn('cancelButton')} onClick={cancelConnection}>
                        Cancel
                    </Button>
            </section>
            :
            <section className="failedConnection">
                <p>
                    Cannot find opponent
                </p>
                <footer>
                    <Button onClick={handleRetry}>
                        Try Again
                    </Button>
                    <Button onClick={handleCancelTimeout}>
                        Cancel
                    </Button>
                </footer>
            </section>
        )
    },[handleCancelTimeout, handleRetry, isActiveTimed])

    function cancelConnection() {
        activeTimed(false)
        setMmodalProps((prev) => ({ ...prev, isOpen: false }))
    }

  

    const Connecting = () => ( 
            connectionNode
        )
    

    function findQuickMatch() {
        if (!address) {
            toast.info("please connect wallet")
            return;
        }
        quickMatch(address);

        setTimeout(() => {
            activeTimed(true);
        }, 20000);

        setMmodalProps({
            body: <Connecting />,
            isOpen: true,
            headerText: 'Quick Match (Free)',
            description: 'Connecting to play a quick free match',
        })
    }

    // function createFreeRoom() { 
    //     if (!address) { 
    //         toast.info("please connect wallet")
    //         return;
    //     }
    //     setMmodalProps({
    //         body: <></>,
    //         isOpen: true,
    //         headerText: 'Create Room(Free)',
    //         description:'Create game connection room with friends'
    //     })
    // }

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
            action: () => { }
        },
        {
            texts: 'Frendly Stake',
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
                    {modalProps.body}
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