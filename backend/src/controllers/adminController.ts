// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import UsageLog from '../models/LogModel';
import User from '../models/UserModel';
import { logActivity } from '../services/logServices';

// GET /api/admin/users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: { users }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PATCH /api/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, role, isActive } = req.body;

    // Validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    if (role !== undefined && role !== 'user' && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Role must be user or admin' });
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false' });
    }

    // An admin cannot demote or deactivate their own account
    const isOwnAccount = req.params.id === req.user!.id;
    if (isOwnAccount && (role === 'user' || isActive === false)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote or deactivate your own account'
      });
    }

    // Only the fields that were sent are updated
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logActivity(req, 'admin_update_user', `User ${req.params.id}: ${JSON.stringify(updates)}`);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    // An admin cannot delete their own account
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logActivity(req, 'admin_delete_user', `User ${req.params.id}`);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: null
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
};

// GET /api/admin/logs?page=1&limit=15
export const listLogs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const logs = await UsageLog.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await UsageLog.countDocuments();

    return res.status(200).json({
      success: true,
      message: 'Logs fetched successfully',
      data: { logs, total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};