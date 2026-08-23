import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { sanitizeBody } from './middleware/sanitize.js';
import authRouter from './routes/auth.routes.js';
import propertyRouter from './routes/property.routes.js';
import applicationRouter from './routes/application.routes.js';
import leaseRouter from './routes/lease.routes.js';
import rentRouter from './routes/rent.routes.js';
import maintenanceRouter from './routes/maintenance.routes.js';
import expenseRouter from './routes/expense.routes.js';
import reportRouter from './routes/report.routes.js';
import notificationRouter from './routes/notification.routes.js';
import documentRouter from './routes/document.routes.js';
dotenv.config();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(helmet());                                    // secure headers
// only allow our frontend origins (CORS_ORIGIN is a comma-separated list)
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false); // no CORS headers for unknown origins
  },
}));
app.use(express.json({ limit: '10kb' }));              // parse JSON, cap payload size

// XSS sanitization: strip dangerous HTML from every string in req.body
app.use(sanitizeBody);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 10), // limit each IP per window on auth routes
  message: { error: 'Too many attempts, please try again later' },
});
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 300), // generous general limit
  message: { error: 'Too many requests, please slow down' },
});
app.use(globalLimiter);

app.use('/auth', authLimiter, authRouter);
app.use('/properties', propertyRouter);
app.use('/applications', applicationRouter);
app.use('/leases', leaseRouter);
app.use('/rent', rentRouter);
app.use('/maintenance', maintenanceRouter);
app.use('/expenses', expenseRouter);
app.use('/reports', reportRouter);
app.use('/notifications', notificationRouter);
app.use('/documents', documentRouter);
app.use('/uploads', express.static('uploads')); // serve uploaded files
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// global error handler — must be last, after all routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack); // full detail server-side only
  // client errors (validation, payload too large, upload filters) keep their status;
  // anything unexpected becomes a generic 500
  const status = err.status || err.statusCode || 500;
  if (status >= 500) return res.status(500).json({ error: 'Something went wrong' }); // generic message to client
  res.status(status).json({ error: err.message });
});
export default app;
