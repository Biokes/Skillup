import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const DataBaseSource: DataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_DATABASE as string,
  synchronize: true,
  logging: true,
});
