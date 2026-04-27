import 'module-alias/register';
import './config/env';
import express from 'express';

import http from 'http';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from '@/routes/auth.routes';
import houseRoutes from '@/routes/house.routes';
import taskRoutes from '@/routes/task.routes';
import expenseRoutes from '@/routes/expense.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import karmaRoutes from '@/routes/karma.routes';
import userRoutes from '@/routes/user.routes';
import alertRoutes from '@/routes/alert.routes';
// import testRoutes from './routes/test.routes';
import { errorHandler } from '@/middlewares/errorHandler';

import { initCronJobs } from '@/services/cron.service';
import { initSocket } from '@/lib/socket';


dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
initSocket(server);

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/karma', karmaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
// app.use('/api/test', testRoutes);




// Initialize Cron Jobs
initCronJobs();

// Error Handler (must be last)
app.use(errorHandler);

// Error Handling for process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

server.listen(PORT, () => {

  console.log(`🚀 Equilive Backend running on http://localhost:${PORT} [Final Math Fix: ${new Date().toISOString()}]`);

});
