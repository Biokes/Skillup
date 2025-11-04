import { Document } from "mongoose";

export class GameRepository<T extends Document> { 
    protected readonly gameType: T;
    constructor(gameType: T) {
        this.gameType = gameType
    }
}