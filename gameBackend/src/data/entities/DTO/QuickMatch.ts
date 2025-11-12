import { z } from "zod";

const quickMatchSchema = z.object({
    walletAddress: z.string().min(20).max(42)
})
export type QuickMatchDTO = z.infer<typeof quickMatchSchema>