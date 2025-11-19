import { createContext, useContext } from "react";
import { OneChainGameType } from "@/types"

export const OneChainGameContext = createContext<OneChainGameType | undefined>(undefined)
export const useOneChainGame = () => { 
    const context = useContext(OneChainGameContext);
    if (!context) {
    throw new Error('useGame must be used within OneChainGameProvider');
  }
  return context;
}
