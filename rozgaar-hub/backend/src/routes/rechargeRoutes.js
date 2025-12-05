import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getOperators,
  mobileRecharge,
  dthRecharge
} from '../controllers/rechargeController.js';

const router = express.Router();

router.get('/operators', getOperators);
router.post('/mobile', protect, mobileRecharge);
router.post('/dth', protect, dthRecharge);

export default router;
