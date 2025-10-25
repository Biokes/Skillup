import { GameContext } from "@/hooks/useGameContext";
import { ReactNode } from "react";


export default function GameProviders({ children }: { children: ReactNode }) {

    return (
        <GameContext.Provider value={{}} >
            {children}
        </GameContext.Provider>
    )
}