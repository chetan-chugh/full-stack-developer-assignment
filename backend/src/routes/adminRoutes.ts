import { Router } from 'express';
import { deleteUser, listLogs, listUsers, updateUser } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Every admin route needs a logged-in admin
router.use(authenticate, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/logs', listLogs);

export default router;