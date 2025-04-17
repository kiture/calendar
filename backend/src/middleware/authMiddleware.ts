import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Define a more specific structure for the user payload within the token
interface AppUserPayload extends JwtPayload {
  userId: string;
  roleId: string;
  roleName: string;
}

// Update AuthRequest to use the specific payload type
interface AuthRequest extends Request {
  user?: AppUserPayload;
}

const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    // If no token is present, return 401 Unauthorized
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    // Use a generic error message for security
    return res
      .status(500)
      .json({ message: 'Internal server configuration error' });
  }

  // Verify the token
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // If token is invalid (e.g., expired, wrong signature), return 403 Forbidden
      console.error('JWT Verification Error:', err.message);
      // Provide a generic error message or specific based on the error type if needed
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // If token is valid, attach the decoded payload to the request object
    req.user = decoded as AppUserPayload;

    // Proceed to the next middleware or route handler
    next();
  });
};

// Export the interface along with the middleware if needed elsewhere
export { AuthRequest, AppUserPayload };
export default authenticateToken;
