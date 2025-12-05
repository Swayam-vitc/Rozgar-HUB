import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  transactionType: {
    type: String,
    enum: [
      'send', 'receive', 'topup', 'withdrawal', 'job_payment', 'refund',
      'mobile_recharge', 'dth_recharge', 'electricity_bill', 'water_bill', 'broadband_bill'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  // For P2P transfers
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['wallet', 'bank', 'upi', 'card'],
    default: 'wallet'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  // For recharges and bill payments
  billDetails: {
    operatorName: String,
    accountNumber: String,
    mobileNumber: String,
    consumerNumber: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
