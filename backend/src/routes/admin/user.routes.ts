import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import {
  param,
  query as queryValidator,
  validationResult,
} from 'express-validator';
import { query } from '../../db/database';

// --- Controller Implementation ---
const adminUserController = {
  listUsers: async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    try {
      const usersQuery = `
        SELECT user_id, email, login, first_name, last_name, role_id, created_at, updated_at
        FROM users
        ORDER BY email
        LIMIT $1 OFFSET $2
      `;
      const countQuery = 'SELECT COUNT(*) FROM users';

      const [usersResult, countResult] = await Promise.all([
        query(usersQuery, [limit, offset]),
        query(countQuery),
      ]);

      const totalCount = parseInt(countResult.rows[0].count, 10);

      res.status(200).json({
        users: usersResult.rows,
        total_count: totalCount,
      });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ message: 'Failed to retrieve users' });
    }
  },

  getUserById: async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
      const result = await query(
        'SELECT user_id, email, login, first_name, last_name, role_id, created_at, updated_at FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({ message: 'Failed to retrieve user' });
    }
  },

  deleteUser: async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
      const result = await query('DELETE FROM users WHERE user_id = $1', [
        userId,
      ]);

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  },
};

// --- Validation Error Handler Middleware ---
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- Validation Chains ---
const validateListUsers = [
  queryValidator('limit')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Limit must be a positive integer'),
  queryValidator('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be a non-negative integer'),
];

const validateUserId = [
  param('userId').isUUID().withMessage('Valid userId parameter is required'),
];

const router = express.Router();

// --- User Routes ---
router.get(
  '/',
  validateListUsers,
  handleValidationErrors as RequestHandler,
  adminUserController.listUsers
);
router.get(
  '/:userId',
  validateUserId,
  handleValidationErrors as RequestHandler,
  adminUserController.getUserById
);
router.delete(
  '/:userId',
  validateUserId,
  handleValidationErrors as RequestHandler,
  adminUserController.deleteUser
);

export default router;
