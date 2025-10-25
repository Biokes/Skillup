import { GameContextType } from '@/types/game';
import { createContext, useContext } from 'react';


export const GameContext = createContext<GameContextType | undefined>(undefined);
export const useGame = () => useContext(GameContext);
