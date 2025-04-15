import express, { Request, Response } from 'express';
import authRoutes from './routes/auth/auth.routes';
import adminRoutes from './routes/admin/admin.routes';
import cors from 'cors';
import groupsRoutes from './routes/groups/groups.routes';
import eventsRoutes from './routes/events/events.routes';
import aiRoutes from './routes/ai/ai.routes';
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World from AI Group Calendar API!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
