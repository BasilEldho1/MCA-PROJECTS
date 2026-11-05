import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './services/dataStore.js';
import { initSocket } from './socket/socketHandler.js';

import authRoutes from './routes/authRoutes.js';
import professionalRoutes from './routes/professionalRoutes.js';
import chatRequestRoutes from './routes/chatRequestRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request Logging
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Socket.IO Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/chat-requests', chatRequestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes); // for /api/conversations/:id/messages
app.use('/api', messageRoutes); // for /api/messages/:id/read
app.use('/api/projects', projectRoutes);
app.use('/api', verificationRoutes);
app.use('/api', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cjworks API',
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

// Start Server
const start = async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
  initSocket(io);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 3D House Designer Server running on port ${PORT}`);
    console.log(`📡 Socket.IO Real-Time Messaging Engine Initialized`);
    console.log(`🔗 REST API Root: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
};

start();
