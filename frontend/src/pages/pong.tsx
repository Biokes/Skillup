import Navbar from "@/components/commons/navbar";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Pong() {
    const games = [
        {
            texts: 'Quick match',
            gameType: 'free',
            icon: <Zap className='h-5 w-5' />,
            action: () => { }
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
    const PongHero = () => (
        <div className='pong_hero'>
            <section>
                {
                    games.map((game, index) => (
                        <motion.article key={index}
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            whileHover={{ scale: 1.2, rotate: [0, 2, -2, 0] }}
                            transition={{ duration: 0.2, ease: "easeInOut", repeat: Infinity }}
                        >
                            {game.icon}
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
        </>
    )
}