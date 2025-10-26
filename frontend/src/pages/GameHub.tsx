import Features from "@/components/features";
import Footer from "@/components/footer";
import { WalletConnect } from "@/components/WalletConnect";
import { useNavigate } from "react-router-dom";


export default function GameHub() {
    const navigate = useNavigate()
    return (
        <main
            className="flex flex-col justify-start text-white min-h-screen"
            style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)), url(/background3.jpeg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <nav className="fixed h-[80px] flex justify-between py-1 px-3 bg-muted/20 w-full z-10 glass ">
                <aside className="w-[100px] h-[50px] cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="" className="object-cover object-center" />
                </aside>
                <aside className="h-full items-center flex">
                    <WalletConnect />
                </aside>
            </nav>
            <section className="pt-7">
                <Features />
                <Footer />
            </section>
        </main>
    )
}