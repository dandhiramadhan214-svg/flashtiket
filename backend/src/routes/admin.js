// ================================================================
// FlashTiket Backend — Admin / Dashboard Routes
// ================================================================
import { Router } from 'express';
import {
  getAdminStats,
  getSystemHealth,
  simulateTraffic,
  getAdminOrders,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', getAdminStats);
router.get('/health', getSystemHealth);
router.post('/simulate-traffic', simulateTraffic);
router.get('/orders', getAdminOrders);

export default router;
