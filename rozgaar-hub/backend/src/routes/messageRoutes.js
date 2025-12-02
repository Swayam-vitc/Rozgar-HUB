import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    getUnreadCount
} from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Message routes
router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markAsRead);
router.get('/:connectionId', getMessages);

export default router;
