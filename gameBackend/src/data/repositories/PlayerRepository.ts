import { DataBaseSource } from "../../config/dbSource";
import { Player } from "../models/Player";
import BaseRepository from "./base";
import { Repository } from "typeorm";

export default class PlayerRepository extends BaseRepository<Player> {
  constructor() {
    const PlayerRepo: Repository<Player> = DataBaseSource.getRepository(Player);
    super(PlayerRepo);
  }
}
