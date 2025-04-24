import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../../db/database';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// --- Controller Implementation ---
const userController = {
  createUser: async (req: Request, res: Response): Promise<void> => {
    const { email, login, password, first_name, last_name } = req.body;

    try {
      // 1. Get the standard role ID
      const roleResult = await query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        ['standard']
      );
      if (!roleResult || roleResult.rowCount === 0) {
        console.error('Standard role not found in the database');
        res
          .status(500)
          .json({ message: 'Failed to create user: role configuration error' });
        return;
      }
      const role_id = roleResult.rows[0].role_id;

      // 2. Check if email already exists
      const existingUser = await query('SELECT 1 FROM users WHERE email = $1', [
        email,
      ]);
      if (
        existingUser &&
        existingUser.rowCount != null &&
        existingUser.rowCount > 0
      ) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      // 3. Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Insert the new user
      const insertQuery = `
        INSERT INTO users (email, login, password_hash, first_name, last_name, role_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, email, login, first_name, last_name, role_id, created_at, updated_at
      `;
      const values = [
        email,
        login,
        passwordHash,
        first_name,
        last_name,
        role_id,
      ];
      const result = await query(insertQuery, values);

      // 5. Return the created user data
      if (result && result.rows && result.rows.length > 0) {
        res.status(201).json(result.rows[0]);
      } else {
        console.error('User creation failed despite no error thrown');
        res.status(500).json({ message: 'Failed to create user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  updateUser: async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = req.user?.userId; // Get the current user's ID from the auth middleware
    const updates = req.body;

    // Prevent password updates via this endpoint for security
    if (updates.password) {
      res
        .status(400)
        .json({
          message: 'Password updates are not allowed via this endpoint.',
        });
      return;
    }

    try {
      // 1. Check if user exists
      const userCheck = await query(
        'SELECT email FROM users WHERE user_id = $1',
        [userId]
      );
      if (!userCheck || userCheck.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const currentUserEmail = userCheck.rows[0].email;

      // 2. If email is being updated, check for conflicts
      if (updates.email && updates.email !== currentUserEmail) {
        const emailCheck = await query(
          'SELECT 1 FROM users WHERE email = $1 AND user_id != $2',
          [updates.email, userId]
        );
        if (
          emailCheck &&
          emailCheck.rowCount != null &&
          emailCheck.rowCount > 0
        ) {
          res
            .status(409)
            .json({ message: 'Email already in use by another user' });
          return;
        }
      }

      // 3. Construct dynamic UPDATE query
      const fields = Object.keys(updates).filter((key) =>
        ['email', 'login', 'first_name', 'last_name'].includes(key)
      );
      if (fields.length === 0) {
        res
          .status(400)
          .json({ message: 'No valid fields provided for update' });
        return;
      }

      // Add updated_at manually
      fields.push('updated_at');
      updates.updated_at = new Date();

      const setClauses = fields
        .map((field, index) => `"${field}" = $${index + 1}`)
        .join(', ');
      const values = fields.map((field) => updates[field]);

      const updateQuery = `
        UPDATE users
        SET ${setClauses}
        WHERE user_id = $${fields.length + 1}
        RETURNING user_id, email, login, first_name, last_name, role_id, created_at, updated_at
      `;

      // 4. Execute update
      const result = await query(updateQuery, [...values, userId]);

      if (!result || result.rowCount === 0) {
        res.status(404).json({ message: 'User not found during update' });
        return;
      }

      // 5. Return updated user
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
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
const validateCreateUser = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('login').notEmpty().withMessage('Login is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
];

const validateUpdateUser = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('login').optional().notEmpty().withMessage('Login cannot be empty'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
];

const router = express.Router();

// --- User Routes ---
router.post(
  '/',
  validateCreateUser,
  handleValidationErrors as RequestHandler,
  userController.createUser
);
router.put(
  '/me',
  validateUpdateUser,
  handleValidationErrors as RequestHandler,
  userController.updateUser
);

export default router;
