// ================================================================
// FlashTiket Backend — Reviews Controller
// ================================================================
import { query } from '../config/database.js';

// ── GET /api/reviews/:eventId ──────────────────────────────────
// Get reviews for an event (public)
export const getReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await query(`
      SELECT id, user_name, user_avatar, rating, comment, 
        to_char(created_at, 'DD Mon YYYY') as date
      FROM reviews
      WHERE event_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [eventId]);

    // Calculate average
    const avgResult = await query(
      'SELECT AVG(rating)::numeric(3,1) as avg_rating, COUNT(*) as total FROM reviews WHERE event_id = $1',
      [eventId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        averageRating: avgResult.rows[0]?.avg_rating || null,
        totalReviews: parseInt(avgResult.rows[0]?.total || '0'),
      },
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

// ── POST /api/reviews/:eventId ─────────────────────────────────
// Post a review (requires auth / optionalAuth)
export const createReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating harus 1-5.' });
    }

    // Check event exists
    const eventCheck = await query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event tidak ditemukan.' });
    }

    let userName = 'Penonton FlashTiket';
    let userAvatar = 'FT';
    let userId = null;

    if (req.user) {
      userId = req.user.id;
      userName = req.user.name;
      userAvatar = req.user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'FT';
    }

    const result = await query(`
      INSERT INTO reviews (user_id, event_id, user_name, user_avatar, rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_name, user_avatar, rating, comment, to_char(created_at, 'DD Mon YYYY') as date
    `, [userId, eventId, userName, userAvatar, rating, comment || '']);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};
