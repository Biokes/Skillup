import { z } from "zod";

const quickMatchSchema = z.object({
    walletAddress: z.string().min(20).max(42),
    gameType: z.string().min(3).max(8),
    isStaked: z.boolean(),
    amount: z.number().min(0)
})
export type QuickMatchDTO = z.infer<typeof quickMatchSchema>