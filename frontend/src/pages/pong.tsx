import Navbar from "@/components/commons/navbar";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Pong() {
    const Livegames = []
    const PongHero = () => (
        <section className="pong_actions">
            <motion.article
                animate={{ scale: [1, 1.1, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            >
                <Zap className='h-5 w-5' />
                <h6>Quick Match <br /> (Free)</h6>
            </motion.article>
            <article>
                <Zap className='h-5 w-5' />
                <h6>Create Room<br /> (Free)</h6>
            </article>
            <article>
                <Zap className='h-5 w-5' />
                <h6>Joing Room <br /> (Free)</h6>
            </article>
            <article>
                <Zap className='h-5 w-5' />
                <h6>Compete <br /> (Stake)</h6>
            </article>
        </section>
    )

    const LiveGames = () => (
        <section>
            {
                LiveGames.length == 0 ?
                    <h3>
                        No Live Game currently
                    </h3>
                    :
                    <div className="flex flex-wrap justify-between items-center gap-1">

                    </div>
            }
        </section>
    )

    const LeadersBoard = () => (
        <>
            leader board
        </>
    )

    const HowToPlay = () => (
        <>
            How to play
        </>
    )
    const BoostPack = () => (
        <section className="sm:h-[200px] flex flex-col sm:flex-col p-1 rounded-lg border-primary border-[2px]">
            Boost pack
        </section>
    )
    return (
        <>
            <Navbar />
            <PongHero />
            <BoostPack />

        </>
    )
}