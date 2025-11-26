import { DataBaseSource } from "@/src/config/dbSource";
import BaseRepository from "./base";
import { Transaction } from "../models/Transaction";

export class TransactionRepository extends BaseRepository<Transaction> {
    constructor() { 
        super(DataBaseSource.getRepository(Transaction));
    }
 }