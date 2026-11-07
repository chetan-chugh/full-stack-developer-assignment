import { Request, Response } from "express";
import { getReply } from "../services/chatbotService";
import { logActivity } from "../services/logServices";

// POST /api/chat
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // Validation
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message must be 500 characters or fewer",
      });
    }

    const cleanMessage = message.trim();

    await logActivity(req, "chat_message", cleanMessage.slice(0, 200));

    return res.status(200).json({
      success: true,
      message: "Reply generated successfully",
      data: { reply: getReply(cleanMessage) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process message",
    });
  }
};
