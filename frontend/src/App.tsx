import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/landingPage";
import GameProviders from "./contexts/GameContext";
import Pong from "./pages/pong"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

const App = () => (
  <GameProviders>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Index />} />
          <Route path="*" element={<NotFound />} />
          <Route path='/pong' element={<Pong/>} />
          {/* <Route path="/pingpong" element={<PingPongGame />} /> */}
          {/* <Route path="/hub" element={<GameHub />} /> */}
          {/* <Route path="/checkers" element={<CheckersBoard />} /> */}
          {/* <Route path="/chess" element={<ChessGame />} /> */}
          {/* 
              <Route path="/airHockey" element={<AirHockeyGame />} />
              <Route path="/pool" element={<PoolGame/>} />  
             <Route path="/rps" element={<RockPaperScissors />} /> */}
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </GameProviders>
);

export default App;

