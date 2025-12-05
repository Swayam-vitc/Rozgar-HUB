import HireRequest from '../models/HireRequest.js';

/**
 * @desc    Get today's tasks for worker
 * @route   GET /api/worker/calendar/today
 * @access  Private (Worker)
 */
export const getTodaysTasks = async (req, res) => {
    try {
        const workerId = req.user._id;

        // Get today's date range (start and end of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all accepted hire requests scheduled for today
        const tasks = await HireRequest.find({
            workerId,
            status: 'accepted',
            completed: false,
            scheduledDate: {
                $gte: today,
                $lt: tomorrow
            }
        })
            .populate('employerId', 'name companyName phone profilePhoto')
            .sort({ scheduledTime: 1 });

        res.json({
            success: true,
            count: tasks.length,
            tasks: tasks.map(task => ({
                id: task._id,
                jobTitle: task.jobTitle,
                jobDescription: task.jobDescription,
                scheduledDate: task.scheduledDate,
                scheduledTime: task.scheduledTime,
                workLocation: task.workLocation,
                employer: {
                    id: task.employerId._id,
                    name: task.employerName || task.employerId.name,
                    phone: task.employerId.phone,
                    photo: task.employerPhoto || task.employerId.profilePhoto
                },
                salaryAmount: task.salaryAmount,
                salaryType: task.salaryType
            }))
        });
    } catch (error) {
        console.error('Error fetching today\'s tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching today\'s tasks',
            error: error.message
        });
    }
};

/**
 * @desc    Get all calendar events for worker
 * @route   GET /api/worker/calendar/events
 * @access  Private (Worker)
 */
export const getCalendarEvents = async (req, res) => {
    try {
        const workerId = req.user._id;
        const { start, end } = req.query;

        let query = {
            workerId,
            status: 'accepted',
            scheduledDate: { $ne: null }
        };

        // If date range provided, filter by it
        if (start && end) {
            query.scheduledDate = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }

        const events = await HireRequest.find(query)
            .populate('employerId', 'name companyName phone profilePhoto')
            .sort({ scheduledDate: 1 });

        res.json({
            success: true,
            count: events.length,
            events: events.map(event => ({
                id: event._id,
                title: event.jobTitle,
                description: event.jobDescription,
                start: event.scheduledDate,
                end: event.scheduledDate, // Same day event
                scheduledTime: event.scheduledTime,
                location: event.workLocation,
                employer: {
                    id: event.employerId._id,
                    name: event.employerName || event.employerId.name,
                    phone: event.employerId.phone,
                    photo: event.employerPhoto || event.employerId.profilePhoto
                },
                salaryAmount: event.salaryAmount,
                salaryType: event.salaryType,
                completed: event.completed,
                paid: event.paid
            }))
        });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching calendar events',
            error: error.message
        });
    }
};

/**
 * @desc    Get upcoming tasks for worker
 * @route   GET /api/worker/calendar/upcoming
 * @access  Private (Worker)
 */
export const getUpcomingTasks = async (req, res) => {
    try {
        const workerId = req.user._id;
        const limit = parseInt(req.query.limit) || 5;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = await HireRequest.find({
            workerId,
            status: 'accepted',
            completed: false,
            scheduledDate: { $gte: today }
        })
            .populate('employerId', 'name companyName phone')
            .sort({ scheduledDate: 1, scheduledTime: 1 })
            .limit(limit);

        res.json({
            success: true,
            count: tasks.length,
            tasks: tasks.map(task => ({
                id: task._id,
                jobTitle: task.jobTitle,
                scheduledDate: task.scheduledDate,
                scheduledTime: task.scheduledTime,
                workLocation: task.workLocation,
                employer: {
                    id: task.employerId._id,
                    name: task.employerName || task.employerId.name
                }
            }))
        });
    } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching upcoming tasks',
            error: error.message
        });
    }
};
