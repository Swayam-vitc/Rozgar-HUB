import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  payElectricityBill,
  payWaterBill,
  payBroadbandBill
} from '../controllers/billController.js';

const router = express.Router();

router.post('/electricity', protect, payElectricityBill);
router.post('/water', protect, payWaterBill);
router.post('/broadband', protect, payBroadbandBill);

export default router;
