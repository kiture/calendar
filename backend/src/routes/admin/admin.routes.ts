import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import authenticateToken from '../../middleware/authMiddleware';
// Import the specific request type if needed, or rely on casting if preferred
import { AuthRequest } from '../../middleware/authMiddleware'; 
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import roleRoutes from './role.routes';

// --- Role Check Middleware Implementation ---
const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
  // Cast req to AuthRequest to access the user payload safely
  const authReq = req as AuthRequest;

  // Check if user payload exists and has the roleName property
  if (authReq.user && authReq.user.roleName) {
    if (authReq.user.roleName === 'admin') {
      next(); // User is admin, proceed
    } else {
      // User is authenticated but not an admin
      res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
  } else {
    // This case should ideally not happen if authenticateToken runs first and succeeds
    // but it's good defensive programming.
    console.error('User payload or roleName missing in checkAdminRole after authentication.');
    res.status(401).json({ message: 'Authentication data incomplete or invalid' });
  }
};
// --- End Role Check Middleware ---

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken as RequestHandler);
// Apply admin role check to all admin routes
router.use(checkAdminRole as RequestHandler); // Use the implemented middleware

// Mount resource-specific routers
router.use('/users', userRoutes);
router.use('/groups', groupRoutes); // group.routes.ts handles /:groupId and /:groupId/members internally
router.use('/roles', roleRoutes);

export default router;