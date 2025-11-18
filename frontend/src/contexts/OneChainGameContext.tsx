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

    const retryQuickMatch = useCallback((walletAddress: string) => { 
        socketService.retryQuickMatch(walletAddress,'pingpong',false, 0);
    }, [])

    const cancelQuickMatch = useCallback((walletAddress: string) => { 
        socketService.cancelMatch(walletAddress);
    }, [])
    
    return (
        <OneChainGameContext.Provider value={{
            errorMessage,
            setErrorMessage,
            quickMatch,
            retryQuickMatch,
            cancelQuickMatch
        }}>
            { children}
        </OneChainGameContext.Provider>
    )
}   