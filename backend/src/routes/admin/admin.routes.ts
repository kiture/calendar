import { Router, RequestHandler } from 'express';
import authenticateToken from '../../middleware/authMiddleware.js';
import { AuthRequest } from '../../middleware/authMiddleware.js';
import userRoutes from './user.routes.js';
import groupRoutes from './group.routes.js';
import roleRoutes from './role.routes.js';

const router = Router();

// Use authentication middleware for all admin routes
router.use(authenticateToken as RequestHandler);

// Check if user is admin
const adminCheck: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.role_id !== '1') {
    res
      .status(403)
      .json({ message: 'Access denied. Admin privileges required.' });
    return;
  }
  next();
};

router.use(adminCheck);

// Mount sub-routes
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/roles', roleRoutes);

export default router;
