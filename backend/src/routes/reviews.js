// ================================================================
// FlashTiket Backend — Reviews Routes
// ================================================================
import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getReviews, createReview } from '../controllers/reviews.controller.js';

const router = Router();

router.get('/:eventId', getReviews);
router.post('/:eventId', optionalAuth, createReview);

export default router;
