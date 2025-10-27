import checkersIcon from "@/assets/checkers-icon.jpg";
import pingpongIcon from "@/assets/pingpong-icon.jpg";
import rpsIcon from "@/assets/rps-icon.jpg";
import poolIcon from "@/assets/pool-icon.jpg";
import airHockeyIcon from "@/assets/airhockey-icon.jpg";
import chessIcon from "@/assets/chess-icon.jpg";
import { GameCard } from "@/components/GameCard";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GameMatchModal } from "./modals/GameMatchModal";
import { BASE_URL } from "@/lib/utils";
import { useGame } from "@/hooks/useGameContext";
import { toast } from "sonner";
import { useDAppConnector } from "@/contexts/clientProviders";

export default function Features() {
    const navigate = useNavigate();
    const [isOpenModal, setOpenModal] = useState(false);
    const { gameType, setGameType, findQuickMatch, createFriendlyRoom } = useGame()
    // const { userAccountId } = useDAppConnector ?? {}

    const games = [
        { title: "Checkers Arena", description: "Classic checkers...", image: checkersIcon, players: "2 Players", type: "checkers", path: "/checkers", delay: 0.1 },
        // { title: "Cyber Ping Pong", description: "Fast-paced arcade action...", image: pingpongIcon, players: "2 Players", type: "pingpong", path: "/pingpong", delay: 0.2 },
        // { title: "RPS Arena", description: "Classic rock-paper-scissors...", image: rpsIcon, players: "2 Players", type: "rps", path: "/rps", delay: 0.3 },
        // { title: "Pool Arena", description: "3D billiards...", image: poolIcon, players: "2 Players", type: "pool", path: "/pool", delay: 0.4 },
        // { title: "Air Hockey Arena", description: "Lightning-fast air hockey...", image: airHockeyIcon, players: "2 Players", type: "airhockey", path: "/airhockey", delay: 0.5 },
        // { title: "Battle Chess", description: "Strategic warfare...", image: chessIcon, players: "2 Players", type: "chess", path: "/chess", delay: 0.6 },
    ];

    const openModal = (gameType: string) => {
        setOpenModal(true);
        setGameType(gameType)

    };

    const handleSelectMatchType = (matchType: string) => {
        // if (matchType === "quick") return;
        // if (selectedGame) {
        //     // setOpenModal(false);
        //     // navigate(`/${selectedGame}?mode=${matchType}`);
        // }
    };


    const handleCreateQuickMatch = () => {
        findQuickMatch()
        setOpenModal(false);
        navigate(`/${gameType}`);
    }

    return (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="text-gradient ribeye">Featured Games</span>
                    </h2>
                    <p className="text-muted-foreground max-w-3xl mx-auto text-md">
                        Choose your game, connect your wallet, and start earning.
                    </p>
                </motion.div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {games.map((game, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: game.delay }}
                        >
                            <GameCard
                                title={game.title}
                                description={game.description}
                                image={game.image}
                                players={game.players}
                                status="available"
                                onPlay={() => {
                                    // if (userAccountId) {
                                        openModal(game.type)
                                    // } else { 
                                    //     toast.warning("Please connect wallet to play")
                                    // }
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
                <GameMatchModal
                    isOpen={isOpenModal}
                    onClose={() => setOpenModal(false)}
                    onSelectMatchType={handleSelectMatchType}
                    onCreateMatch={handleCreateQuickMatch}
                    onJoinQuickMatch={() => {
                        console.log("joining quick match");
                        findQuickMatch()
                    }}
                />
            </div>
        </section>
    );
}
