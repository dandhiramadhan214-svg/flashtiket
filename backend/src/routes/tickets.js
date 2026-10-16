// ================================================================
// FlashTiket Backend — Tickets Routes (Clean MVC Pattern)
// ================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  joinQueue,
  getQueueStatus,
  reserveTicket,
  confirmOrder,
  getMyTickets,
} from '../controllers/tickets.controller.js';

const router = Router();

router.post('/join-queue', requireAuth, joinQueue);
router.get('/queue-status/:eventId', requireAuth, getQueueStatus);
router.post('/reserve', requireAuth, reserveTicket);
router.post('/confirm', requireAuth, confirmOrder);
router.get('/my-tickets', requireAuth, getMyTickets);

export default router;
