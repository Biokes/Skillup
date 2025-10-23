import Features from "@/components/features";
import Footer from "@/components/footer";

export default function GameHub() {
    return (
        <main className="gap-4">
            <nav className="fixed h-[80px] flex justify-between py-1 px-3 bg-muted/20 w-full z-10 glass">
                <aside className="w-[100px] h-[50px]">
                    <img src="/logo.png" alt="" className="object-cover object-center" />
                </aside>
            </nav>
            <section>
                <Features />
                <Footer />
            </section>
        </main>
    )
}