// ================================================================
// FlashTiket Backend — Midtrans Payment Gateway Routes
// ================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getClientKey,
  createSnapToken,
  handleNotification,
  getPaymentStatus,
} from '../controllers/payments.controller.js';

const router = Router();

router.get('/client-key', getClientKey);
router.post('/create-snap-token', requireAuth, createSnapToken);
router.post('/notification', handleNotification);
router.get('/status/:orderId', requireAuth, getPaymentStatus);

export default router;
