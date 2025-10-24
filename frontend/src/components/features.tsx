import checkersIcon from "@/assets/checkers-icon.jpg";
import pingpongIcon from "@/assets/pingpong-icon.jpg";
import rpsIcon from "@/assets/rps-icon.jpg";
import poolIcon from "@/assets/pool-icon.jpg";
import airHockeyIcon from "@/assets/airhockey-icon.jpg";
import chessIcon from "@/assets/chess-icon.jpg";
import { GameCard } from "@/components/GameCard";
import { useState } from "react";
import { motion } from "framer-motion";
import {useNavigate } from "react-router-dom";

export default function Features() {

    const navigate = useNavigate ()
    return (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="text-gradient ribeye">Featured Games</span>
                    </h2>
                    <p className="text-muted-foreground max-w-3xl mx-auto text-md">
                        Choose your game, connect your wallet, and start earning. All games are skill-based and provably fair.
                    </p>
                </motion.div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} >
                        <GameCard title="Checkers Arena" description="Classic checkers with a futuristic twist. Play against opponents worldwide and win ETH." image={checkersIcon} players="2 Players" status="available" onPlay={() => navigate("/checkers")} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                        <GameCard title="Cyber Ping Pong" description="Fast-paced arcade action with real-time physics. React quickly and dominate the arena." image={pingpongIcon} players="2 Players" status="available" onPlay={() => navigate("/pingpong")} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                        <GameCard title="RPS Arena" description="Classic rock-paper-scissors in a cyber arena. Quick thinking and strategy required." image={rpsIcon} players="2 Players" status="available" onPlay={() => navigate("/rps")} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                        <GameCard title="Pool Arena" image={poolIcon} players="2 Players" description="3D billiards with realistic physics. Sink all your balls and dominate the table." status="available" onPlay={() => navigate("/pool")} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} >
                        <GameCard title="Air Hockey Arena" description="Lightning-fast 3D air hockey. Defend your goal and score against the AI opponent." image={airHockeyIcon} players="2 Players" status="available" onPlay={() => navigate("/airhockey")} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
                        <GameCard title="Battle Chess" description="Strategic warfare on a holographic board. Outsmart your opponent and claim victory." image={chessIcon} players="2 Players" status="available" onPlay={() => navigate("/chess")} />
                    </motion.div>
                </div>
            </div>
          </section>
    )
}