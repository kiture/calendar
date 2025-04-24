import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { param, validationResult } from 'express-validator';
import { query } from '../../db/database';

// --- Controller Implementations ---
const adminGroupController = {
  listAllGroups: async (req: Request, res: Response): Promise<void> => {
    try {
      const groupsQuery = `SELECT group_id, group_name, created_at, updated_at FROM groups ORDER BY group_name`;
      const groupsResult = await query(groupsQuery);
      res.status(200).json(groupsResult.rows);
    } catch (error) {
      console.error('Error listing all groups:', error);
      res.status(500).json({ message: 'Failed to retrieve groups' });
    }
  },

  getGroupById: async (req: Request, res: Response): Promise<void> => {
    const { groupId } = req.params;
    try {
      const result = await query(
        'SELECT group_id, group_name, created_at, updated_at FROM groups WHERE group_id = $1',
        [groupId]
      );
      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Group not found' });
        return;
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error getting group by ID:', error);
      res.status(500).json({ message: 'Failed to retrieve group' });
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

// Need mergeParams: true to access :groupId from the parent router mount point
const router = express.Router({ mergeParams: true });

// --- Validation Chains ---
const validateGroupId = [
  param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
];

// --- Group Routes ---
router.get(
  '/',
  handleValidationErrors as RequestHandler,
  adminGroupController.listAllGroups
);

router.get(
  '/:groupId',
  validateGroupId,
  handleValidationErrors as RequestHandler,
  adminGroupController.getGroupById
);

export default router;
