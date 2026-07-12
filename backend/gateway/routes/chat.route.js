import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = express.Router();

router.use(
    "/",
    createProxyMiddleware({
        target: process.env.CHAT_SERVICE,
        changeOrigin: true,
    })
);

export default router;