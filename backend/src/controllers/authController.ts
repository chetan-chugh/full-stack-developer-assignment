// backend/src/controllers/authController.ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../models/UserModel';
import { signToken } from '../middleware/auth';
import { logActivity } from '../services/logServices';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const errors: Record<string, string> = {};

    // Validation
    if (typeof name !== 'string' || !name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (typeof email !== 'string' || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'A valid email is required';
    }

    if (typeof password !== 'string' || !password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }

    if (typeof confirmPassword !== 'string' || !confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Password and confirm password do not match';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the errors', errors });
    }

    // Check if the email is already used
    const cleanEmail = email.trim().toLowerCase();
    const oldUser = await User.findOne({ email: cleanEmail });

    if (oldUser) {
      return res.status(409).json({
        success: false,
        message: 'Please fix the errors',
        errors: { email: 'Email is already registered' }
      });
    }

    // New users are always "user", the role is never taken from the request
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword
    });

    await logActivity(req, 'register', `New user ${cleanEmail}`, user._id);

    // Load the user again, because this version does not include the password
    const userData = await User.findById(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: { user: userData, token: signToken(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to register' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const errors: Record<string, string> = {};

    if (typeof email !== 'string' || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid email is required';
    }
    if (typeof password !== 'string' || !password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the errors', errors });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      await logActivity(req, 'login_failed', `Email ${cleanEmail}`, null);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
        errors: { email: 'No account found with this email. Please create an account.' }
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await logActivity(req, 'login_failed', `Email ${cleanEmail}`, user._id);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    await logActivity(req, 'login', null, user._id);

    const userData = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: userData, token: signToken(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
};

// POST /api/auth/admin/login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const errors: Record<string, string> = {};

    if (typeof email !== 'string' || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid email is required';
    }
    if (typeof password !== 'string' || !password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the errors', errors });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      await logActivity(req, 'admin_login_failed', `Email ${cleanEmail}`, null);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
        errors: { email: 'No account found with this email.' }
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await logActivity(req, 'admin_login_failed', `Email ${cleanEmail}`, user._id);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // The password is correct, but this user is not an admin
    if (user.role !== 'admin') {
      await logActivity(req, 'admin_login_denied', `Email ${cleanEmail}`, user._id);
      return res.status(403).json({ success: false, message: 'This account does not have admin access' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    await logActivity(req, 'admin_login', null, user._id);

    const userData = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: userData, token: signToken(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: { user: req.user }
  });
};

// PATCH /api/auth/me
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const errors: Record<string, string> = {};

    if (typeof name !== 'string' || !name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the errors', errors });
    }

    const user = await User.findByIdAndUpdate(req.user!._id, { name: name.trim() }, { new: true });

    await logActivity(req, 'update_profile');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// PATCH /api/auth/password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const errors: Record<string, string> = {};

    if (typeof currentPassword !== 'string' || !currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one letter and one number';
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from the current password';
    }

    if (typeof confirmPassword !== 'string' || !confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Password and confirm password do not match';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Please fix the errors', errors });
    }

    // The password is hidden by default, so ask for it here
    const user = await User.findById(req.user!._id).select('+password');

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: 'Please fix the errors',
        errors: { currentPassword: 'Current password is incorrect' }
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    await logActivity(req, 'change_password');

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

// DELETE /api/auth/me (the account is deactivated, not removed)
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    // An admin deleting their own account could lock everyone out of the admin panel
    if (req.user!.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be deleted here' });
    }

    await User.findByIdAndUpdate(req.user!._id, { isActive: false });

    await logActivity(req, 'delete_account');

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};