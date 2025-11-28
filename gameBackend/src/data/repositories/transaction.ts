import BaseRepository from "./base";
import { Transaction } from "../models/Transaction";
import { DataBaseSource } from "../../config/dbSource";

export class TransactionRepository extends BaseRepository<Transaction> {
    constructor() { 
        super(DataBaseSource.getRepository(Transaction));
    }
 }