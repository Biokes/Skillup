import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
// import { useCurrentAccount } from '@onelabs/dapp-kit';
// import { ConnectButton } from '@onelabs/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';


export default function Navbar() {
    const account = useCurrentAccount();
    const navigate = useNavigate()
    return (
        <nav className='flex justify-between items-center h-[70px] py-2 px-2 shadow-sm shadow-primary/40'>
            <aside className='w-[70px] h-[70%] cursor-pointer' onClick={()=>navigate('/')}>
                <img src="/logo.png" alt="logo" className="w-full h-full object-cover object-contain" />
            </aside>
            {account.address}
            <aside className='flex gap-3 px-3'>
                <Button>
                connect button    
                </Button>
                <ConnectButton />
            </aside>
        </nav>
    )
}