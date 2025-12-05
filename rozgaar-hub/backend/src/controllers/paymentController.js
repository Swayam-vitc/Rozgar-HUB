import HireRequest from '../models/HireRequest.js';
import User from '../models/User.js';
import { createOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import crypto from 'crypto';

// @desc    Create Razorpay order for payment
// @route   POST /api/payments/create-order
// @access  Private (Employer)
export const createPaymentOrder = async (req, res) => {
    try {
        const { hireRequestId } = req.body;
        const employerId = req.user._id;

        console.log('Creating payment order for hire request:', hireRequestId);

        // Find hire request
        const hireRequest = await HireRequest.findOne({
            _id: hireRequestId,
            employerId
        }).populate('workerId', 'name email');

        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        if (hireRequest.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only pay for accepted hire requests'
            });
        }

        if (hireRequest.paid) {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed for this request'
            });
        }

        // Create Razorpay order
        const amount = hireRequest.salaryAmount;
        const orderResult = await createOrder(amount, employerId);

        if (!orderResult.success) {
            // If Razorpay fails (invalid keys), use simulation mode
            console.log('Razorpay failed, using simulation mode');
            const simOrder = {
                id: `order_sim_${Date.now()}`,
                entity: 'order',
                amount: amount * 100,
                currency: 'INR',
                receipt: `receipt_sim_${Date.now()}`,
                status: 'created'
            };

            // Store simulated order ID
            hireRequest.razorpayOrderId = simOrder.id;
            await hireRequest.save();

            return res.json({
                success: true,
                order: simOrder,
                simulationMode: true,
                hireRequest: {
                    id: hireRequest._id,
                    workerName: hireRequest.workerId.name,
                    amount: hireRequest.salaryAmount,
                    jobTitle: hireRequest.jobTitle
                }
            });
        }

        // Store order ID in hire request
        hireRequest.razorpayOrderId = orderResult.order.id;
        await hireRequest.save();

        res.json({
            success: true,
            order: orderResult.order,
            hireRequest: {
                id: hireRequest._id,
                workerName: hireRequest.workerId.name,
                amount: hireRequest.salaryAmount,
                jobTitle: hireRequest.jobTitle
            }
        });
    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment order',
            error: error.message
        });
    }
};

// @desc    Verify payment and update hire request
// @route   POST /api/payments/verify
// @access  Private (Employer)
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            hireRequestId,
            simulationMode
        } = req.body;

        console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, simulationMode });

        // Find hire request first
        const hireRequest = await HireRequest.findOne({
            _id: hireRequestId,
            employerId: req.user._id,
            razorpayOrderId: razorpay_order_id
        }).populate('workerId', 'name email totalEarnings');

        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        // If simulation mode, skip signature verification
        if (!simulationMode) {
            // Verify signature for real Razorpay payments
            const isValid = verifyPaymentSignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment signature'
                });
            }
        } else {
            console.log('Simulation mode - skipping signature verification');
        }

        // Update hire request
        hireRequest.paid = true;
        hireRequest.razorpayPaymentId = razorpay_payment_id;
        hireRequest.razorpaySignature = razorpay_signature || 'simulated';
        hireRequest.paidAt = new Date();
        await hireRequest.save();

        // Update worker earnings
        const worker = hireRequest.workerId;
        worker.totalEarnings = (worker.totalEarnings || 0) + hireRequest.salaryAmount;
        await worker.save();

        console.log('Payment verified and recorded successfully');

        res.json({
            success: true,
            message: 'Payment verified successfully',
            hireRequest: {
                id: hireRequest._id,
                paid: true,
                amount: hireRequest.salaryAmount,
                paidAt: hireRequest.paidAt
            }
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        let query = {};
        if (userRole === 'employer') {
            query.employerId = userId;
        } else {
            query.workerId = userId;
        }

        // Add payment filter
        query.paid = true;

        const payments = await HireRequest.find(query)
            .populate('workerId', 'name email profilePhoto')
            .populate('employerId', 'name email profilePhoto')
            .sort({ paidAt: -1 })
            .select('jobTitle salaryAmount salaryType paid paidAt razorpayPaymentId createdAt');

        const formattedPayments = payments.map(payment => ({
            id: payment._id,
            jobTitle: payment.jobTitle,
            amount: payment.salaryAmount,
            salaryType: payment.salaryType,
            paidAt: payment.paidAt,
            transactionId: payment.razorpayPaymentId,
            worker: userRole === 'employer' ? {
                name: payment.workerId.name,
                profilePhoto: payment.workerId.profilePhoto
            } : null,
            employer: userRole === 'worker' ? {
                name: payment.employerId.name,
                profilePhoto: payment.employerId.profilePhoto
            } : null
        }));

        res.json({
            success: true,
            payments: formattedPayments,
            totalAmount: formattedPayments.reduce((sum, p) => sum + p.amount, 0)
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history',
            error: error.message
        });
    }
};

// @desc    Get pending payments
// @route   GET /api/payments/pending
// @access  Private
export const getPendingPayments = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        let query = {
            status: 'accepted',
            paid: false,
            completed: false
        };

        if (userRole === 'employer') {
            query.employerId = userId;
        } else {
            query.workerId = userId;
        }

        const pendingPayments = await HireRequest.find(query)
            .populate('workerId', 'name email profilePhoto')
            .populate('employerId', 'name email profilePhoto')
            .sort({ createdAt: -1 })
            .select('jobTitle salaryAmount salaryType status paid createdAt');

        const formattedPayments = pendingPayments.map(payment => ({
            id: payment._id,
            jobTitle: payment.jobTitle,
            amount: payment.salaryAmount,
            salaryType: payment.salaryType,
            createdAt: payment.createdAt,
            worker: userRole === 'employer' ? {
                name: payment.workerId.name,
                profilePhoto: payment.workerId.profilePhoto
            } : null,
            employer: userRole === 'worker' ? {
                name: payment.employerId.name,
                profilePhoto: payment.employerId.profilePhoto
            } : null
        }));

        res.json({
            success: true,
            pendingPayments: formattedPayments,
            totalPending: formattedPayments.reduce((sum, p) => sum + p.amount, 0)
        });
    } catch (error) {
        console.error('Error fetching pending payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending payments',
            error: error.message
        });
    }
};
