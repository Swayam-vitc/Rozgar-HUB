import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initializeSocket } from './services/socketService.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import employerRoutes from './routes/employerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and local network IPs
        const allowedOrigins = [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            process.env.CORS_ORIGIN
        ];

        // Allow any IP in the 192.168.x.x range on port 8080
        if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/)) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RozgaarHub API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Create HTTP server and initialize Socket.io
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);
const io = initializeSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
    console.log(`\n🚀 RozgaarHub Backend Server`);
    console.log(`📡 Running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.io initialized for real-time messaging\n`);
});

export default app;
