import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

// Mock operator data
const OPERATORS = {
  mobile: ['Airtel', 'Jio', 'Vi', 'BSNL'],
  dth: ['Tata Sky', 'Airtel Digital TV', 'Dish TV', 'Sun Direct']
};

// @desc    Get operators list
// @route   GET /api/recharge/operators
// @access  Public
export const getOperators = async (req, res) => {
  try {
    res.json({
      success: true,
      operators: OPERATORS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operators'
    });
  }
};

// @desc    Mobile recharge
// @route   POST /api/recharge/mobile
// @access  Private
export const mobileRecharge = async (req, res) => {
  try {
    const { mobileNumber, operator, amount } = req.body;

    if (!mobileNumber || !operator || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'debit',
      transactionType: 'mobile_recharge',
      amount,
      description: `Mobile recharge for ${mobileNumber}`,
      status: 'completed',
      paymentMethod: 'wallet',
      billDetails: {
        operatorName: operator,
        mobileNumber
      }
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Mobile recharge successful',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing mobile recharge',
      error: error.message
    });
  }
};

// @desc    DTH recharge
// @route   POST /api/recharge/dth
// @access  Private
export const dthRecharge = async (req, res) => {
  try {
    const { subscriberId, operator, amount } = req.body;

    if (!subscriberId || !operator || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'debit',
      transactionType: 'dth_recharge',
      amount,
      description: `DTH recharge for ${subscriberId}`,
      status: 'completed',
      paymentMethod: 'wallet',
      billDetails: {
        operatorName: operator,
        accountNumber: subscriberId
      }
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'DTH recharge successful',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing DTH recharge',
      error: error.message
    });
  }
};
