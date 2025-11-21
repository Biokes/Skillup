import { z } from "zod";

const joinRoomSchema = z.object({
  gameCode: z.string().length(6),
  walletAddress: z.string().min(20).max(42)
})

export type JoinRoomDTO = z.infer<typeof joinRoomSchema>