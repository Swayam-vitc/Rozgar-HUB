import HireRequest from '../models/HireRequest.js';
import User from '../models/User.js';

// @desc    Mark hire request as paid
// @route   POST /api/employer/hire-requests/:id/pay
// @access  Private (Employer)
export const markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Payment request for hire request:', id);
        console.log('Employer ID:', req.user?._id);

        const hireRequest = await HireRequest.findOne({
            _id: id,
            employerId: req.user._id
        });

        console.log('Found hire request:', hireRequest ? 'Yes' : 'No');

        if (!hireRequest) {
            console.log('Hire request not found or not owned by employer');
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        console.log('Hire request status:', hireRequest.status);

        if (hireRequest.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only pay for accepted hire requests'
            });
        }

        hireRequest.paid = true;
        await hireRequest.save();

        console.log('Payment marked as complete');

        res.json({
            success: true,
            message: 'Payment marked as complete',
            hireRequest
        });
    } catch (error) {
        console.error('Error in markAsPaid:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

// Calculate new rank based on ratings
const calculateRank = (ratings, currentLevel) => {
    const recentRatings = ratings.slice(-10); // Last 10 ratings
    const goodRatings = recentRatings.filter(r => r.rating >= 3.5).length;
    const veryGoodRatings = recentRatings.filter(r => r.rating >= 3.7).length;
    const excellentRatings = recentRatings.filter(r => r.rating >= 4.0).length;
    const badRatings = recentRatings.filter(r => r.rating < 2.0).length;

    // Promotion logic
    if (currentLevel === 'bronze' && goodRatings >= 3 && ratings.length >= 3) {
        return 'silver';
    }
    if (currentLevel === 'silver' && veryGoodRatings >= 5 && ratings.length >= 8) {
        return 'gold';
    }
    if (currentLevel === 'gold' && excellentRatings >= 5 && ratings.length >= 13) {
        return 'diamond';
    }

    // Demotion logic
    if (currentLevel === 'silver' && badRatings >= 5) {
        return 'bronze';
    }
    if (currentLevel === 'gold' && badRatings >= 5) {
        return 'silver';
    }
    if (currentLevel === 'diamond' && badRatings >= 4) {
        return 'gold';
    }

    return currentLevel;
};

// @desc    Complete job and submit rating
// @route   POST /api/employer/hire-requests/:id/complete
// @access  Private (Employer)
export const completeJobWithRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const hireRequest = await HireRequest.findOne({
            _id: id,
            employerId: req.user._id
        });

        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        if (hireRequest.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only complete accepted hire requests'
            });
        }

        if (hireRequest.completed) {
            return res.status(400).json({
                success: false,
                message: 'This job has already been completed'
            });
        }

        // Update hire request
        hireRequest.completed = true;
        hireRequest.rating = rating;
        hireRequest.feedback = feedback || '';
        hireRequest.completedAt = new Date();
        await hireRequest.save();

        // Update worker profile
        const worker = await User.findById(hireRequest.workerId);

        if (worker) {
            // Add rating to worker's ratings array
            worker.ratings.push({
                employerId: req.user._id,
                rating: rating,
                feedback: feedback || '',
                hireRequestId: hireRequest._id,
                date: new Date()
            });

            // Update statistics
            worker.totalRatings = worker.ratings.length;
            const allRatings = worker.ratings.map(r => r.rating);
            worker.averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
            worker.bestRating = Math.max(...allRatings);
            worker.worstRating = Math.min(...allRatings);

            // Update completed jobs count
            worker.completedJobs = (worker.completedJobs || 0) + 1;

            // Calculate and update rank
            const newRank = calculateRank(worker.ratings, worker.level);
            const rankChanged = newRank !== worker.level;
            worker.level = newRank;

            await worker.save();

            res.json({
                success: true,
                message: 'Job completed and rating submitted',
                hireRequest,
                workerStats: {
                    averageRating: worker.averageRating,
                    totalRatings: worker.totalRatings,
                    level: worker.level,
                    rankChanged,
                    completedJobs: worker.completedJobs
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Job completed and rating submitted',
                hireRequest
            });
        }
    } catch (error) {
        console.error('Error completing job:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing job',
            error: error.message
        });
    }
};
