import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import adminRoutes from './routes/adminRoutes';

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = Number(process.env.PORT) || 4000;

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`App is listening at ${PORT}`);
});

connectDB();
