import express, { Request, Response, Application } from 'express';
import dotenv from "dotenv"


dotenv.config()
const PORT = process.env.PORT || 3000;
const app: Application = express();
app.use(express.json())

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Server is running and healthy.' });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    selfPing();
});
