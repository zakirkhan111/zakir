const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const skillMatchRoutes = require('./routes/skillMatchRoutes');

const app = express();

// Security & core middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter to protect the API from brute-force/abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'ImpactHub API is healthy 🚀', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/skill-match', skillMatchRoutes);

// 404 handler for unmatched routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
