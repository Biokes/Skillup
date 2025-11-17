import { OneChainGameContext } from "@/hooks/useOneChainGameContext";
import { ReactNode, useState } from "react";

export default function OneChainGameProviders({ children }: { children: ReactNode }) { 
    const [errorMessage] = useState<string>('')
    return (
        <OneChainGameContext.Provider value={{
            errorMessage,
            setErrorMessage
        }}>
            { children}
        </OneChainGameContext.Provider>
    )
}