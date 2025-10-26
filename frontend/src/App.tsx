import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HederaWalletProvider } from "@/contexts/HederaWalletContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GameHub from "./pages/GameHub";
import { CheckersBoard } from "./components/checkers/CheckersBoard";
import { AirHockeyGame } from "./components/airhockey/AirHockeyGame";
import { PingPongGame } from "./components/pingpong/PingPongGame";
// import { PoolGame } from "./components/pool/PoolGame";
import { RockPaperScissors } from "./components/rps/RockPaperScissors";
import { ChessGame } from "./components/chess/ChessGame";
import GameProviders from "./contexts/GameContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <HederaWalletProvider>
    <GameProviders>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/hub" element={<GameHub />} />
            <Route path="/checkers" element={<CheckersBoard />} />
            <Route path="/chess" element={<ChessGame />} />
            <Route path="/airHockey" element={<AirHockeyGame />} />
            <Route path="/pingpong" element={<PingPongGame />} />
            {/* <Route path="/pool" element={<PoolGame/>} />  */}
            <Route path="/rps" element={<RockPaperScissors />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </GameProviders>
    </HederaWalletProvider>
  </QueryClientProvider>
);

export default App;

