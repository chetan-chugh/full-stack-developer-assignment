import { Router } from "express";
import { adminLogin, login, me, register, updateProfile, deleteAccount } from '../controllers/authController';
import { authenticate } from "../middleware/auth";

const router = Router();

// Register a new user
router.post("/register", register);

// Login
router.post("/login", login);
// Admin login (separate from the regular login)
router.post('/admin/login', adminLogin);

// Get the logged-in user
router.get("/me", authenticate, me);

// Update the logged-in user's name
router.patch('/me', authenticate, updateProfile);

router.delete('/me', authenticate, deleteAccount);
export default router;

