import { toast } from "@/components/ui/sonner";
import { OneChainGameContext } from "@/hooks/useOneChainGameContext";
import { socketService } from "@/services/socketService";
import { ReactNode, useCallback, useEffect, useState } from "react";

export default function OneChainGameProviders({ children }: { children: ReactNode }) { 
    const [errorMessage, setErrorMessage] = useState<string>('')
    useEffect(() => { 
        if (errorMessage.length>0) {
            toast.error(errorMessage)
         }
    }, [errorMessage])

    const quickMatch = useCallback((walletAddress: string) => {
        socketService.quickMatch(walletAddress,'pingpong',false, 0);
    }, []);
    
    return (
        <OneChainGameContext.Provider value={{
            errorMessage,
            setErrorMessage,
            quickMatch
        }}>
            { children}
        </OneChainGameContext.Provider>
    )
}   