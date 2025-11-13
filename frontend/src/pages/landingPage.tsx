import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
    const Navbar = () => (
        <nav className='flex justify-between items-center h-[70px] py-2 px-2'>
            <aside className='w-[70px] h-[70%]'>
                <img src="/logo.png" alt="logo" className="w-full h-full object-cover object-contain" />
            </aside>
            <Button>
                connect wallet
            </Button>
        </nav>
    )
    const Hero = () => (
        <main className='hero'>
            <motion.article
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                className="text-center mt-20"
            >
                <h1 className="text-6xl md:text-8xl font-[700] ribeye">
                    <span className="text-gradient">Chainskills Arena</span>
                </h1>
                <p className="text-sm md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto hero_bold">
                    <span className="text-gradient">
                        Connect, Play competitive games. Win crypto.
                    </span>
                    <br /> Join the on-chain gaming revolution.
                </p>
            </motion.article>
        </main>
    )
    const TopGames = () => (
        <section className='w-full p-2'>
            <p className='text-gradient ribeye text-[1.5rem] pl-[40px] text-start'>Top Games</p>
            <article className="flex flex-col md:flex-row px-1 w-full md:h-[300px]">
                <aside
                    style={{
                        backgroundImage: `url(/background1.jpeg)`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                    className='rounded-lg overflow-hidden h-[300px] max-w-[500px] w-full flex flex-row items-end'
                >
                    <motion.button
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                        className={'h-[30px] rounded-sm bg-black px-2 ml-5 mb-2 text-glow-cyan ribeye transition-all transform hover:scale-[1.05]'}>
                        play now
                    </motion.button>
                </aside>
                <section className="flex flex-row sm:flex-col sm:w-[50%] py-2 gap-2 ">
                    <aside
                        style={{
                            backgroundImage: `url(/background2.jpeg)`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                        className='rounded-lg overflow-hidden h-[250px] md:h-full  sm:max-w-[300px] w-full flex flex-row items-end'
                    >
                        <motion.button
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                            className={'h-[30px] rounded-sm bg-black px-2 ml-5 mb-2 text-glow-cyan ribeye transition-all transform hover:scale-[1.05]'}>
                            play now
                        </motion.button>
                    </aside>
                    <aside
                        style={{
                            backgroundImage: `url(/background1.jpeg)`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                        className='rounded-lg overflow-hidden h-[250px] md:h-full  sm:max-w-[300px] w-full flex flex-row items-end'
                    >
                        <motion.button
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                            className={'h-[30px] rounded-sm bg-black px-2 ml-5 mb-2 text-glow-cyan ribeye transition-all transform hover:scale-[1.05]'}>
                            play now
                        </motion.button>
                    </aside>
                </section>
            </article>
        </section>
    )
    return (
        <main className="w-full">
            <Navbar />
            <Hero />
            <TopGames />
        </main>
    )
}