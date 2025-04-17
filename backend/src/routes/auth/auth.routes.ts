import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../../db/database'; // Adjusted path: ../db/database -> ../../db/database
import bcrypt from 'bcrypt'; // Needed for password comparison
import jwt from 'jsonwebtoken'; // Needed for JWT generation
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const router = express.Router();

// --- Validation Middleware ---
const validateLogin = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /auth/login
router.post(
  '/login',
  validateLogin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body; // Matches LoginCommand structure

    try {
      // 1. Find user by email and get role name
      const userResult = await query(
        'SELECT u.user_id, u.email, u.login, u.password_hash, u.first_name, u.last_name, u.role_id, r.role_name ' +
          'FROM users u JOIN roles r ON u.role_id = r.role_id ' +
          'WHERE u.email = $1',
        [email]
      );

      console.log(email);

      if (userResult.rows.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' }); // User not found
        return;
      }

      const user = userResult.rows[0];

      // 2. Compare password
      const isPasswordMatch = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordMatch) {
        res.status(401).json({ message: 'Invalid email or password' }); // Password doesn't match
        return;
      }

      // 3. Generate JWT
      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';

      if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in environment variables.');
        throw new Error('Server configuration error'); // Throw generic error
      }

      // Include roleName in the payload
      const payload = {
        userId: user.user_id,
        roleId: user.role_id,
        roleName: user.role_name,
      };

      // Explicitly cast the options object
      const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: jwtExpiresIn,
      } as jwt.SignOptions);

      const userDto = {
        user_id: user.user_id,
        email: user.email,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        role_name: user.role_name,
      };

      const loginResponse = {
        accessToken: accessToken,
        user: userDto,
      }; // Matches LoginResponseDto structure

      res.status(200).json(loginResponse);
    } catch (error: unknown) {
      console.error('Login error:', error); // Log the actual error
      // Ensure generic message for 500 errors
      if (!res.headersSent) {
        // Check if response hasn't been sent already
        next(new Error('An internal server error occurred during login')); // Use generic message
      }
    }
  }
);

export default router;
