import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { query } from '../../db/database'; // Import database query function

// --- Controller Implementations ---
const adminGroupController = {
    createGroup: async (req: Request, res: Response): Promise<void> => {
        const { group_name } = req.body;
        try {
            const insertQuery = `INSERT INTO groups (group_name) VALUES ($1) RETURNING group_id, group_name, created_at, updated_at`;
            const result = await query(insertQuery, [group_name]);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating group:', error);
            res.status(500).json({ message: 'Failed to create group' });
        }
    },

    listAllGroups: async (req: Request, res: Response): Promise<void> => {
        const limit = parseInt(req.query.limit as string || '20', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);
        try {
            const groupsQuery = `SELECT group_id, group_name, created_at, updated_at FROM groups ORDER BY group_name LIMIT $1 OFFSET $2`;
            const countQuery = `SELECT COUNT(*) FROM groups`;

            const [groupsResult, countResult] = await Promise.all([
                query(groupsQuery, [limit, offset]),
                query(countQuery)
            ]);

            const totalCount = parseInt(countResult.rows[0].count, 10);

            res.status(200).json({
                groups: groupsResult.rows,
                total_count: totalCount
            });
        } catch (error) {
            console.error('Error listing all groups:', error);
            res.status(500).json({ message: 'Failed to retrieve groups' });
        }
    },

    getGroupById: async (req: Request, res: Response): Promise<void> => {
        const { groupId } = req.params;
        try {
            const result = await query('SELECT group_id, group_name, created_at, updated_at FROM groups WHERE group_id = $1', [groupId]);
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

    updateGroup: async (req: Request, res: Response): Promise<void> => {
        const { groupId } = req.params;
        const { group_name } = req.body;
        try {
            // Check if group exists first (optional, UPDATE RETURNING handles it but 404 is cleaner)
            const check = await query('SELECT 1 FROM groups WHERE group_id = $1', [groupId]);
            if (check.rowCount === 0) {
                 res.status(404).json({ message: 'Group not found' });
                 return;
            }
            const updateQuery = `UPDATE groups SET group_name = $1, updated_at = NOW() WHERE group_id = $2 RETURNING group_id, group_name, created_at, updated_at`;
            const result = await query(updateQuery, [group_name, groupId]);

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Error updating group:', error);
            res.status(500).json({ message: 'Failed to update group' });
        }
    },

    deleteGroup: async (req: Request, res: Response): Promise<void> => {
        const { groupId } = req.params;
        try {
            // ON DELETE CASCADE in schema handles related memberships and events
            const result = await query('DELETE FROM groups WHERE group_id = $1', [groupId]);
            if (result.rowCount === 0) {
                res.status(404).json({ message: 'Group not found' });
                return;
            }
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting group:', error);
            res.status(500).json({ message: 'Failed to delete group' });
        }
    },
};
const adminMembershipController = {
    addMember: async (req: Request, res: Response): Promise<void> => {
        const { groupId } = req.params;
        const { user_id } = req.body;

        try {
            // 1. Check if group exists
            const groupExists = await query('SELECT 1 FROM groups WHERE group_id = $1', [groupId]);
            if (groupExists.rowCount === 0) {
                res.status(404).json({ message: 'Group not found' });
                return;
            }

            // 2. Check if user exists
            const userExists = await query('SELECT 1 FROM users WHERE user_id = $1', [user_id]);
            if (userExists.rowCount === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // 3. Check if membership already exists
            const membershipExists = await query(
                'SELECT 1 FROM group_memberships WHERE group_id = $1 AND user_id = $2',
                [groupId, user_id]
            );
            if (membershipExists && typeof membershipExists.rowCount === 'number' && membershipExists.rowCount > 0) {
                res.status(409).json({ message: 'User is already a member of this group' });
                return;
            }

            // 4. Add membership
            const insertQuery = `
                INSERT INTO group_memberships (group_id, user_id)
                VALUES ($1, $2)
                RETURNING user_id, group_id, joined_at
            `;
            const result = await query(insertQuery, [groupId, user_id]);

            res.status(201).json(result.rows[0]);

        } catch (error) {
            console.error('Error adding group member:', error);
            res.status(500).json({ message: 'Failed to add member to group' });
        }
    },

    removeMember: async (req: Request, res: Response): Promise<void> => {
        const { groupId, userId } = req.params;
        try {
            const deleteQuery = 'DELETE FROM group_memberships WHERE group_id = $1 AND user_id = $2';
            const result = await query(deleteQuery, [groupId, userId]);

            if (result.rowCount === 0) {
                // Could be group not found, user not found, or user not a member
                res.status(404).json({ message: 'Membership not found (or group/user does not exist)' });
                return;
            }

            res.status(204).send();

        } catch (error) {
            console.error('Error removing group member:', error);
            res.status(500).json({ message: 'Failed to remove member from group' });
        }
    },

    listMembers: async (req: Request, res: Response): Promise<void> => {
        const { groupId } = req.params;
        const limit = parseInt(req.query.limit as string || '20', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);

        try {
            // Optional: Check if group exists first for a cleaner 404
            const groupExists = await query('SELECT 1 FROM groups WHERE group_id = $1', [groupId]);
            if (groupExists.rowCount === 0) {
                res.status(404).json({ message: 'Group not found' });
                return;
            }

            const membersQuery = `
                SELECT u.user_id, u.email, u.login, u.first_name, u.last_name, gm.joined_at
                FROM users u
                JOIN group_memberships gm ON u.user_id = gm.user_id
                WHERE gm.group_id = $1
                ORDER BY u.email
                LIMIT $2 OFFSET $3
            `;
            const countQuery = `SELECT COUNT(*) FROM group_memberships WHERE group_id = $1`;

            const [membersResult, countResult] = await Promise.all([
                query(membersQuery, [groupId, limit, offset]),
                query(countQuery, [groupId])
            ]);

            const totalCount = parseInt(countResult.rows[0].count, 10);

            res.status(200).json({
                members: membersResult.rows,
                total_count: totalCount
            });

        } catch (error) {
            console.error('Error listing group members:', error);
            res.status(500).json({ message: 'Failed to retrieve group members' });
        }
    },
};
// --- End Placeholder Controllers ---

// --- Validation Error Handler Middleware ---
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Need mergeParams: true to access :groupId from the parent router mount point
const router = express.Router({ mergeParams: true });

// --- Validation Chains ---
const validateCreateGroup = [
    body('group_name').notEmpty().withMessage('Group name is required'),
];
const validateListGroups = [
    queryValidator('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt().withMessage('Offset must be a non-negative integer'),
];
const validateGroupId = [
    param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
];
const validateUpdateGroup = [
    param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
    body('group_name').notEmpty().withMessage('Group name is required'),
];
const validateAddMember = [
    // groupId is validated by validateGroupId used in route definition
    body('user_id').isUUID().withMessage('Valid user_id is required'),
];
const validateMemberParams = [
    param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
    param('userId').isUUID().withMessage('Valid userId parameter is required'),
];
const validateListMembers = [
    param('groupId').isUUID().withMessage('Valid groupId parameter is required'),
    queryValidator('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt().withMessage('Offset must be a non-negative integer'),
];

// --- Group Routes ---
router.post('/', validateCreateGroup, handleValidationErrors as RequestHandler, adminGroupController.createGroup);
router.get('/', validateListGroups, handleValidationErrors as RequestHandler, adminGroupController.listAllGroups);
router.get('/:groupId', validateGroupId, handleValidationErrors as RequestHandler, adminGroupController.getGroupById);
router.put('/:groupId', validateUpdateGroup, handleValidationErrors as RequestHandler, adminGroupController.updateGroup);
router.delete('/:groupId', validateGroupId, handleValidationErrors as RequestHandler, adminGroupController.deleteGroup);

// --- Group Membership Routes (nested under /:groupId) ---
router.post('/:groupId/members', validateGroupId, validateAddMember, handleValidationErrors as RequestHandler, adminMembershipController.addMember);
router.get('/:groupId/members', validateListMembers, handleValidationErrors as RequestHandler, adminMembershipController.listMembers);
router.delete('/:groupId/members/:userId', validateMemberParams, handleValidationErrors as RequestHandler, adminMembershipController.removeMember);

export default router; 