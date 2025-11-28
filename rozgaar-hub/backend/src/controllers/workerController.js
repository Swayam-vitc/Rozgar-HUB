import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import CalendarEvent from '../models/CalendarEvent.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import HireRequest from '../models/HireRequest.js';

export const getWorkerProfile = async (req, res) => {
    try {
        const worker = await User.findById(req.user._id);
        res.json({
            success: true,
            worker: worker.getPublicProfile()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching worker profile'
        });
    }
};

// @desc    Browse available jobs
// @route   GET /api/worker/jobs
// @access  Private (Worker)
export const browseJobs = async (req, res) => {
    try {
        const { location, skills, minPay, maxPay, payType, status } = req.query;

        let query = { status: status || 'open' };

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (skills) {
            const skillsArray = skills.split(',');
            query.requiredSkills = { $in: skillsArray };
        }

        if (minPay || maxPay) {
            query.payAmount = {};
            if (minPay) query.payAmount.$gte = Number(minPay);
            if (maxPay) query.payAmount.$lte = Number(maxPay);
        }

        if (payType) {
            query.payType = payType;
        }

        const jobs = await Job.find(query)
            .populate('employerId', 'name companyName profilePhoto rating')
            .sort({ postedDate: -1 })
            .limit(50);

        res.json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs',
            error: error.message
        });
    }
};

// @desc    Apply to a job
// @route   POST /api/worker/apply/:jobId
// @access  Private (Worker)
export const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { message, teamMembers } = req.body;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({
            jobId,
            workerId: req.user._id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job'
            });
        }

        // Create application
        const application = await Application.create({
            jobId,
            workerId: req.user._id,
            workerName: req.user.name,
            workerPhone: req.user.phone,
            workerPhoto: req.user.profilePhoto,
            message: message || '',
            teamMembers: teamMembers || []
        });

        // Create notification for employer
        await Notification.create({
            userId: job.employerId,
            type: 'application',
            title: 'New Job Application',
            message: `${req.user.name} has applied for your job: ${job.title}`,
            relatedId: application._id,
            relatedModel: 'Application',
            actionUrl: `/employer/applications?jobId=${jobId}`
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting application',
            error: error.message
        });
    }
};

// @desc    Get my applications
// @route   GET /api/worker/applications
// @access  Private (Worker)
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ workerId: req.user._id })
            .populate('jobId')
            .sort({ appliedDate: -1 });

        res.json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching applications'
        });
    }
};

// @desc    Get calendar events
// @route   GET /api/worker/calendar
// @access  Private (Worker)
export const getCalendarEvents = async (req, res) => {
    try {
        const events = await CalendarEvent.find({ userId: req.user._id })
            .populate('jobId', 'title location')
            .sort({ start: 1 });

        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching calendar events'
        });
    }
};

// @desc    Create calendar event
// @route   POST /api/worker/calendar
// @access  Private (Worker)
export const createCalendarEvent = async (req, res) => {
    try {
        const { title, start, end, jobId, color, description, location } = req.body;

        const event = await CalendarEvent.create({
            title,
            start,
            end,
            jobId,
            userId: req.user._id,
            color: color || '#FF9933',
            description: description || '',
            location: location || ''
        });

        res.status(201).json({
            success: true,
            message: 'Calendar event created',
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating calendar event',
            error: error.message
        });
    }
};

// @desc    Get earnings summary
// @route   GET /api/worker/earnings
// @access  Private (Worker)
export const getEarnings = async (req, res) => {
    try {
        const payments = await Payment.find({ workerId: req.user._id });

        const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
        const paidAmount = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({
            success: true,
            earnings: {
                total: totalEarnings,
                paid: paidAmount,
                pending: pendingAmount,
                payments: payments.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings'
        });
    }
};

// @desc    Get payment history
// @route   GET /api/worker/payments
// @access  Private (Worker)
export const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ workerId: req.user._id })
            .populate('jobId', 'title')
            .populate('employerId', 'name companyName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payments'
        });
    }
};

// @desc    Get hire requests for worker
// @route   GET /api/worker/hire-requests
// @access  Private (Worker)
export const getHireRequests = async (req, res) => {
    try {
        const { status } = req.query;
        console.log('Fetching hire requests for worker:', req.user._id, 'status:', status);

        let query = { workerId: req.user._id };

        if (status) {
            query.status = status;
        }

        const hireRequests = await HireRequest.find(query)
            .sort({ createdAt: -1 });

        console.log('Found hire requests:', hireRequests.length);

        res.json({
            success: true,
            count: hireRequests.length,
            hireRequests
        });
    } catch (error) {
        console.error('Error in getHireRequests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hire requests',
            error: error.message
        });
    }
};

// @desc    Update hire request status (accept/reject)
// @route   PUT /api/worker/hire-requests/:id
// @access  Private (Worker)
export const updateHireRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "accepted" or "rejected"'
            });
        }

        const hireRequest = await HireRequest.findOne({
            _id: id,
            workerId: req.user._id
        });

        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        if (hireRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This hire request has already been processed'
            });
        }

        hireRequest.status = status;
        await hireRequest.save();

        if (status === 'accepted') {
            // Create a calendar event for the accepted work
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1); // Default to tomorrow
            startDate.setHours(9, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(17, 0, 0, 0); // 8 hour shift

            await CalendarEvent.create({
                title: `Work: ${hireRequest.jobTitle || 'Hired Work'}`,
                description: hireRequest.jobDescription || `Work for ${hireRequest.employerName}`,
                start: startDate,
                end: endDate,
                userId: req.user._id,
                jobId: hireRequest.jobId, // Can be null now
                location: hireRequest.jobLocation ? `${hireRequest.jobLocation.city}, ${hireRequest.jobLocation.state}` : '',
                color: '#10B981' // Green for accepted work
            });
        }

        // Create notification for employer
        await Notification.create({
            userId: hireRequest.employerId,
            type: 'application',
            title: status === 'accepted' ? 'Hire Request Accepted' : 'Hire Request Rejected',
            message: `${req.user.name} has ${status} your hiring request`,
            relatedId: hireRequest._id,
            relatedModel: 'HireRequest',
            actionUrl: `/employer/workers`
        });

        res.json({
            success: true,
            message: `Hire request ${status} successfully`,
            hireRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating hire request',
            error: error.message
        });
    }
};
