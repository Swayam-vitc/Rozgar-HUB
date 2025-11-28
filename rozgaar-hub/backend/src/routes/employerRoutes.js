import express from 'express';
import {
    getEmployerProfile,
    createJob,
    getMyJobs,
    updateJob,
    deleteJob,
    searchWorkers,
    getJobApplications,
    getAllApplications,
    updateApplicationStatus,
    createPayment,
    getAnalytics,
    createCustomJobTitle,
    getCustomJobTitles,
    getWorkerById,
    hireWorker
} from '../controllers/employerController.js';
import { protect, requireEmployer } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and employer role
router.use(protect);
router.use(requireEmployer);

router.get('/profile', getEmployerProfile);
router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.get('/workers', searchWorkers);
router.get('/applications', getAllApplications);
router.get('/applications/:jobId', getJobApplications);
router.put('/applications/:id', updateApplicationStatus);
router.post('/payments', createPayment);
router.get('/analytics', getAnalytics);
router.post('/job-titles', createCustomJobTitle);
router.get('/job-titles', getCustomJobTitles);
router.get('/worker/:id', getWorkerById);
router.post('/hire', hireWorker);

export default router;
