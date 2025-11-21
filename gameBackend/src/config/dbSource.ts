import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Player } from "../data/models/Player";
import { Stats } from "../data/models/Stats"; 
import { Session } from "../data/models/Session";
import { Game } from "../data/models/Game";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

export const DataBaseSource: DataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_DATABASE as string,
  synchronize: true,
  entities:[Player,Stats, Session, Game],
  logging: false,
});
