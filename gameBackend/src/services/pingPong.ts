import { IGame } from "../data/models/types.js";
import { BaseGameService } from "./BaseGame.js";

export class PingPongService extends BaseGameService {
    updateGameState(roomCode: string): Promise<IGame> {
        throw new Error("Method not implemented.");
    }
    checkGameOver(roomCode: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    pauseGame(roomCode: string, socketID: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    resumeGame(roomCode: string): Promise<void> {
        throw new Error("Method not implemented.");
    } 
    
}