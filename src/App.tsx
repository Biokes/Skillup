import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GameHub from "./pages/GameHub";
import { CheckersBoard } from "./components/checkers/CheckersBoard";
import { AirHockeyGame } from "./components/airhockey/AirHockeyGame";
import { PingPongGame } from "./components/pingpong/PingPongGame";
import { PoolGame } from "./components/pool/PoolGame";
import { RockPaperScissors } from "./components/rps/RockPaperScissors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/hub" element={<GameHub />} />
          <Route path="/checkers" element={<CheckersBoard/>} />
          <Route path="/chess" element={<CheckersBoard/>} />
          <Route path="/airHockey" element={<AirHockeyGame/>} />
          <Route path="/pingpong" element={<PingPongGame/>} />
          <Route path="/pool" element={<PoolGame/>} />
          <Route path="/checkers" element={<RockPaperScissors/>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
