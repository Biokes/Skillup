import { z } from "zod";

const CreateGameSchema = z.object({
    gameCode: z.string(),
     
});
export type CreateGameDTO = z.infer<typeof CreateGameSchema>;