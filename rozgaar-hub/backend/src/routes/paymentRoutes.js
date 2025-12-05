import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createPaymentOrder,
    verifyPayment,
    getPaymentHistory,
    getPendingPayments
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create Razorpay order
router.post('/create-order', createPaymentOrder);

// Verify payment
router.post('/verify', verifyPayment);

// Get payment history
router.get('/history', getPaymentHistory);

// Get pending payments
router.get('/pending', getPendingPayments);

export default router;
