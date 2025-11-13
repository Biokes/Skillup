import { Button } from "@/components/ui/button"
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
            <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, }}
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
            </motion.div>
        </main>
    )
    return (
        <main className="w-full">
            <Navbar />
            <Hero />
        </main>
    )
}