import express, { Application } from 'express';
import dotenv from "dotenv";
import cors from "cors";
import { Routes } from './routers';
import { selfPing } from './utils';
import { DataBaseSource } from './config/dbSource';
import { WebSocket } from './websocket';

dotenv.config()
const PORT = process.env.PORT!;
const app: Application = express();
app.use(express.json())

app.use(cors({
    origin: [process.env.FRONTEND_URL!],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use('/api/v1/', Routes)

async function startServer() { 
    try { 
        await DataBaseSource.initialize();
        console.log("db connected")
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
            setInterval(async () => { await selfPing()},50_000*6)
        });
        const webSocket = new WebSocket(app);
        const webSocketServer = webSocket.getSocketServerSetup()
        webSocketServer.on('connection', (socket) => webSocket.handleConnection(socket) )
    } catch (error) {
        console.error("Database conection failed.\n error message: " + (error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
} 

startServer()