import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import crypto from 'crypto';

// Helper function to generate unique wallet ID
const generateWalletId = (userId) => {
  const hash = crypto.createHash('md5').update(userId.toString()).digest('hex');
  return `RGH${hash.substring(0, 10).toUpperCase()}`;
};

// Helper function to generate QR code data
const generateQRCode = (walletId) => {
  return `rozgaarhub://pay/${walletId}`;
};

// @desc    Get user wallet (create if not exists)
// @route   GET /api/wallet
// @access  Private
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      const walletId = generateWalletId(req.user._id);
      const qrCode = generateQRCode(walletId);

      wallet = await Wallet.create({
        userId: req.user._id,
        walletId,
        qrCode,
        balance: 0
      });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet',
      error: error.message
    });
  }
};

// @desc    Get wallet transactions
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type } = req.query; // Filter by transactionType
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const filter = { walletId: wallet._id };
    if (type) {
      filter.transactionType = type;
    }

    const transactions = await Transaction.find(filter)
      .populate('fromUserId', 'name phone')
      .populate('toUserId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// @desc    Send money to another user
// @route   POST /api/wallet/send
// @access  Private
export const sendMoney = async (req, res) => {
  try {
    const { recipientWalletId, amount, description } = req.body;

    if (!recipientWalletId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid recipient wallet ID and amount'
      });
    }

    // Get sender wallet
    const senderWallet = await Wallet.findOne({ userId: req.user._id });
    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: 'Your wallet not found'
      });
    }

    // Check balance
    if (senderWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Get recipient wallet
    const recipientWallet = await Wallet.findOne({ walletId: recipientWalletId });
    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        message: 'Recipient wallet not found'
      });
    }

    // Prevent self-transfer
    if (senderWallet._id.equals(recipientWallet._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send money to yourself'
      });
    }

    // Get recipient user info
    const recipientUser = await User.findById(recipientWallet.userId);

    // Create debit transaction for sender
    const senderTransaction = await Transaction.create({
      walletId: senderWallet._id,
      userId: req.user._id,
      type: 'debit',
      transactionType: 'send',
      amount,
      description: description || `Sent to ${recipientUser.name}`,
      status: 'completed',
      fromUserId: req.user._id,
      toUserId: recipientWallet.userId,
      paymentMethod: 'wallet'
    });

    // Create credit transaction for recipient
    await Transaction.create({
      walletId: recipientWallet._id,
      userId: recipientWallet.userId,
      type: 'credit',
      transactionType: 'receive',
      amount,
      description: description || `Received from ${req.user.name}`,
      status: 'completed',
      fromUserId: req.user._id,
      toUserId: recipientWallet.userId,
      paymentMethod: 'wallet'
    });

    // Update balances
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    await senderWallet.save();
    await recipientWallet.save();

    res.json({
      success: true,
      message: 'Money sent successfully',
      balance: senderWallet.balance,
      transaction: senderTransaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending money',
      error: error.message
    });
  }
};

// @desc    Add money to wallet (top-up)
// @route   POST /api/wallet/topup
// @access  Private
export const addMoney = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // In a real app, integrate with payment gateway here
    // For now, we'll simulate successful payment
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'credit',
      transactionType: 'topup',
      amount,
      description: 'Added money to wallet',
      status: 'completed',
      paymentMethod: paymentMethod || 'bank'
    });

    wallet.balance += amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Money added successfully',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding money',
      error: error.message
    });
  }
};

// @desc    Withdraw funds
// @route   POST /api/wallet/withdraw
// @access  Private
export const withdraw = async (req, res) => {
  try {
    const { amount, description, bankAccountId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
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

    // Verify bank account if provided
    let bankAccount = null;
    if (bankAccountId) {
      bankAccount = wallet.linkedBankAccounts.id(bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: 'Bank account not found'
        });
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'debit',
      transactionType: 'withdrawal',
      amount,
      description: description || 'Withdrawal to bank',
      status: 'completed',
      paymentMethod: 'bank',
      metadata: bankAccount ? {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber.slice(-4)
      } : {}
    });

    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      message: 'Withdrawal successful',
      balance: wallet.balance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing withdrawal',
      error: error.message
    });
  }
};

// @desc    Link bank account
// @route   POST /api/wallet/bank-account
// @access  Private
export const linkBankAccount = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, isDefault } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all bank account details'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      wallet.linkedBankAccounts.forEach(acc => {
        acc.isDefault = false;
      });
    }

    wallet.linkedBankAccounts.push({
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      isDefault: isDefault || wallet.linkedBankAccounts.length === 0
    });

    await wallet.save();

    res.json({
      success: true,
      message: 'Bank account linked successfully',
      wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error linking bank account',
      error: error.message
    });
  }
};

// @desc    Remove bank account
// @route   DELETE /api/wallet/bank-account/:id
// @access  Private
export const removeBankAccount = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const account = wallet.linkedBankAccounts.id(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    account.deleteOne();
    await wallet.save();

    res.json({
      success: true,
      message: 'Bank account removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing bank account',
      error: error.message
    });
  }
};

// @desc    Search user by wallet ID or phone
// @route   GET /api/wallet/search
// @access  Private
export const searchUser = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    // Search by wallet ID
    let wallet = await Wallet.findOne({ walletId: query }).populate('userId', 'name phone profilePhoto');

    if (!wallet) {
      // Search by phone number
      const user = await User.findOne({ phone: query });
      if (user) {
        wallet = await Wallet.findOne({ userId: user._id }).populate('userId', 'name phone profilePhoto');
      }
    }

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        walletId: wallet.walletId,
        name: wallet.userId.name,
        phone: wallet.userId.phone,
        profilePhoto: wallet.userId.profilePhoto
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching user',
      error: error.message
    });
  }
};
