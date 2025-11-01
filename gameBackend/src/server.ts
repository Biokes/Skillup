import express, { Application } from 'express';
import dotenv from "dotenv"
import { selfPing } from './utils';
import { Routes } from './routers/index,';
import cors from "cors"

dotenv.config()
const PORT = process.env.PORT || 3000;
const app: Application = express();
app.use(express.json())

app.use('/api/v1/', Routes)
const corsOptions = {
    origin:
    //     [
    // 'http://localhost:5173', 
    // 'https://your-production-site.com'
    //     ]
   "*" ,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    setTimeout(async () => {
        await selfPing()
     },50000)
});

