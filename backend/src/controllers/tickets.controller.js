// ================================================================
// FlashTiket Backend — Tickets & Queue Controller
// ================================================================
import { query, getClient } from '../config/database.js';
import redis, { decrementStock, acquireLock, releaseLock } from '../config/redis.js';

const LOCK_TTL = parseInt(process.env.LOCK_TTL_SECONDS || '900'); // 15 minutes

/**
 * POST /api/tickets/join-queue
 * User joins the virtual waiting room for an event
 */
export const joinQueue = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId diperlukan.' });
    }

    // Check event exists and is on-sale
    const eventResult = await query('SELECT id, status, title FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event tidak ditemukan.' });
    }
    if (eventResult.rows[0].status !== 'on-sale') {
      return res.status(400).json({ success: false, error: 'Event tidak sedang dijual.' });
    }

    // Add user to Redis sorted set (virtual queue)
    const score = Date.now();
    const member = `${req.user.id}`;
    await redis.zadd(`queue:${eventId}`, score, member);

    // Get user's position in queue
    const rank = await redis.zrank(`queue:${eventId}`, member);
    const totalWaiting = await redis.zcard(`queue:${eventId}`);

    // Log to database
    await query(`
      INSERT INTO queue_log (user_id, event_id, action, position, metadata)
      VALUES ($1, $2, 'join', $3, $4)
    `, [req.user.id, eventId, rank, JSON.stringify({ totalWaiting, timestamp: score })]);

    res.json({
      success: true,
      data: {
        position: rank + 1,
        totalWaiting,
        estimatedWaitMinutes: Math.ceil((rank + 1) / 120),
        event: eventResult.rows[0].title,
      },
    });
  } catch (err) {
    console.error('Join queue error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

/**
 * GET /api/tickets/queue-status/:eventId
 * Check queue position
 */
export const getQueueStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const member = `${req.user.id}`;

    const rank = await redis.zrank(`queue:${eventId}`, member);
    if (rank === null) {
      return res.json({ success: true, data: { inQueue: false } });
    }

    const totalWaiting = await redis.zcard(`queue:${eventId}`);

    res.json({
      success: true,
      data: {
        inQueue: true,
        position: rank + 1,
        totalWaiting,
        estimatedWaitMinutes: Math.ceil((rank + 1) / 120),
      },
    });
  } catch (err) {
    console.error('Queue status error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

/**
 * POST /api/tickets/reserve
 * Reserve (lock) tickets — the core war tiket endpoint
 */
export const reserveTicket = async (req, res) => {
  try {
    const { eventId, category, quantity = 1 } = req.body;

    if (!eventId || !category) {
      return res.status(400).json({ success: false, error: 'eventId dan category diperlukan.' });
    }
    if (quantity < 1 || quantity > 4) {
      return res.status(400).json({ success: false, error: 'Quantity harus 1-4 tiket.' });
    }

    // 1. Acquire distributed lock (Lua script — atomic)
    const lockResult = await acquireLock(eventId, category, req.user.id, LOCK_TTL);
    if (lockResult === 0) {
      return res.status(409).json({
        success: false,
        error: 'Anda sudah memiliki reservasi aktif untuk kategori ini.',
      });
    }

    // 2. Atomic stock decrement (Lua script — prevents overselling)
    const stockResult = await decrementStock(eventId, category, quantity);
    if (stockResult === -1) {
      await releaseLock(eventId, category, req.user.id);
      return res.status(404).json({ success: false, error: 'Stock data tidak ditemukan.' });
    }
    if (stockResult === 0) {
      await releaseLock(eventId, category, req.user.id);
      return res.status(409).json({ success: false, error: 'Maaf, tiket sudah habis! (Sold Out)' });
    }

    // 3. Get price from DB
    const priceResult = await query(
      'SELECT price FROM event_stock WHERE event_id = $1 AND category = $2',
      [eventId, category]
    );
    const unitPrice = priceResult.rows[0]?.price || 0;
    const totalPrice = unitPrice * quantity;

    // 4. Create order in PostgreSQL
    const expiresAt = new Date(Date.now() + LOCK_TTL * 1000);
    const orderResult = await query(`
      INSERT INTO orders (user_id, event_id, category, quantity, total_price, status, lock_key, locked_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW(), $7)
      RETURNING id
    `, [
      req.user.id, eventId, category, quantity, totalPrice,
      `lock:${eventId}:${category}:${req.user.id}`,
      expiresAt,
    ]);

    // 5. Set auto-expiry timer in Redis
    await redis.set(
      `order_timer:${orderResult.rows[0].id}`,
      JSON.stringify({ eventId, category, quantity, userId: req.user.id }),
      'EX',
      LOCK_TTL
    );

    // Remove user from queue
    await redis.zrem(`queue:${eventId}`, `${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        orderId: orderResult.rows[0].id,
        eventId,
        category,
        quantity,
        unitPrice,
        totalPrice,
        expiresAt: expiresAt.toISOString(),
        ttlSeconds: LOCK_TTL,
      },
    });
  } catch (err) {
    console.error('Reserve error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};

/**
 * POST /api/tickets/confirm
 * Confirm payment and issue e-tickets
 */
export const confirmOrder = async (req, res) => {
  const pgClient = await getClient();

  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId diperlukan.' });
    }

    await pgClient.query('BEGIN');

    // Lock the order row for update
    const orderResult = await pgClient.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan.' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      await pgClient.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Order sudah berstatus: ${order.status}` });
    }

    if (new Date(order.expires_at) < new Date()) {
      await pgClient.query('ROLLBACK');
      return res.status(410).json({ success: false, error: 'Reservasi sudah kadaluarsa.' });
    }

    // Update order to confirmed
    await pgClient.query(
      'UPDATE orders SET status = $1, confirmed_at = NOW() WHERE id = $2',
      ['confirmed', orderId]
    );

    // Update PostgreSQL stock to match Redis
    await pgClient.query(
      'UPDATE event_stock SET available = available - $1 WHERE event_id = $2 AND category = $3',
      [order.quantity, order.event_id, order.category]
    );

    // Get user details for ticket
    const userResult = await pgClient.query(
      'SELECT name, nik FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];

    // Issue e-tickets
    const tickets = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticketCode = `FT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const qrData = JSON.stringify({
        code: ticketCode,
        event: order.event_id,
        category: order.category,
        holder: user.name,
        issuer: 'FlashTiket',
        url: `https://flashtiket.id/verify/${ticketCode}`,
      });

      const ticketResult = await pgClient.query(`
        INSERT INTO tickets (order_id, user_id, event_id, category, ticket_code, qr_data, holder_name, holder_nik)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, ticket_code, qr_data, issued_at
      `, [orderId, req.user.id, order.event_id, order.category, ticketCode, qrData, user.name, user.nik]);

      tickets.push(ticketResult.rows[0]);
    }

    await pgClient.query('COMMIT');

    // Cleanup Redis
    await releaseLock(order.event_id, order.category, req.user.id);
    await redis.del(`order_timer:${orderId}`);

    res.json({
      success: true,
      data: {
        orderId,
        status: 'confirmed',
        tickets: tickets.map(t => ({
          id: t.id,
          ticketCode: t.ticket_code,
          qrData: t.qr_data,
          issuedAt: t.issued_at,
        })),
      },
    });
  } catch (err) {
    await pgClient.query('ROLLBACK');
    console.error('Confirm error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  } finally {
    pgClient.release();
  }
};

/**
 * GET /api/tickets/my-tickets
 * Get all user's confirmed tickets
 */
export const getMyTickets = async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.ticket_code, t.qr_data, t.category, t.holder_name, t.issued_at,
        e.title AS event_title, e.venue, e.city, e.event_date, e.event_time, e.image,
        o.total_price, o.quantity
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.user_id = $1
      ORDER BY t.issued_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('My tickets error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
};
