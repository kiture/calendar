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
} from '../../middleware/authMiddleware.js';
import pool from '../../db/database.js'; // Import pool for direct client usage for transactions/RLS setting

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

  createGroup: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { group_name } = req.body;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Create the group
      const insertGroupQuery = `
        INSERT INTO groups (group_name)
        VALUES ($1)
        RETURNING group_id, group_name, created_at, updated_at
      `;
      const groupResult = await client.query(insertGroupQuery, [group_name]);
      const group = groupResult.rows[0];

      // Add the creator as a member
      const insertMembershipQuery = `
        INSERT INTO group_memberships (group_id, user_id)
        VALUES ($1, $2)
      `;
      await client.query(insertMembershipQuery, [group.group_id, userId]);

      await client.query('COMMIT');
      res.status(201).json(group);
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

  updateGroup: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { groupId } = req.params;
    const { group_name } = req.body;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Check if user is a member of the group
      const membershipCheck = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipCheck.rowCount === 0) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }

      const updateQuery = `
        UPDATE groups
        SET group_name = $1, updated_at = NOW()
        WHERE group_id = $2
        RETURNING group_id, group_name, created_at, updated_at
      `;
      const result = await client.query(updateQuery, [group_name, groupId]);

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Group not found' });
        return;
      }

      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
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

  deleteGroup: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { groupId } = req.params;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Check if user is a member of the group
      const membershipCheck = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipCheck.rowCount === 0) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }

      const result = await client.query(
        'DELETE FROM groups WHERE group_id = $1',
        [groupId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Group not found' });
        return;
      }

      await client.query('COMMIT');
      res.status(204).send();
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

  addMember: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { groupId } = req.params;
    const { user_id } = req.body;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Check if the current user is a member of the group
      const membershipCheck = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipCheck.rowCount === 0) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }

      // Check if the user to be added exists
      const userCheck = await client.query(
        'SELECT 1 FROM users WHERE user_id = $1',
        [user_id]
      );

      if (userCheck.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Check if membership already exists
      const existingMembership = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, user_id]
      );

      if (existingMembership.rowCount && existingMembership.rowCount > 0) {
        res
          .status(409)
          .json({ message: 'User is already a member of this group' });
        return;
      }

      // Add the new member
      const insertQuery = `
        INSERT INTO group_memberships (group_id, user_id)
        VALUES ($1, $2)
        RETURNING group_id, user_id, joined_at
      `;
      const result = await client.query(insertQuery, [groupId, user_id]);

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
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

  removeMember: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { groupId, userId: targetUserId } = req.params;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Check if the current user is a member of the group
      const membershipCheck = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipCheck.rowCount === 0) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }

      const result = await client.query(
        'DELETE FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, targetUserId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Membership not found' });
        return;
      }

      await client.query('COMMIT');
      res.status(204).send();
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

  listMembers: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new Error('Authentication required'));
    }

    const { groupId } = req.params;
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(`SET LOCAL "myapp.user_id" = '${userId}'`);

      // Check if user is a member of the group
      const membershipCheck = await client.query(
        'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipCheck.rowCount === 0) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }

      const membersQuery = `
        SELECT u.user_id, u.email, u.login, u.first_name, u.last_name, gm.joined_at
        FROM users u
        JOIN group_memberships gm ON u.user_id = gm.user_id
        WHERE gm.group_id = $1
        ORDER BY u.email
      `;
      const membersResult = await client.query(membersQuery, [groupId]);

      await client.query('COMMIT');
      res.status(200).json(membersResult.rows);
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
      end_time,
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
                INSERT INTO events (group_id, creator_user_id, title, start_time, end_time, place, description, is_ai_suggestion)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING event_id, group_id, creator_user_id, title, start_time, end_time, place, description, is_ai_suggestion, created_at, updated_at
            `;
      const values = [
        groupId,
        userId,
        title,
        start_time,
        end_time,
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
                SELECT event_id, group_id, creator_user_id, title, start_time, end_time, place, description, is_ai_suggestion, created_at, updated_at
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

const validateCreateGroup = [
  body('group_name').notEmpty().withMessage('Group name is required'),
];

const validateUpdateGroup = [
  ...validateGroupId,
  body('group_name').notEmpty().withMessage('Group name is required'),
];

const validateAddMember = [
  ...validateGroupId,
  body('user_id').isUUID().withMessage('Valid user_id is required'),
];

const validateMemberParams = [
  ...validateGroupId,
  param('userId').isUUID().withMessage('Valid userId parameter is required'),
];

const validateCreateEvent = [
  ...validateGroupId,
  body('title').notEmpty().withMessage('Event title is required'),
  body('start_time')
    .isISO8601()
    .withMessage('Valid start_time (ISO8601 format) is required'),
  body('end_time')
    .isISO8601()
    .withMessage('Valid end_time (ISO8601 format) is required'),
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

// Group management routes
router.post(
  '/',
  validateCreateGroup,
  handleValidationErrors,
  groupController.createGroup
);
router.put(
  '/:groupId',
  validateUpdateGroup,
  handleValidationErrors,
  groupController.updateGroup
);
router.delete(
  '/:groupId',
  validateGroupId,
  handleValidationErrors,
  groupController.deleteGroup
);

// Group membership routes
router.get(
  '/:groupId/members',
  validateGroupId,
  handleValidationErrors,
  groupController.listMembers
);
router.post(
  '/:groupId/members',
  validateAddMember,
  handleValidationErrors,
  groupController.addMember
);
router.delete(
  '/:groupId/members/:userId',
  validateMemberParams,
  handleValidationErrors,
  groupController.removeMember
);

export default router;
