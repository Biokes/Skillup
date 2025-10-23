import { useState } from "react";
import { motion } from "framer-motion";
import { WalletConnect } from "@/components/WalletConnect";
import { GameCard } from "@/components/GameCard";
import { CheckersBoard } from "@/components/checkers/CheckersBoard";
import { PingPongGame } from "@/components/pingpong/PingPongGame";
import { RockPaperScissors } from "@/components/rps/RockPaperScissors";
import { PoolGame } from "@/components/pool/PoolGame";
import { AirHockeyGame } from "@/components/airhockey/AirHockeyGame";
import { ChessGame } from "@/components/chess/ChessGame";
import { Gamepad2, Zap, Trophy, Users } from "lucide-react";
import heroImage from "@/assets/gaming-hero.jpg";
import checkersIcon from "@/assets/checkers-icon.jpg";
import pingpongIcon from "@/assets/pingpong-icon.jpg";
import rpsIcon from "@/assets/rps-icon.jpg";
import poolIcon from "@/assets/pool-icon.jpg";
import airHockeyIcon from "@/assets/airhockey-icon.jpg";
import chessIcon from "@/assets/chess-icon.jpg";

const Index = () => {
  const [currentView, setCurrentView] = useState<"hub" | "checkers" | "pingpong" | "rps" | "pool" | "airhockey" | "chess">("hub");

  if (currentView === "checkers") {
    return <CheckersBoard onBack={() => setCurrentView("hub")} />;
  }

  if (currentView === "pingpong") {
    return <PingPongGame onBack={() => setCurrentView("hub")} />;
  }

  if (currentView === "rps") {
    return <RockPaperScissors onBack={() => setCurrentView("hub")} />;
  }

  if (currentView === "pool") {
    return <PoolGame onBack={() => setCurrentView("hub")} />;
  }

  if (currentView === "airhockey") {
    return <AirHockeyGame onBack={() => setCurrentView("hub")} />;
  }

  if (currentView === "chess") {
    return <ChessGame onBack={() => setCurrentView("hub")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Gaming Arena"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        </div>

        <div className="relative z-10 text-center space-y-8 px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-9xl font-bold mb-6">
              <span className="text-gradient">GameFi Arena</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Play competitive games. Win crypto. Join the on-chain gaming revolution.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <WalletConnect />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 pt-12"
          >
            <div className="glass p-6 rounded-2xl flex items-center gap-4 min-w-[200px]">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-bold text-gradient">1,234</div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl flex items-center gap-4 min-w-[200px]">
              <Trophy className="h-8 w-8 text-secondary" />
              <div>
                <div className="text-3xl font-bold text-gradient">$50K</div>
                <div className="text-sm text-muted-foreground">Total Prizes</div>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl flex items-center gap-4 min-w-[200px]">
              <Gamepad2 className="h-8 w-8 text-accent" />
              <div>
                <div className="text-3xl font-bold text-gradient">6</div>
                <div className="text-sm text-muted-foreground">Games Live</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <Zap className="h-8 w-8 text-primary animate-bounce" />
        </motion.div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Featured Games</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your game, connect your wallet, and start earning. All games are skill-based and provably fair.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <GameCard
                title="Checkers Arena"
                description="Classic checkers with a futuristic twist. Play against opponents worldwide and win ETH."
                image={checkersIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("checkers")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <GameCard
                title="Cyber Ping Pong"
                description="Fast-paced arcade action with real-time physics. React quickly and dominate the arena."
                image={pingpongIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("pingpong")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <GameCard
                title="RPS Arena"
                description="Classic rock-paper-scissors in a cyber arena. Quick thinking and strategy required."
                image={rpsIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("rps")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <GameCard
                title="Pool Arena"
                description="3D billiards with realistic physics. Sink all your balls and dominate the table."
                image={poolIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("pool")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <GameCard
                title="Air Hockey Arena"
                description="Lightning-fast 3D air hockey. Defend your goal and score against the AI opponent."
                image={airHockeyIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("airhockey")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <GameCard
                title="Battle Chess"
                description="Strategic warfare on a holographic board. Outsmart your opponent and claim victory."
                image={chessIcon}
                players="2 Players"
                status="available"
                onPlay={() => setCurrentView("chess")}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Why GameFi Arena?</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center glow-cyan">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instant Payouts</h3>
              <p className="text-muted-foreground">
                Win games, earn crypto instantly. No waiting, no middlemen. Your winnings are yours immediately.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center glow-purple">
                <Trophy className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Skill-Based</h3>
              <p className="text-muted-foreground">
                Pure skill, zero luck. Every game is fair and transparent. The best player wins, always.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass p-8 rounded-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center glow-magenta">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Global Community</h3>
              <p className="text-muted-foreground">
                Play against opponents worldwide. Join tournaments, climb leaderboards, and become a legend.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 GameFi Arena. Play responsibly. All games are skill-based and on-chain.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
