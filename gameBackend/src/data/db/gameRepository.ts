import { Repository } from 'typeorm';
import { DataBaseSource } from '../../config/dbSource';
import { Game } from "../entities/models/Game";
import BaseRepository from "./base";

export class GameRepository extends BaseRepository<Game> {
  constructor() {
    const GameRepo: Repository<Game> = DataBaseSource.getRepository(Game);
    super(GameRepo);
  }
}
