import { GameRepository } from "../data/db/gameRepository";
import { Game } from "../data/entities/models/Game";
import { Session } from "../data/entities/models/Session";

export class GameService {
    private readonly gameRepository: GameRepository;
    constructor() { 
        this.gameRepository = new GameRepository();
    }
    async createGameForSession(session: Session): Promise<Game>{
        return  await this.gameRepository.create({ session })
    }
}