import { Router } from "express";
import {
  adminLogin,
  changePassword,
  deleteAccount,
  login,
  me,
  register,
  updateProfile,
} from '../controllers/authController';
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

// Change the logged-in user's password
router.patch('/password', authenticate, changePassword);

router.delete('/me', authenticate, deleteAccount);
export default router;
