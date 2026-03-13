const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rubricRoutes = require('./routes/rubrics');
const contestRoutes = require('./routes/contests');
const projectRoutes = require('./routes/projects');
const evaluationRoutes = require('./routes/evaluations');
const assignmentRoutes = require('./routes/assignments');
const dashboardRoutes = require('./routes/dashboard');

const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.static(path.join(__dirname, '../client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiadas solicitudes, intenta más tarde.' }
});

app.use('/api/v1/auth', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rubrics', rubricRoutes);
app.use('/api/v1/contests', contestRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/evaluations', evaluationRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/api/v1/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});
app.use(errorHandler);
module.exports = app;
