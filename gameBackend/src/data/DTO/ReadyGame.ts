import z from "zod";

const ReadyGameSchema = z.object({
    gameId: z.string().min(5),
    playerNumber: z.number().min(0),
    sessionId: z.string().min(5)
})
export type ReadyGameDTO = z.infer<typeof ReadyGameSchema>