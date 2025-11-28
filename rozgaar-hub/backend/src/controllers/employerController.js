import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import CustomJobTitle from '../models/CustomJobTitle.js';
import HireRequest from '../models/HireRequest.js';
import Notification from '../models/Notification.js';

// @desc    Get employer profile
// @route   GET /api/employer/profile
// @access  Private (Employer)
export const getEmployerProfile = async (req, res) => {
    try {
        const employer = await User.findById(req.user._id);
        res.json({
            success: true,
            employer: employer.getPublicProfile()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching employer profile'
        });
    }
};

// @desc    Create job posting
// @route   POST /api/employer/jobs
// @access  Private (Employer)
export const createJob = async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            employerId: req.user._id,
            employerName: req.user.companyName || req.user.name,
            employerPhoto: req.user.profilePhoto
        };

        const job = await Job.create(jobData);

        // Update employer's projects posted count
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { projectsPosted: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating job',
            error: error.message
        });
    }
};

// @desc    Get my job postings
// @route   GET /api/employer/jobs
// @access  Private (Employer)
export const getMyJobs = async (req, res) => {
    try {
        const { status, id } = req.query;

        let query = { employerId: req.user._id };

        // If ID is provided, fetch specific job
        if (id) {
            query._id = id;
        }

        if (status) {
            query.status = status;
        }

        const jobs = await Job.find(query).sort({ postedDate: -1 });

        res.json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching jobs'
        });
    }
};

// @desc    Update job posting
// @route   PUT /api/employer/jobs/:id
// @access  Private (Employer)
export const updateJob = async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            employerId: req.user._id
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or unauthorized'
            });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating job',
            error: error.message
        });
    }
};

// @desc    Delete job posting
// @route   DELETE /api/employer/jobs/:id
// @access  Private (Employer)
export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            employerId: req.user._id
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or unauthorized'
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting job'
        });
    }
};

// @desc    Search workers
// @route   GET /api/employer/workers
// @access  Private (Employer)
export const searchWorkers = async (req, res) => {
    try {
        const { skills, location, minRating, verified } = req.query;

        let query = { role: 'worker' };

        if (skills) {
            const skillsArray = skills.split(',');
            query.skills = { $in: skillsArray };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }

        if (verified === 'true') {
            query.verified = true;
        }

        const workers = await User.find(query)
            .select('-password')
            .sort({ rating: -1, completedJobs: -1 })
            .limit(50);

        res.json({
            success: true,
            count: workers.length,
            workers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching workers',
            error: error.message
        });
    }
};

// @desc    Get applications for a job
// @route   GET /api/employer/applications/:jobId
// @access  Private (Employer)
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Verify job belongs to employer
        const job = await Job.findOne({
            _id: jobId,
            employerId: req.user._id
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or unauthorized'
            });
        }

        const applications = await Application.find({ jobId })
            .populate('workerId', 'name phone profilePhoto skills rating completedJobs verified')
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

// @desc    Get all applications for employer's jobs
// @route   GET /api/employer/applications
// @access  Private (Employer)
export const getAllApplications = async (req, res) => {
    try {
        // Find all jobs posted by this employer
        const jobs = await Job.find({ employerId: req.user._id }).select('_id');
        const jobIds = jobs.map(job => job._id);

        // Find all applications for those jobs
        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate('workerId', 'name phone profilePhoto skills rating completedJobs verified location')
            .populate('jobId', 'title location payType payAmount status')
            .sort({ appliedDate: -1 });

        res.json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
};

// @desc    Accept/reject application
// @route   PUT /api/employer/applications/:id
// @access  Private (Employer)
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const application = await Application.findById(req.params.id).populate('jobId');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Verify job belongs to employer
        if (application.jobId.employerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        application.status = status;
        await application.save();

        // If accepted, update job status and create calendar event
        if (status === 'accepted') {
            await Job.findByIdAndUpdate(application.jobId._id, {
                status: 'in-progress'
            });

            // Create calendar event for worker
            await CalendarEvent.create({
                title: application.jobId.title,
                start: application.jobId.startDate,
                end: application.jobId.endDate || application.jobId.startDate,
                jobId: application.jobId._id,
                userId: application.workerId,
                location: application.jobId.location
            });
        }

        res.json({
            success: true,
            message: `Application ${status}`,
            application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating application',
            error: error.message
        });
    }
};

// @desc    Create payment record
// @route   POST /api/employer/payments
// @access  Private (Employer)
export const createPayment = async (req, res) => {
    try {
        const { jobId, workerId, amount, dueDate, paymentMethod, notes } = req.body;

        const payment = await Payment.create({
            jobId,
            workerId,
            employerId: req.user._id,
            amount,
            dueDate,
            paymentMethod: paymentMethod || 'cash',
            notes: notes || ''
        });

        // Update worker's total earnings
        await User.findByIdAndUpdate(workerId, {
            $inc: { totalEarnings: amount }
        });

        res.status(201).json({
            success: true,
            message: 'Payment record created',
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating payment',
            error: error.message
        });
    }
};

// @desc    Get employer analytics
// @route   GET /api/employer/analytics
// @access  Private (Employer)
export const getAnalytics = async (req, res) => {
    try {
        const totalJobs = await Job.countDocuments({ employerId: req.user._id });
        const activeJobs = await Job.countDocuments({
            employerId: req.user._id,
            status: 'in-progress'
        });
        const completedJobs = await Job.countDocuments({
            employerId: req.user._id,
            status: 'completed'
        });

        const totalApplications = await Application.countDocuments({
            jobId: { $in: await Job.find({ employerId: req.user._id }).distinct('_id') }
        });

        const totalPayments = await Payment.find({ employerId: req.user._id });
        const totalSpent = totalPayments.reduce((sum, p) => sum + p.amount, 0);

        res.json({
            success: true,
            analytics: {
                totalJobs,
                activeJobs,
                completedJobs,
                totalApplications,
                totalSpent,
                paymentsCount: totalPayments.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
};

// @desc    Create custom job title
// @route   POST /api/employer/job-titles
// @access  Private (Employer)
export const createCustomJobTitle = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Job title is required'
            });
        }

        // Check if title already exists (case-insensitive)
        const existingTitle = await CustomJobTitle.findOne({
            title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
        });

        if (existingTitle) {
            return res.status(400).json({
                success: false,
                message: 'This job title already exists'
            });
        }

        const customJobTitle = await CustomJobTitle.create({
            title: title.trim(),
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Custom job title created successfully',
            jobTitle: customJobTitle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating custom job title',
            error: error.message
        });
    }
};

// @desc    Get all custom job titles
// @route   GET /api/employer/job-titles
// @access  Private (Employer)
export const getCustomJobTitles = async (req, res) => {
    try {
        const customJobTitles = await CustomJobTitle.find()
            .sort({ createdAt: -1 })
            .select('title createdAt');

        res.json({
            success: true,
            count: customJobTitles.length,
            jobTitles: customJobTitles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching custom job titles'
        });
    }
};

// @desc    Get worker profile by ID
// @route   GET /api/employer/worker/:id
// @access  Private (Employer)
export const getWorkerById = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await User.findOne({
            _id: id,
            role: 'worker'
        }).select('-password');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        res.json({
            success: true,
            worker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching worker profile',
            error: error.message
        });
    }
};

// @desc    Hire a worker (create hiring request)
// @route   POST /api/employer/hire
// @access  Private (Employer)
export const hireWorker = async (req, res) => {
    try {
        const {
            workerId,
            jobId,
            applicationId,
            jobTitle,
            jobDescription,
            jobLocation,
            salaryType,
            salaryAmount,
            message
        } = req.body;

        if (!workerId) {
            return res.status(400).json({
                success: false,
                message: 'Worker ID is required'
            });
        }

        // Check if worker exists
        const worker = await User.findOne({
            _id: workerId,
            role: 'worker'
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        // Check if job exists (if jobId provided)
        let job = null;
        if (jobId) {
            job = await Job.findOne({
                _id: jobId,
                employerId: req.user._id
            });

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found or unauthorized'
                });
            }
        }

        // Check if hiring request already exists
        const existingRequest = await HireRequest.findOne({
            employerId: req.user._id,
            workerId,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending or active hiring request for this worker'
            });
        }

        // Create hiring request
        const hireRequest = await HireRequest.create({
            employerId: req.user._id,
            employerName: req.user.companyName || req.user.name,
            employerPhoto: req.user.profilePhoto || '',
            employerPhoneNumber: req.user.phone || '',
            workerId,
            jobId: jobId || null,
            jobTitle: jobTitle || '',
            jobDescription: jobDescription || '',
            jobLocation: jobLocation || { state: '', city: '' },
            salaryType: salaryType || '',
            salaryAmount: salaryAmount || 0,
            message: message || ''
        });

        // Create notification for worker
        await Notification.create({
            userId: workerId,
            type: 'application',
            title: 'New Hiring Request',
            message: `${req.user.companyName || req.user.name} wants to hire you${jobId ? ' for a job' : ''}`,
            relatedId: hireRequest._id,
            relatedModel: 'HireRequest',
            actionUrl: `/worker/hire-requests`
        });

        res.status(201).json({
            success: true,
            message: 'Hiring request sent successfully',
            hireRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating hiring request',
            error: error.message
        });
    }
};


