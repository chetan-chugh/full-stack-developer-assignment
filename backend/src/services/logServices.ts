// backend/src/services/logService.ts
import { Request } from "express";
import UsageLog from "../models/LogModel";

// Saves one usage log entry (who did what, and from which IP)
export async function logActivity(
  req: Request,
  action: string,
  details?: string | null,
  userId?: unknown,
): Promise<void> {
  try {
    await UsageLog.create({
      user: userId ?? req.user?._id,
      action,
      details,
      ipAddress: req.ip,
    });
  } catch (error) {
    // A logging failure must never break the real request
    console.error("Failed to write usage log:", (error as Error).message);
  }
}
