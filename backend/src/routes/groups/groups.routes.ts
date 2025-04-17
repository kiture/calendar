import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import {
  body,
  param,
  query as queryValidator,
  validationResult,
} from 'express-validator';
import authenticateToken, {
  AuthRequest,
} from '../../middleware/authMiddleware';
import pool from '../../db/database'; // Import pool for direct client usage for transactions/RLS setting

// --- Controller Implementation ---
const groupController = {
  listUserGroups: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Keep RLS setting for consistency, though JOIN is the primary filter here
      const setLocalCommand = `SET LOCAL "myapp.user_id" = '${userId}'`;
      await client.query(setLocalCommand);

      // Updated query to join with memberships and filter by userId
      const groupsQuery = `
                SELECT g.group_id, g.group_name, g.created_at, g.updated_at
                FROM groups g
                JOIN group_memberships gm ON g.group_id = gm.group_id
                WHERE gm.user_id = $1
                ORDER BY g.group_name
            `;
      // Pass userId as a parameter
      const groupsResult = await client.query(groupsQuery, [userId]);

      await client.query('COMMIT');

      res.status(200).json(groupsResult.rows);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      next(error);
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  createEvent: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { groupId } = req.params;
    const {
      title,
      start_time,
      place,
      description,
      is_ai_suggestion = false,
    } = req.body;

    if (!req.user) {
      return next(new Error('Authentication required'));
    }
    const userId = req.user.userId; // Creator is the authenticated user
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      // Set RLS context using escapeLiteral, not parameter placeholder
      const setLocalCommand = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalCommand);

      // RLS policy on INSERT into events will implicitly check group membership
      const insertQuery = `
                INSERT INTO events (group_id, creator_user_id, title, start_time, place, description, is_ai_suggestion)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING event_id, group_id, creator_user_id, title, start_time, place, description, is_ai_suggestion, created_at, updated_at
            `;
      const values = [
        groupId,
        userId,
        title,
        start_time,
        place,
        description,
        is_ai_suggestion,
      ];

      const result = await client.query(insertQuery, values);

      await client.query('COMMIT');

      if (result.rows.length > 0) {
        res.status(201).json(result.rows[0]); // Return the created event
      } else {
        throw new Error('Event creation failed unexpectedly.');
      }
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      // Handle potential RLS violation error (e.g., PostgreSQL error code 44000 - check_violation)
      // Or just pass the generic error
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === '23503' || error.code === '44000')
      ) {
        // foreign_key_violation or check_violation
        next(
          new Error(
            'Failed to create event: User might not be a member of the group or group does not exist.'
          )
        );
      } else {
        next(error);
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  listGroupEvents: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    if (!req.user) {
      return next(new Error('Authentication required'));
    }
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(
        `SET LOCAL myapp.user_id = ${client.escapeLiteral(userId)}`
      );

      // Base queries
      let eventsQuery = `
                SELECT event_id, group_id, creator_user_id, title, start_time, place, description, is_ai_suggestion, created_at, updated_at
                FROM events
                WHERE group_id = $1
            `;
      // Declare queryParams before potential usage
      const queryParams: (
        | string
        | number
        | boolean
        | Date
        | null
        | undefined
      )[] = [groupId];

      // Add date filtering
      let paramIndex = 2; // Start parameters from $2
      if (startDate) {
        eventsQuery += ` AND start_time >= $${paramIndex}`;
        queryParams.push(startDate as string);
        paramIndex++;
      }
      if (endDate) {
        eventsQuery += ` AND start_time <= $${paramIndex}`;
        queryParams.push(endDate as string);
        paramIndex++;
      }

      // Add ordering
      eventsQuery += ` ORDER BY start_time`;

      // Execute query
      // Move queryParams declaration before if blocks
      // const queryParams: (string | number | boolean | Date | null | undefined)[] = [groupId];
      const eventsResult = await client.query(eventsQuery, queryParams);

      await client.query('COMMIT');

      res.status(200).json(eventsResult.rows);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      next(error); // Let central error handler manage response
    } finally {
      if (client) {
        client.release();
      }
    }
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
const validateGroupId = [
  param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
];

const validateCreateEvent = [
  ...validateGroupId,
  body('title').notEmpty().withMessage('Event title is required'),
  body('start_time')
    .isISO8601()
    .withMessage('Valid start_time (ISO8601 format) is required'),
  body('place').optional().isString(),
  body('description').optional().isString(),
  body('is_ai_suggestion').optional().isBoolean(),
];

const validateListEvents = [
  ...validateGroupId,
  queryValidator('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid startDate format (ISO8601)'),
  queryValidator('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid endDate format (ISO8601)'),
];

// --- Group Routes ---
// All routes in this file require authentication
router.use(authenticateToken as RequestHandler);

// GET /api/groups - List groups for the authenticated user
router.get('/', handleValidationErrors, groupController.listUserGroups);

// POST /api/groups/:groupId/events - Create an event in a group
router.post(
  '/:groupId/events',
  validateCreateEvent,
  handleValidationErrors,
  groupController.createEvent
);

// GET /api/groups/:groupId/events - List events in a group
router.get(
  '/:groupId/events',
  validateListEvents,
  handleValidationErrors,
  groupController.listGroupEvents
);

export default router;
