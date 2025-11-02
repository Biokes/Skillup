import mongoose, { Connection} from "mongoose";
import dotenv from 'dotenv';
import { ChainSkillsException } from "../exceptions/index.js";
dotenv.config();

export class DatabaseConnection {
    private  connection!:Connection;
    
  async connect() {
    const MONGODB_URI =  process.env.MONGODB_URI || "mongodb://localhost:27017/chain-skill-games";
    try {
      await mongoose.connect(MONGODB_URI);

      this.connection = mongoose.connection;

      console.log("✓ Connected to MongoDB");
      this.setupEventHandlers();
    } catch (error:unknown) {
        throw new ChainSkillsException(error instanceof Error ? error.message : String(error));
    }
  }

  setupEventHandlers() {
    this.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    this.connection.on("error", (error) => {
      console.error("MongoDB error:", error);
    });

    this.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed");
    }
  }

  getConnection() {
    return this.connection;
  }
}
