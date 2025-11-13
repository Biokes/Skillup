import { Button } from "@/components/ui/button"

export default function LandingPage() { 
    const Navbar = ()=> (
        <nav className='flex flex-col justify-between items-center'>
            <aside className='w-[120px] h-[120px]'>
                <img src="/favicon-16x16.png" alt="logo" className="object-cover object-contain"/>
            </aside>
            <Button>
                connect wallet
            </Button>
        </nav>
    )
    const Hero = () => (
        <main className='hero'>

        </main>
    )
    return (
        <main>
            <Navbar />
            <Hero/>
        </main>
    )
}