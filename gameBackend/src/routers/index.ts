import express, { Router } from "express"


export const Routes:Router = express.Router()

Routes.get("/", (req, res) => {
    res.json({
        message: "Server was pinged successfully",
        status: "ok",
        timestamp: new Date(),
        path: req.url
    });
});

// Routes.use("/",routeToUse)