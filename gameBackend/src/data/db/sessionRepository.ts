import { DataBaseSource } from "@/src/config/dbSource";
import { Session } from "../entities/models/Session";
import BaseRepository from "./base";

export class SessionRepository extends BaseRepository<Session> { 
    constructor() { 
        super(DataBaseSource.getRepository(Session));
    }
}