// ================================================================
// FlashTiket Backend — Wishlist Controller
// ================================================================
import { query } from '../config/database.js';

// ── GET /api/wishlist ──────────────────────────────────────────
// Get current user's wishlisted events
export const getWishlist = async (req, res) => {
  try {
    const result = await query(`
      SELECT w.event_id, w.created_at AS wishlisted_at,
        e.title, e.subtitle, e.venue, e.city, e.event_date, e.event_time,
        e.category, e.price_from, e.currency, e.status, e.image, e.hot
      FROM wishlists w
      JOIN events e ON w.event_id = e.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    const wishlist = result.rows.map(row => ({
      id: row.event_id,
      title: row.title,
      subtitle: row.subtitle,
      venue: row.venue,
      city: row.city,
      date: row.event_date,
      time: row.event_time,
      category: row.category,
      priceFrom: Number(row.price_from),
      currency: row.currency,
      status: row.status,
      image: row.image,
      hot: row.hot,
      wishlistedAt: row.wishlisted_at,
    }));

    res.json({ success: true, data: wishlist, count: wishlist.length });
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

// ── POST /api/wishlist/:eventId ────────────────────────────────
// Add an event to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check event exists
    const eventCheck = await query('SELECT id, title FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event tidak ditemukan.' });
    }

    await query(`
      INSERT INTO wishlists (user_id, event_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, event_id) DO NOTHING
    `, [req.user.id, eventId]);

    res.status(201).json({
      success: true,
      message: `"${eventCheck.rows[0].title}" ditambahkan ke wishlist.`,
    });
  } catch (err) {
    console.error('Add wishlist error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

// ── DELETE /api/wishlist/:eventId ──────────────────────────────
// Remove an event from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await query(`
      DELETE FROM wishlists 
      WHERE user_id = $1 AND event_id = $2
      RETURNING event_id
    `, [req.user.id, eventId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Event tidak ada di wishlist.' });
    }

    res.json({ success: true, message: 'Dihapus dari wishlist.' });
  } catch (err) {
    console.error('Remove wishlist error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

// ── DELETE /api/wishlist ───────────────────────────────────────
// Clear entire wishlist
export const clearWishlist = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM wishlists WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: `${result.rowCount} event dihapus dari wishlist.`,
      deletedCount: result.rowCount,
    });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};
