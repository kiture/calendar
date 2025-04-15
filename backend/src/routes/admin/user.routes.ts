import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../../db/database'; // Import database query function

// --- Controller Implementation ---
const adminUserController = {
    createUser: async (req: Request, res: Response): Promise<void> => {
        // Validation errors are handled by handleValidationErrors middleware
        const { email, login, password, role_id, first_name, last_name } = req.body;

        try {
            // 1. Check if email already exists
            const existingUser = await query('SELECT 1 FROM users WHERE email = $1', [email]);
            if (existingUser && existingUser.rowCount != null && existingUser.rowCount > 0) {
                res.status(409).json({ message: 'Email already in use' });
                return;
            }

            // 2. Check if role_id exists
            const roleExists = await query('SELECT 1 FROM roles WHERE role_id = $1', [role_id]);
            if (!roleExists || roleExists.rowCount == null || roleExists.rowCount === 0) {
                res.status(400).json({ message: 'Invalid role_id provided' });
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
            const values = [email, login, passwordHash, first_name, last_name, role_id];
            const result = await query(insertQuery, values);

            // 5. Return the created user data (UserDto format)
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
    listUsers: async (req: Request, res: Response): Promise<void> => {
        // Validation handles parsing limit/offset
        const limit = parseInt(req.query.limit as string || '20', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);

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
                query(countQuery)
            ]);

            const totalCount = parseInt(countResult.rows[0].count, 10);

            res.status(200).json({
                users: usersResult.rows,
                total_count: totalCount
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
    updateUser: async (req: Request, res: Response): Promise<void> => {
        const { userId } = req.params;
        const updates = req.body; // Contains fields to update: email, login, first_name, last_name, role_id

        // Prevent password updates via this endpoint for security
        if (updates.password) {
            res.status(400).json({ message: 'Password updates are not allowed via this endpoint.' });
            return;
        }

        try {
            // 1. Check if user exists
            const userCheck = await query('SELECT email FROM users WHERE user_id = $1', [userId]);
            if (!userCheck || userCheck.rowCount === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            const currentUserEmail = userCheck.rows[0].email;

            // 2. If email is being updated, check for conflicts
            if (updates.email && updates.email !== currentUserEmail) {
                const emailCheck = await query('SELECT 1 FROM users WHERE email = $1 AND user_id != $2', [updates.email, userId]);
                if (emailCheck && emailCheck.rowCount != null && emailCheck.rowCount > 0) {
                    res.status(409).json({ message: 'Email already in use by another user' });
                    return;
                }
            }

            // 3. If role_id is being updated, check if it exists
            if (updates.role_id) {
                 const roleExists = await query('SELECT 1 FROM roles WHERE role_id = $1', [updates.role_id]);
                 if (!roleExists || roleExists.rowCount == null || roleExists.rowCount === 0) {
                    res.status(400).json({ message: 'Invalid role_id provided' });
                    return;
                }
            }

            // 4. Construct dynamic UPDATE query
            const fields = Object.keys(updates).filter(key => ['email', 'login', 'first_name', 'last_name', 'role_id'].includes(key));
            if (fields.length === 0) {
                res.status(400).json({ message: 'No valid fields provided for update' });
                return;
            }

            // Add updated_at manually as the trigger won't fire if only updated_at changes
            fields.push('updated_at'); 
            updates.updated_at = new Date();

            const setClauses = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
            const values = fields.map(field => updates[field]);

            const updateQuery = `
                UPDATE users
                SET ${setClauses}
                WHERE user_id = $${fields.length + 1}
                RETURNING user_id, email, login, first_name, last_name, role_id, created_at, updated_at
            `;

            // 5. Execute update
            const result = await query(updateQuery, [...values, userId]);

            if (!result || result.rowCount === 0) {
                 // Should not happen if initial check passed, but good practice
                 res.status(404).json({ message: 'User not found during update' });
                 return;
            }

            // 6. Return updated user
            res.status(200).json(result.rows[0]);

        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Failed to update user' });
        }
    },
    deleteUser: async (req: Request, res: Response): Promise<void> => {
        const { userId } = req.params;
        try {
            const result = await query('DELETE FROM users WHERE user_id = $1', [userId]);

            if (result.rowCount === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(204).send(); // Send 204 No Content on successful deletion
        } catch (error) {
            console.error('Error deleting user:', error);
            // Handle potential foreign key constraint errors if needed, though ON DELETE should handle it
            res.status(500).json({ message: 'Failed to delete user' });
        }
    },
};
// --- End Controller Implementation ---

// --- Validation Error Handler Middleware ---
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const router = express.Router();

// --- Validation Chains ---
const validateCreateUser = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('login').notEmpty().withMessage('Login is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role_id').isUUID().withMessage('Valid role_id is required'),
];
const validateListUsers = [
    queryValidator('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt().withMessage('Offset must be a non-negative integer'),
];
const validateUserId = [
    param('userId').isUUID().withMessage('Valid userId parameter is required'),
];
const validateUpdateUser = [
    param('userId').isUUID().withMessage('Valid userId parameter is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('login').optional().notEmpty().withMessage('Login cannot be empty'),
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('role_id').optional().isUUID().withMessage('Valid role_id is required'),
];

// --- User Routes ---
router.post('/', validateCreateUser, handleValidationErrors as RequestHandler, adminUserController.createUser);
router.get('/', validateListUsers, handleValidationErrors as RequestHandler, adminUserController.listUsers);
router.get('/:userId', validateUserId, handleValidationErrors as RequestHandler, adminUserController.getUserById);
router.put('/:userId', validateUpdateUser, handleValidationErrors as RequestHandler, adminUserController.updateUser);
router.delete('/:userId', validateUserId, handleValidationErrors as RequestHandler, adminUserController.deleteUser);

export default router; 