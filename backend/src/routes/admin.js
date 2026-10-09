// ================================================================
// FlashTiket Backend — Admin / Dashboard Routes
// ================================================================
import { Router } from 'express';
import { query } from '../config/database.js';
import redis from '../config/redis.js';

const router = Router();

// ── GET /api/admin/stats ───────────────────────────────────────
// Live dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total visitors from Redis counter
    const visitors = await redis.get('stats:active_visitors') || '0';

    // Count orders by status
    const orderStats = await query(`
      SELECT status, COUNT(*) as count, SUM(total_price) as revenue
      FROM orders
      GROUP BY status
    `);

    // Total events
    const eventCount = await query('SELECT COUNT(*) as count FROM events');

    // Total users
    const userCount = await query('SELECT COUNT(*) as count FROM users');

    // Total tickets issued
    const ticketCount = await query('SELECT COUNT(*) as count FROM tickets');

    // Redis info
    const redisInfo = await redis.info('memory');
    const memoryMatch = redisInfo.match(/used_memory_human:(.+)/);
    const redisMemory = memoryMatch ? memoryMatch[1].trim() : 'N/A';

    // Queue sizes per event
    const eventKeys = await redis.keys('queue:*');
    const queueSizes = {};
    for (const key of eventKeys) {
      const eventId = key.replace('queue:', '');
      queueSizes[eventId] = await redis.zcard(key);
    }

    const totalWaiting = Object.values(queueSizes).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        activeVisitors: parseInt(visitors),
        totalWaiting,
        totalEvents: parseInt(eventCount.rows[0].count),
        totalUsers: parseInt(userCount.rows[0].count),
        totalTicketsIssued: parseInt(ticketCount.rows[0].count),
        ordersByStatus: orderStats.rows.reduce((acc, row) => {
          acc[row.status] = { count: parseInt(row.count), revenue: Number(row.revenue || 0) };
          return acc;
        }, {}),
        queueSizes,
        redis: { memory: redisMemory },
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ── GET /api/admin/health ──────────────────────────────────────
// System health check
router.get('/health', async (req, res) => {
  const health = {
    server: { status: 'healthy', uptime: process.uptime() },
    postgres: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  try {
    await query('SELECT 1');
    health.postgres.status = 'healthy';
  } catch {
    health.postgres.status = 'unhealthy';
  }

  try {
    await redis.ping();
    health.redis.status = 'healthy';
  } catch {
    health.redis.status = 'unhealthy';
  }

  const allHealthy = health.postgres.status === 'healthy' && health.redis.status === 'healthy';
  res.status(allHealthy ? 200 : 503).json({ success: allHealthy, data: health });
});

// ── POST /api/admin/simulate-traffic ───────────────────────────
// Simulate traffic surge for testing
router.post('/simulate-traffic', async (req, res) => {
  try {
    const surge = parseInt(req.body.count || '10000');
    const currentVisitors = parseInt(await redis.get('stats:active_visitors') || '0');
    await redis.set('stats:active_visitors', currentVisitors + surge);

    res.json({
      success: true,
      message: `Simulated ${surge.toLocaleString()} additional visitors.`,
      data: { newTotal: currentVisitors + surge },
    });
  } catch (err) {
    console.error('Simulate traffic error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ── GET /api/admin/orders ──────────────────────────────────────
// List recent ticket orders / transactions
router.get('/orders', async (req, res) => {
  try {
    const ordersResult = await query(`
      SELECT o.id, o.user_id, o.event_id, o.category, o.quantity, o.total_amount, o.status, o.payment_method, o.created_at,
             u.name as user_name, u.email as user_email,
             e.title as event_title
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `);
    res.json({
      success: true,
      data: ordersResult.rows || [],
    });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

export default router;
