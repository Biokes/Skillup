import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Trophy } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  players: string;
  status: "available" | "coming-soon";
  onPlay?: () => void;
}

export const GameCard = ({ title, description, image, players, status, onPlay }: GameCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="glass rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/60 group"
    >
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        {status === "coming-soon" && (
          <div className="absolute top-4 right-4 bg-accent px-3 py-1 rounded-full">
            <span className="text-xs font-bold">Coming Soon</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold mb-2 text-gradient ribeye">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{players}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" />
            <span>Win ETH</span>
          </div>
        </div>

        <Button 
          variant="gaming" 
          className="w-full"
          onClick={onPlay}
          disabled={status === "coming-soon"}
        >
          {status === "available" ? "Play Now" : "Coming Soon"}
        </Button>
      </div>
    </motion.div>
  );
};
