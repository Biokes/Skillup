import { DataBaseSource } from "../../config/dbSource";
import { Session } from "../models/Session";
import BaseRepository from "./base";

export class SessionRepository extends BaseRepository<Session> { 
    constructor() { 
        super(DataBaseSource.getRepository(Session));
    }
}