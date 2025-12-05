import express from 'express';
import { protect } from '../middleware/auth.js';
import { getTodaysTasks, getCalendarEvents, getUpcomingTasks } from '../controllers/calendarController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Worker calendar routes
router.get('/today', getTodaysTasks);
router.get('/events', getCalendarEvents);
router.get('/upcoming', getUpcomingTasks);

export default router;
