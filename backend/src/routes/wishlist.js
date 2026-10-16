// ================================================================
// FlashTiket Backend — Wishlist Routes
// ================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlist.controller.js';

const router = Router();

// All wishlist routes require authentication
router.use(requireAuth);

router.get('/', getWishlist);
router.post('/:eventId', addToWishlist);
router.delete('/:eventId', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
