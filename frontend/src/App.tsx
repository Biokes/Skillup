import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { HederaWalletProvider } from "@/contexts/HederaWalletContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// import GameHub from "./pages/GameHub";
// import { CheckersBoard } from "./components/checkers/CheckersBoard";
import LandingPage from "./pages/landingPage";
import GameProviders from "./contexts/GameContext";
// import ClientProviders from "./contexts/clientProviders";



const App = () => (
  // <ClientProviders>
    <GameProviders>
      <TooltipProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
            <Route path="/home" element={<Index />} />
            <Route path="*" element={<NotFound />}/>
            {/* <Route path="/hub" element={<GameHub />} /> */}
            {/* <Route path="/checkers" element={<CheckersBoard />} /> */}
            {/* <Route path="/chess" element={<ChessGame />} /> */}
            {/* 
              <Route path="/airHockey" element={<AirHockeyGame />} />
              <Route path="/pingpong" element={<PingPongGame />} />
              {/* <Route path="/pool" element={<PoolGame/>} />  */}
            {/* <Route path="/rps" element={<RockPaperScissors />} /> */}
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </GameProviders>
  // </ClientProviders>

);

export default App;

