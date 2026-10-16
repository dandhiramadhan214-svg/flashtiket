// ================================================================
// FlashTiket Backend — Events Controller
// ================================================================
import { query } from '../config/database.js';
import redis from '../config/redis.js';

/**
 * GET /api/events
 * List all events with optional category & search filters
 */
export const getEvents = async (req, res) => {
  try {
    const { category, search, status } = req.query;

    let sql = `
      SELECT e.*, 
        json_agg(json_build_object(
          'category', es.category,
          'total', es.total,
          'available', es.available,
          'price', es.price
        )) AS stock
      FROM events e
      LEFT JOIN event_stock es ON e.id = es.event_id
    `;
    const conditions = [];
    const params = [];

    if (category && category !== 'Semua') {
      params.push(category);
      conditions.push(`e.category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(e.title ILIKE $${idx} OR e.venue ILIKE $${idx} OR e.city ILIKE $${idx})`);
    }

    if (status) {
      params.push(status);
      conditions.push(`e.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY e.id ORDER BY e.hot DESC, e.created_at DESC';

    const result = await query(sql, params);

    // Merge Redis live stock data
    const events = await Promise.all(result.rows.map(async (evt) => {
      const liveStock = {};
      const stockTiers = evt.stock?.filter(s => s.category) || [];
      for (const tier of stockTiers) {
        const redisVal = await redis.get(`stock:${evt.id}:${tier.category}`);
        liveStock[tier.category] = {
          total: tier.total,
          available: redisVal !== null ? parseInt(redisVal) : tier.available,
          price: tier.price,
        };
      }

      return {
        id: evt.id,
        title: evt.title,
        subtitle: evt.subtitle,
        venue: evt.venue,
        city: evt.city,
        date: evt.event_date,
        time: evt.event_time,
        category: evt.category,
        priceFrom: Number(evt.price_from),
        currency: evt.currency,
        status: evt.status,
        image: evt.image,
        hot: evt.hot,
        stock: liveStock,
      };
    }));

    res.json({ success: true, data: events, count: events.length });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

/**
 * GET /api/events/:id
 * Get single event details with live Redis stock
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT e.*, 
        json_agg(json_build_object(
          'category', es.category,
          'total', es.total,
          'available', es.available,
          'price', es.price
        )) AS stock
      FROM events e
      LEFT JOIN event_stock es ON e.id = es.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event tidak ditemukan.' });
    }

    const evt = result.rows[0];

    // Get live stock from Redis
    const liveStock = {};
    const stockTiers = evt.stock?.filter(s => s.category) || [];
    for (const tier of stockTiers) {
      const redisVal = await redis.get(`stock:${evt.id}:${tier.category}`);
      liveStock[tier.category] = {
        total: tier.total,
        available: redisVal !== null ? parseInt(redisVal) : tier.available,
        price: tier.price,
      };
    }

    res.json({
      success: true,
      data: {
        id: evt.id,
        title: evt.title,
        subtitle: evt.subtitle,
        venue: evt.venue,
        city: evt.city,
        date: evt.event_date,
        time: evt.event_time,
        category: evt.category,
        priceFrom: Number(evt.price_from),
        currency: evt.currency,
        status: evt.status,
        image: evt.image,
        hot: evt.hot,
        stock: liveStock,
      },
    });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};
