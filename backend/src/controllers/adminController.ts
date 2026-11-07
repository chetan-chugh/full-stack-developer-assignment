import { Request, Response } from 'express';
import UsageLog from '../models/LogModel';
import User from '../models/UserModel';
import { logActivity } from '../services/logServices';

const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, message });

// GET /api/admin/users
export const listUsers = async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });
  return res.json({ success: true, message: 'Users fetched successfully', data: { users } });
};

// PATCH /api/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  const { name, role, isActive } = req.body;
  const changes: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return fail(res, 400, 'Name must be at least 2 characters');
    }
    changes.name = name.trim();
  }
  if (role !== undefined) {
    if (role !== 'user' && role !== 'admin') return fail(res, 400, 'Role must be user or admin');
    changes.role = role;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== 'boolean') return fail(res, 400, 'isActive must be true or false');
    changes.isActive = isActive;
  }

  // Admins cannot lock themselves out
  if (req.params.id === req.user!.id && (role === 'user' || isActive === false)) {
    return fail(res, 400, 'You cannot demote or deactivate your own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, changes, { new: true });
  if (!user) return fail(res, 404, 'User not found');

  await logActivity(req, 'admin_update_user', `User ${req.params.id}: ${JSON.stringify(changes)}`);
  return res.json({ success: true, message: 'User updated successfully', data: { user } });
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  if (req.params.id === req.user!.id) return fail(res, 400, 'You cannot delete your own account');

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return fail(res, 404, 'User not found');

  await logActivity(req, 'admin_delete_user', `User ${req.params.id}`);
  return res.json({ success: true, message: 'User deleted successfully', data: null });
};

// GET /api/admin/logs?page=1&limit=15
export const listLogs = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 15, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const logs = await UsageLog.find()
    .populate('user', 'email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await UsageLog.countDocuments();

  return res.json({
    success: true,
    message: 'Logs fetched successfully',
    data: { logs, total, page, pages: Math.ceil(total / limit) }
  });
};