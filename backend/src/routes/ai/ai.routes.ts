import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
import authenticateToken, {
  AuthRequest,
} from '../../middleware/authMiddleware';

// --- Controller Implementation ---
const aiController = {
  // GET /ai/event-suggestions
  getSuggestions: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Basic check for authentication (middleware should handle this)
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    // Placeholder implementation: Returns an empty list
    // In a real implementation, this would call the Google AI SDK
    // using req.query.startDate, req.query.endDate, req.query.location, req.query.type
    console.log('AI Suggestions Request Query:', req.query);

    res.status(200).json({ suggestions: [] });
  },
};
// --- End Controller Implementation ---

// --- Validation Error Handler Middleware ---
const handleValidationErrors: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Explicitly return void after sending response
  }
  next();
};

const router = express.Router();

// --- Validation Chains ---
const validateGetSuggestions = [
  queryValidator('startDate')
    .isISO8601()
    .withMessage('Valid startDate (ISO8601 format) is required'),
  queryValidator('endDate')
    .isISO8601()
    .withMessage('Valid endDate (ISO8601 format) is required'),
  queryValidator('location')
    .notEmpty()
    .withMessage('Location query parameter is required'),
  queryValidator('type')
    .optional()
    .isString()
    .withMessage('Type must be a string'),
];

// --- AI Routes ---
// All routes require authentication
router.use(authenticateToken as RequestHandler);

// GET /ai/event-suggestions
router.get(
  '/event-suggestions',
  validateGetSuggestions,
  handleValidationErrors,
  aiController.getSuggestions
);

export default router;
