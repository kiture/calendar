import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { body, param, validationResult } from 'express-validator';
import authenticateToken, {
  AuthRequest,
} from '../../middleware/authMiddleware';
import pool from '../../db/database'; // Import pool for direct client usage

// --- Controller Implementation ---
const eventController = {
  // GET /events/:eventId - Get details for a specific event
  getEventById: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      const eventQuery = `SELECT event_id, group_id, creator_user_id, title, start_time, end_time, place, description, is_ai_suggestion, created_at, updated_at FROM events WHERE event_id = $1`;
      const result = await client.query(eventQuery, [eventId]);

      await client.query('COMMIT');

      if (result.rowCount === 0) {
        // RLS policy might have prevented access, or event doesn't exist
        res.status(404).json({ message: 'Event not found or access denied' });
        return;
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      next(error);
    } finally {
      if (client) client.release();
    }
  },

  // PUT /events/:eventId - Update details for a specific event
  updateEvent: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    // Extract only allowed fields for update
    const { title, start_time, end_time, place, description, is_ai_suggestion } =
      req.body;

    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      // Construct dynamic update query for provided fields
      const updates: Record<string, string | boolean | Date | null> = {};
      if (title !== undefined) updates.title = title;
      if (start_time !== undefined) updates.start_time = start_time;
      if (end_time !== undefined) updates.end_time = end_time;
      if (place !== undefined) updates.place = place;
      if (description !== undefined) updates.description = description;
      if (is_ai_suggestion !== undefined)
        updates.is_ai_suggestion = is_ai_suggestion;

      const fields = Object.keys(updates);
      if (fields.length === 0) {
        res
          .status(400)
          .json({ message: 'No valid fields provided for update' });
        await client.query('ROLLBACK'); // Need to rollback before returning
        return;
      }

      // Add updated_at manually
      updates.updated_at = new Date();
      fields.push('updated_at');

      const setClauses = fields
        .map((field, index) => `"${field}" = $${index + 1}`)
        .join(', ');
      const values = fields.map((field) => updates[field]);

      const updateQuery = `
                UPDATE events
                SET ${setClauses}
                WHERE event_id = $${fields.length + 1}
                RETURNING event_id, group_id, creator_user_id, title, start_time, end_time, place, description, is_ai_suggestion, created_at, updated_at
            `;

      const result = await client.query(updateQuery, [...values, eventId]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        // RLS policy prevented update, or event doesn't exist
        res
          .status(404)
          .json({ message: 'Event not found or update not allowed' });
        return;
      }

      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      next(error);
    } finally {
      if (client) client.release();
    }
  },

  // DELETE /events/:eventId - Delete a specific event
  deleteEvent: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      // Add RETURNING clause to get the deleted event ID
      const deleteQuery = `DELETE FROM events WHERE event_id = $1 RETURNING event_id`;
      const result = await client.query(deleteQuery, [eventId]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        res
          .status(404)
          .json({ message: 'Event not found or delete not allowed' });
        return;
      }

      await client.query('COMMIT');
      // Send 200 OK with the deleted event ID
      res.status(200).json({ event_id: result.rows[0].event_id });
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      next(error);
    } finally {
      if (client) client.release();
    }
  },

  // POST /events/:eventId/attendance - Mark user as attending
  joinEvent: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      // Check if already attending (RLS applies)
      const checkQuery = `SELECT 1 FROM event_attendance WHERE event_id = $1 AND user_id = $2`;
      const checkResult = await client.query(checkQuery, [eventId, userId]);

      if (
        checkResult &&
        checkResult.rowCount != null &&
        checkResult.rowCount > 0
      ) {
        // Already attending, maybe return existing record or just 200 OK
        const currentAttendanceQuery = `SELECT user_id, event_id, joined_at FROM event_attendance WHERE event_id = $1 AND user_id = $2`;
        const currentResult = await client.query(currentAttendanceQuery, [
          eventId,
          userId,
        ]);
        await client.query('COMMIT'); // Commit read transaction
        res.status(200).json(currentResult.rows[0]);
        return;
      }

      // Insert attendance (RLS policy applies)
      const insertQuery = `
                INSERT INTO event_attendance (user_id, event_id)
                VALUES ($1, $2)
                RETURNING user_id, event_id, joined_at
            `;
      const result = await client.query(insertQuery, [userId, eventId]);

      await client.query('COMMIT');

      if (result.rows.length > 0) {
        res.status(201).json(result.rows[0]);
      } else {
        // This case might indicate RLS violation if insert failed silently
        throw new Error(
          'Failed to join event. Check if the event exists and you are a member of its group.'
        );
      }
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === '23503' || error.code === '44000')
      ) {
        // FK violation or check violation
        next(
          new Error('Failed to join event: Event not found or access denied.')
        );
      } else {
        next(error);
      }
    } finally {
      if (client) client.release();
    }
  },

  // DELETE /events/:eventId/attendance - Remove user's attendance
  leaveEvent: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      // Add RETURNING clause to get IDs
      const deleteQuery = `DELETE FROM event_attendance WHERE event_id = $1 AND user_id = $2 RETURNING event_id, user_id`;
      const result = await client.query(deleteQuery, [eventId, userId]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          message: 'Attendance record not found or delete not allowed',
        });
        return;
      }

      await client.query('COMMIT');
      // Send 200 OK with the deleted attendance IDs
      res.status(200).json({
        event_id: result.rows[0].event_id,
        user_id: result.rows[0].user_id,
      });
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      next(error);
    } finally {
      if (client) client.release();
    }
  },

  // GET /events/:eventId/attendees - List attendees for an event
  listAttendees: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { eventId } = req.params;
    // Remove limit and offset parsing
    // const limit = parseInt(req.query.limit as string || '20', 10);
    // const offset = parseInt(req.query.offset as string || '0', 10);

    if (!req.user) return next(new Error('Authentication required'));
    const userId = req.user.userId;
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const setLocalUserCmd = `SET LOCAL "myapp.user_id" = ${client.escapeLiteral(userId)}`;
      await client.query(setLocalUserCmd);

      // Remove LIMIT/OFFSET from query
      const attendeesQuery = `
                SELECT u.user_id, u.login, u.first_name, u.last_name, ea.joined_at, ea.event_id
                FROM event_attendance ea
                JOIN users u ON ea.user_id = u.user_id
                WHERE ea.event_id = $1
                ORDER BY u.login
            `;
      // Remove count query
      // const countQuery = `SELECT COUNT(*) FROM event_attendance WHERE event_id = $1`;

      // Execute only the attendees query
      const attendeesResult = await client.query(attendeesQuery, [eventId]);
      // Remove Promise.all and count query execution
      // const [attendeesResult, countResult] = await Promise.all([
      //     client.query(attendeesQuery, [eventId, limit, offset]),
      //     client.query(countQuery, [eventId]) // RLS applies here too
      // ]);

      await client.query('COMMIT');

      // Check if count is 0 and attendees list is empty, could indicate 404 for event
      // but RLS might just return empty if user has no access, so 200 is okay.

      // Remove totalCount
      // const totalCount = parseInt(countResult.rows[0].count, 10);

      // Return just the attendees array
      res.status(200).json(attendeesResult.rows);
      // res.status(200).json({
      //     attendees: attendeesResult.rows,
      //     total_count: totalCount
      // });
    } catch (error) {
      if (client)
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback failed', e);
        }
      next(error);
    } finally {
      if (client) client.release();
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

const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :eventId from parent

// --- Validation Chains ---
const validateEventId = [
  param('eventId').isUUID().withMessage('Valid eventId parameter is required'),
];

const validateUpdateEvent = [
  ...validateEventId,
  // All body fields are optional for PUT
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Event title cannot be empty'),
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('Valid start_time (ISO8601 format) is required'),
  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('Valid end_time (ISO8601 format) is required'),
  body('place').optional({ nullable: true }).isString(), // Allow null
  body('description').optional({ nullable: true }).isString(), // Allow null
  body('is_ai_suggestion').optional().isBoolean(),
];

const validateListAttendees = [...validateEventId];

// --- Event Routes (/events) ---
// All routes require authentication
router.use(authenticateToken as RequestHandler);

// GET /events/:eventId - Get event details
router.get(
  '/:eventId',
  validateEventId,
  handleValidationErrors,
  eventController.getEventById
);

// PUT /events/:eventId - Update event details
router.put(
  '/:eventId',
  validateUpdateEvent,
  handleValidationErrors,
  eventController.updateEvent
);

// DELETE /events/:eventId - Delete event
router.delete(
  '/:eventId',
  validateEventId,
  handleValidationErrors,
  eventController.deleteEvent
);

// --- Event Attendance Routes (/events/:eventId/attendance | /events/:eventId/attendees) ---

// POST /events/:eventId/attendance - Join event
router.post(
  '/:eventId/attendance',
  validateEventId,
  handleValidationErrors,
  eventController.joinEvent
);

// DELETE /events/:eventId/attendance - Leave event
router.delete(
  '/:eventId/attendance',
  validateEventId,
  handleValidationErrors,
  eventController.leaveEvent
);

// GET /events/:eventId/attendees - List attendees
router.get(
  '/:eventId/attendees',
  validateListAttendees,
  handleValidationErrors,
  eventController.listAttendees
);

export default router;
