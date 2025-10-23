import { motion } from "framer-motion";
import { Zap, Trophy, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate()
  const Hero = () => (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={'/background3.jpeg'} alt="ChainSkills Arena" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/20 to-background" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4 max-w-5xl mx-auto">
        <motion.div animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0], }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, }} className="text-center mt-20"
        >
          <h1 className="text-6xl md:text-8xl font-[700] ribeye">
            <span className="text-gradient">Chainskills Arena</span>
          </h1>
          <p className="text-sm md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto hero_bold">
            <span className="text-gradient">
              Connect, Play competitive games. Win crypto.
            </span><br /> Join the on-chain gaming revolution.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <Button onClick={() => { navigate('/hub') }} className="animate-pulse ribeye hover:scale-[1.07] transition transform-all ">
            Take me to the Hub
            <ArrowRight className="mr-2 h-5 w-7" />
          </Button>
        </motion.div>
      </div>

    </section>
  )
  const FAQ = () => (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent to-card/50">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient ribeye">Why Chainskills Arena?</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center glow-cyan">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Instant Payouts</h3>
            <p className="text-muted-foreground">
              Win games, earn crypto instantly. No waiting, no middlemen. Your winnings are yours immediately.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="glass p-8 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center glow-purple">
              <Trophy className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Skill-Based</h3>
            <p className="text-muted-foreground">
              Pure skill, zero luck. Every game is fair and transparent. The best player wins, always.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="glass p-8 rounded-2xl text-center">
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
  )
  const Footer = () => (
    <footer className="py-4 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-muted-foreground text-sm text-gradient">
          &copy; {new Date().getFullYear()} Chainskills Arena. Play responsibly. All games are skill-based and on-chain.
        </p>
      </div>
    </footer>
  )
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
