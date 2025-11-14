import { Button } from "../ui/button";

export default function Navbar() {
    return (
        <nav className='flex justify-between items-center h-[70px] py-2 px-2 shadow-sm shadow-primary/40'>
            <aside className='w-[70px] h-[70%]'>
                <img src="/logo.png" alt="logo" className="w-full h-full object-cover object-contain" />
            </aside>
            <Button>
                connect wallet
            </Button>
        </nav>
    )
}