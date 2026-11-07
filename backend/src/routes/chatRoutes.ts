import { Router } from "express";
import { sendMessage } from "../controllers/chatController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Send a message to the chatbot (login required)
router.post("/", authenticate, sendMessage);

export default router;
