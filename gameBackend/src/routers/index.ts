import express, { Router } from "express";

const router: Router = express.Router();

// Add your routes here
router.get('/health', (req, res) => {
    res.json({ message: 'Server is healthy!' });
});

export default router;
