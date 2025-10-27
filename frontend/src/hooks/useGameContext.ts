import { GameContextType } from '@/types/game';
import { createContext, useContext } from 'react';


export const GameContext = createContext<GameContextType | undefined>(undefined);
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};