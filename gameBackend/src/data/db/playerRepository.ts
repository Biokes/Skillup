import { DataBaseSource } from "@/src/config/dbSource";
import { Player } from "../entities/models/Player";
import BaseRepository from "./base";
import { Repository } from "typeorm";

export default class PlayerRepository extends BaseRepository<Player>{ 
    constructor() {
        const PlayerRepo: Repository<Player> = DataBaseSource.getRepository(Player);
        super(PlayerRepo);
    }
}