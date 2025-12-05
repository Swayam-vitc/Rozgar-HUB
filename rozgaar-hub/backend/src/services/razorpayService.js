import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay (will use test keys from env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Create order for adding money
export const createOrder = async (amount, userId) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Simulate payment for testing (when no real keys)
export const simulatePayment = async (amount) => {
  return {
    success: true,
    orderId: `order_sim_${Date.now()}`,
    paymentId: `pay_sim_${Date.now()}`,
    signature: 'simulated_signature'
  };
};
