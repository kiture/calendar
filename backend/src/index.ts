import express, { Request, Response } from 'express';
import authRoutes from './routes/auth/auth.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import cors from 'cors';
import groupsRoutes from './routes/groups/groups.routes.js';
import eventsRoutes from './routes/events/events.routes.js';
import aiRoutes from './routes/ai/ai.routes.js';
import usersRoutes from './routes/users/users.routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.send('Calendar API is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
