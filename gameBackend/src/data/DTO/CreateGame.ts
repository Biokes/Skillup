import { z } from "zod";

const CreateGameSchema = z.object({
    gameCode: z.string().length(6),
    walletAddress: z.string().min(20).max(42),
});

export type CreateGameDTO = z.infer<typeof CreateGameSchema>;