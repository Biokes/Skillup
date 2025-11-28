import { useNavigate } from "react-router-dom";
import { ConnectButton, ConnectModal, useCurrentAccount } from "@onelabs/dapp-kit";
// import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate()

    return (
        <nav className='flex justify-between items-center h-[70px] py-2 px-4 shadow-sm shadow-primary/40'>
            <aside className='w-[70px] h-[70%] cursor-pointer' onClick={() => navigate('/')}>
                <img src="/logo.png" alt="logo" className="w-full h-full object-cover object-contain" />
            </aside>
            { }
            <ConnectButton className="connectButton"/>
        </nav>
    )
}