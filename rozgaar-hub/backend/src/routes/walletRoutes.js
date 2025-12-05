import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getWallet,
  getTransactions,
  sendMoney,
  addMoney,
  withdraw,
  linkBankAccount,
  removeBankAccount,
  searchUser
} from '../controllers/walletController.js';

const router = express.Router();

router.use(protect); // All wallet routes are protected

router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.get('/search', searchUser);
router.post('/send', sendMoney);
router.post('/topup', addMoney);
router.post('/withdraw', withdraw);
router.post('/bank-account', linkBankAccount);
router.delete('/bank-account/:id', removeBankAccount);

export default router;
