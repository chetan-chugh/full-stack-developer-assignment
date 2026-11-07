// backend/src/controllers/authController.ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../models/UserModel';
import { signToken } from '../middleware/auth';
import { logActivity } from '../services/logServices';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Record<string, string>;

// Sends all field errors at once, so the frontend can show each one under its input
const sendFieldErrors = (res: Response, errors: FieldErrors, status = 400) =>
  res.status(status).json({
    success: false,
    message: 'Please fix the highlighted fields',
    errors
  });

// Password rule shared by register and change password
const passwordRuleError = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

const validateRegistration = (body: Record<string, unknown>): FieldErrors => {
  const { name, email, password, confirmPassword } = body;
  const errors: FieldErrors = {};

  if (typeof name !== 'string' || !name.trim()) errors.name = 'Name is required';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

  if (typeof email !== 'string' || !email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'A valid email is required';

  if (typeof password !== 'string' || !password) errors.password = 'Password is required';
  else {
    const ruleError = passwordRuleError(password);
    if (ruleError) errors.password = ruleError;
  }

  if (typeof confirmPassword !== 'string' || !confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Password and confirm password do not match';
  }

  return errors;
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validateRegistration(req.body);
    if (Object.keys(errors).length > 0) return sendFieldErrors(res, errors);

    const { name, email, password } = req.body;

    // Duplicate check
    const cleanEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail })) {
      return sendFieldErrors(res, { email: 'Email is already registered' }, 409);
    }

    // Role is never taken from the request, so new users are always "user"
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: await bcrypt.hash(password, 12)
    });

    await logActivity(req, 'register', `New user ${cleanEmail}`, user._id);

    // Never send the password hash to the client
    const { password: _hash, ...safeUser } = user.toObject();

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: { user: safeUser, token: signToken(user) }
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return sendFieldErrors(res, { email: 'Email is already registered' }, 409);
    }

    return res.status(500).json({ success: false, message: 'Failed to register' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const errors: FieldErrors = {};
    if (typeof email !== 'string' || !email.trim()) errors.email = 'Email is required';
    if (typeof password !== 'string' || !password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) return sendFieldErrors(res, errors);

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // Same message for unknown email and wrong password (shown above the form)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logActivity(req, 'login_failed', `Email ${cleanEmail}`, user ? user._id : null);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    await logActivity(req, 'login', null, user._id);

    const { password: _hash, ...safeUser } = user.toObject();

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: safeUser, token: signToken(user) }
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

    if (typeof name !== 'string' || !name.trim()) {
      return sendFieldErrors(res, { name: 'Name is required' });
    }
    if (name.trim().length < 2) {
      return sendFieldErrors(res, { name: 'Name must be at least 2 characters' });
    }

    // authenticate has already confirmed req.user exists
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
    const errors: FieldErrors = {};

    if (typeof currentPassword !== 'string' || !currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const ruleError = passwordRuleError(newPassword);
      if (ruleError) errors.newPassword = ruleError;
      else if (newPassword === currentPassword) {
        errors.newPassword = 'New password must be different from the current password';
      }
    }

    if (typeof confirmPassword !== 'string' || !confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Password and confirm password do not match';
    }

    if (Object.keys(errors).length > 0) return sendFieldErrors(res, errors);

    // authenticate does not load the password hash, so fetch it here
    const user = await User.findById(req.user!._id).select('+password');
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return sendFieldErrors(res, { currentPassword: 'Current password is incorrect' });
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

// DELETE /api/auth/me  (soft delete: the record stays, the account is deactivated)
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    // An admin deleting themselves could lock everyone out of the admin panel
    if (req.user!.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts cannot be deleted here'
      });
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

// POST /api/auth/admin/login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const errors: FieldErrors = {};
    if (typeof email !== 'string' || !email.trim()) errors.email = 'Email is required';
    if (typeof password !== 'string' || !password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) return sendFieldErrors(res, errors);

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logActivity(req, 'admin_login_failed', `Email ${cleanEmail}`, user ? user._id : null);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Correct password, but not an admin
    if (user.role !== 'admin') {
      await logActivity(req, 'admin_login_denied', `Email ${cleanEmail}`, user._id);
      return res.status(403).json({ success: false, message: 'This account does not have admin access' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    await logActivity(req, 'admin_login', null, user._id);

    const { password: _hash, ...safeUser } = user.toObject();

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: safeUser, token: signToken(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
};