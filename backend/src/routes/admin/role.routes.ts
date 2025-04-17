import express, { Request, Response } from 'express';
import { query } from '../../db/database'; // Import the database query function

// --- Placeholder Controller (Replace with actual imports and implementations) ---
const adminRoleController = {
  listRoles: async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await query(
        'SELECT role_id, role_name FROM roles ORDER BY role_name'
      );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to retrieve roles' });
    }
  },
};
// --- End Placeholder Controller ---

const router = express.Router();

// --- Role Routes ---
// No specific validation middleware needed here
router.get('/', adminRoleController.listRoles);

export default router;
