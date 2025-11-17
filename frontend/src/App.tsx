import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/landingPage";
import GameProviders from "./contexts/GameContext";
import Pong from "./pages/pong"
import OneChainProviders from "./contexts/OneChainProvider";
import OneChainGameProviders from "./contexts/OneChainGameContext";

const App = () => (
  <OneChainProviders>
    <OneChainGameProviders>
      <GameProviders>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Index />} />
              <Route path="*" element={<NotFound />} />
              <Route path='/pong' element={<Pong />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </GameProviders>
    </OneChainGameProviders>
  </OneChainProviders>
 
);

export default App;