export default function Footer() {
    return (
        <footer className="py-4 px-4 border-t border-border">
            <div className="max-w-7xl mx-auto text-center">
                <p className="text-muted-foreground text-sm text-gradient">
                    &copy; {new Date().getFullYear()} Chainskills Arena. Play responsibly. All games are skill-based and on-chain.
                </p>
            </div>
        </footer>
    )
}