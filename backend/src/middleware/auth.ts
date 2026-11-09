// backend/src/middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { HydratedDocument } from "mongoose";
import User, { IUser, Role } from "../models/UserModel";

// Read at call time, so dotenv has already loaded the value
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return secret;
}

// Creates a token when the user registers or logs in
export function signToken(user: HydratedDocument<IUser>): string {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, getSecret(), {
    expiresIn: "1h",
  });
}

// Checks the JWT token and attaches the logged-in user to req.user
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Token format: "Authorization: Bearer <token>"
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  // 1. Check the token. Only a bad or expired token is a 401.
  const secret = getSecret();
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  // 2. Load the user. Loaded fresh each time, so deactivation or role changes apply immediately.
  try {
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account not available" });
    }

    req.user = user;
    next();
  } catch (error) {
    // A database problem is not the user's fault, so do not log them out
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Allows only users with the given role, for example requireRole('admin')
export const requireRole = (role: Role) => (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ success: false, message: "You do not have permission to do this" });
  }
  next();
};