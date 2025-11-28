import { z } from "zod";

const PaddleMovementSchema = z.object({
  playerNumber: z.number().min(1),
  position: z.number().min(0),
  gameId: z.string().min(1),
});
export type PaddleMovementDTO = z.infer<typeof PaddleMovementSchema>    