import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

// @desc    Pay electricity bill
// @route   POST /api/bills/electricity
// @access  Private
export const payElectricityBill = async (req, res) => {
  try {
    const { consumerNumber, provider, amount } = req.body;

    if (!consumerNumber || !provider || !amount || amount <= 0) {
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
      transactionType: 'electricity_bill',
      amount,
      description: `Electricity bill payment - ${provider}`,
      status: 'completed',
      paymentMethod: 'wallet',
      billDetails: {
        operatorName: provider,
        consumerNumber
      }
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Electricity bill paid successfully',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error paying electricity bill',
      error: error.message
    });
  }
};

// @desc    Pay water bill
// @route   POST /api/bills/water
// @access  Private
export const payWaterBill = async (req, res) => {
  try {
    const { consumerNumber, provider, amount } = req.body;

    if (!consumerNumber || !provider || !amount || amount <= 0) {
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
      transactionType: 'water_bill',
      amount,
      description: `Water bill payment - ${provider}`,
      status: 'completed',
      paymentMethod: 'wallet',
      billDetails: {
        operatorName: provider,
        consumerNumber
      }
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Water bill paid successfully',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error paying water bill',
      error: error.message
    });
  }
};

// @desc    Pay broadband bill
// @route   POST /api/bills/broadband
// @access  Private
export const payBroadbandBill = async (req, res) => {
  try {
    const { accountNumber, provider, amount } = req.body;

    if (!accountNumber || !provider || !amount || amount <= 0) {
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
      transactionType: 'broadband_bill',
      amount,
      description: `Broadband bill payment - ${provider}`,
      status: 'completed',
      paymentMethod: 'wallet',
      billDetails: {
        operatorName: provider,
        accountNumber
      }
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Broadband bill paid successfully',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error paying broadband bill',
      error: error.message
    });
  }
};
