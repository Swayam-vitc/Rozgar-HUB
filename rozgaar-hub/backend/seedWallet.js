import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Wallet from './src/models/Wallet.js';
import Transaction from './src/models/Transaction.js';
import crypto from 'crypto';

dotenv.config();

const generateWalletId = (userId) => {
  const hash = crypto.createHash('md5').update(userId.toString()).digest('hex');
  return `RGH${hash.substring(0, 10).toUpperCase()}`;
};

const generateQRCode = (walletId) => {
  return `rozgaarhub://pay/${walletId}`;
};

const seedWallet = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find first user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please register a user first.');
      process.exit(1);
    }

    console.log(`Seeding wallet for user: ${user.name} (${user._id})`);

    // Create or reset wallet
    await Wallet.deleteMany({ userId: user._id });
    await Transaction.deleteMany({ userId: user._id });

    const walletId = generateWalletId(user._id);
    const qrCode = generateQRCode(walletId);

    const wallet = await Wallet.create({
      userId: user._id,
      walletId,
      qrCode,
      balance: 5000,
      currency: 'INR',
      linkedBankAccounts: [
        {
          accountHolderName: user.name,
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          isDefault: true
        }
      ]
    });

    // Create sample transactions
    const transactions = [
      {
        walletId: wallet._id,
        userId: user._id,
        type: 'credit',
        transactionType: 'topup',
        amount: 5000,
        description: 'Added money from bank',
        status: 'completed',
        paymentMethod: 'bank',
        createdAt: new Date(Date.now() - 86400000 * 5)
      },
      {
        walletId: wallet._id,
        userId: user._id,
        type: 'credit',
        transactionType: 'job_payment',
        amount: 2000,
        description: 'Payment for Plumbing Job',
        status: 'completed',
        paymentMethod: 'wallet',
        createdAt: new Date(Date.now() - 86400000 * 3)
      },
      {
        walletId: wallet._id,
        userId: user._id,
        type: 'debit',
        transactionType: 'send',
        amount: 500,
        description: 'Sent to Friend',
        status: 'completed',
        paymentMethod: 'wallet',
        createdAt: new Date(Date.now() - 86400000 * 2)
      },
      {
        walletId: wallet._id,
        userId: user._id,
        type: 'credit',
        transactionType: 'receive',
        amount: 1000,
        description: 'Received from Client',
        status: 'completed',
        paymentMethod: 'wallet',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        walletId: wallet._id,
        userId: user._id,
        type: 'debit',
        transactionType: 'withdrawal',
        amount: 1500,
        description: 'Withdrawal to bank',
        status: 'completed',
        paymentMethod: 'bank',
        createdAt: new Date()
      }
    ];

    await Transaction.insertMany(transactions);

    console.log('✅ Wallet seeded successfully!');
    console.log('📱 Wallet ID:', wallet.walletId);
    console.log('💰 Balance:', wallet.balance);
    console.log('🏦 Bank Accounts:', wallet.linkedBankAccounts.length);
    console.log('📊 Transactions:', transactions.length);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding wallet:', error);
    process.exit(1);
  }
};

seedWallet();
