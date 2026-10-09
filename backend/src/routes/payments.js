// ================================================================
// FlashTiket Backend — Midtrans Payment Gateway Routes
// ================================================================
import { Router } from 'express';
import midtransClient from 'midtrans-client';
import { query, getClient } from '../config/database.js';
import redis, { releaseLock } from '../config/redis.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// ── Midtrans Snap Client (Sandbox) ──────────────────────────────
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DEMO_KEY_REPLACE_ME',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-DEMO_KEY_REPLACE_ME',
});

// ── GET /api/payments/client-key ────────────────────────────────
// Returns the Midtrans client key for frontend Snap.js
router.get('/client-key', (req, res) => {
  res.json({
    success: true,
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-DEMO_KEY_REPLACE_ME',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  });
});

// ── POST /api/payments/create-snap-token ────────────────────────
// Create a Midtrans Snap token for the given order
router.post('/create-snap-token', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId diperlukan.' });
    }

    // Get order from database
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan.' });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Order sudah berstatus: ${order.status}` });
    }

    // Check if order has expired
    if (new Date(order.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Reservasi sudah kadaluarsa.' });
    }

    // Get user details
    const userResult = await query('SELECT name, email, phone FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    // Get event details
    const eventResult = await query('SELECT title FROM events WHERE id = $1', [order.event_id]);
    const event = eventResult.rows[0];

    // Build unique Midtrans order_id (Midtrans requires unique IDs)
    const midtransOrderId = `FT-${orderId}-${Date.now()}`;

    // Calculate individual prices
    const unitPrice = Math.round(order.total_price / order.quantity);
    const serviceFee = Math.round(unitPrice * 0.05);  // 5% service fee
    const tax = Math.round((order.total_price + (serviceFee * order.quantity)) * 0.11); // 11% PPN

    const grossAmount = order.total_price + (serviceFee * order.quantity) + tax;

    // Build Snap transaction parameter
    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: `ticket-${order.category}`,
          price: unitPrice,
          quantity: order.quantity,
          name: `${event?.title || 'Event'} — ${order.category.toUpperCase()}`,
          category: order.category,
        },
        {
          id: 'service-fee',
          price: serviceFee,
          quantity: order.quantity,
          name: 'Biaya Layanan FlashTiket',
          category: 'fee',
        },
        {
          id: 'tax-ppn',
          price: tax,
          quantity: 1,
          name: 'Pajak PPN 11%',
          category: 'tax',
        },
      ],
      customer_details: {
        first_name: user?.name || 'User',
        email: user?.email || '',
        phone: user?.phone || '',
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment=success&order=${orderId}`,
        error: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment=error&order=${orderId}`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment=pending&order=${orderId}`,
      },
      expiry: {
        unit: 'minutes',
        duration: Math.max(1, Math.floor((new Date(order.expires_at) - new Date()) / 60000)),
      },
    };

    // Create Snap token
    const snapResponse = await snap.createTransaction(parameter);

    // Store Midtrans order ID mapping in Redis for webhook lookup
    await redis.set(
      `midtrans_map:${midtransOrderId}`,
      JSON.stringify({ orderId, userId: req.user.id }),
      'EX',
      3600 // 1 hour TTL
    );

    // Also store in the order for reference
    await query(
      'UPDATE orders SET metadata = $1 WHERE id = $2',
      [JSON.stringify({ midtrans_order_id: midtransOrderId, snap_token: snapResponse.token }), orderId]
    );

    res.json({
      success: true,
      data: {
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        midtransOrderId,
        grossAmount,
      },
    });
  } catch (err) {
    console.error('Create Snap token error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat token pembayaran. Pastikan konfigurasi Midtrans sudah benar.',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
});

// ── POST /api/payments/notification ─────────────────────────────
// Midtrans Webhook — receives payment status updates
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;
    console.log('📩 Midtrans webhook received:', JSON.stringify(notification, null, 2));

    // Verify signature
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notification;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DEMO_KEY_REPLACE_ME';
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.warn('⚠️ Invalid Midtrans signature!');
      return res.status(403).json({ success: false, error: 'Invalid signature.' });
    }

    // Look up our internal order from the Midtrans order ID
    const mappingRaw = await redis.get(`midtrans_map:${order_id}`);
    if (!mappingRaw) {
      console.warn(`⚠️ No mapping found for Midtrans order: ${order_id}`);
      return res.status(200).json({ success: true, message: 'Mapping not found, skipped.' });
    }

    const { orderId, userId } = JSON.parse(mappingRaw);

    // Handle different transaction statuses
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Payment successful — confirm the order
      if (fraud_status === 'accept' || !fraud_status) {
        await handlePaymentSuccess(orderId, userId, notification);
        console.log(`✅ Payment SUCCESS for order ${orderId}`);
      }
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      // Payment failed — rollback
      await handlePaymentFailure(orderId, userId, notification);
      console.log(`❌ Payment FAILED for order ${orderId} — reason: ${transaction_status}`);
    } else if (transaction_status === 'pending') {
      console.log(`⏳ Payment PENDING for order ${orderId}`);
      await query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['payment_pending', orderId]
      );
    }

    // Always respond 200 to Midtrans
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ success: true, message: 'Error handled gracefully.' });
  }
});

// ── GET /api/payments/status/:orderId ───────────────────────────
// Check payment status for an order (frontend polling)
router.get('/status/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderResult = await query(
      'SELECT id, status, confirmed_at, metadata FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan.' });
    }

    const order = orderResult.rows[0];

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        confirmedAt: order.confirmed_at,
        isPaid: order.status === 'confirmed',
      },
    });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ── Helper: Process Successful Payment ──────────────────────────
async function handlePaymentSuccess(orderId, userId, notification) {
  const pgClient = await getClient();
  try {
    await pgClient.query('BEGIN');

    // Lock and update order
    const orderResult = await pgClient.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return;
    }

    const order = orderResult.rows[0];

    if (order.status === 'confirmed') {
      // Already confirmed (idempotent)
      await pgClient.query('ROLLBACK');
      return;
    }

    // Update order status
    await pgClient.query(
      `UPDATE orders SET status = 'confirmed', confirmed_at = NOW(), 
       metadata = metadata::jsonb || $1::jsonb WHERE id = $2`,
      [JSON.stringify({
        payment_type: notification.payment_type,
        transaction_id: notification.transaction_id,
        settlement_time: notification.settlement_time,
      }), orderId]
    );

    // Sync stock in PostgreSQL
    await pgClient.query(
      'UPDATE event_stock SET available = available - $1 WHERE event_id = $2 AND category = $3',
      [order.quantity, order.event_id, order.category]
    );

    // Get user info
    const userResult = await pgClient.query('SELECT name, nik FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Issue e-tickets
    for (let i = 0; i < order.quantity; i++) {
      const ticketCode = `FT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const qrData = JSON.stringify({
        code: ticketCode,
        event: order.event_id,
        category: order.category,
        holder: user?.name,
        issuer: 'FlashTiket',
        txnId: notification.transaction_id,
      });

      await pgClient.query(`
        INSERT INTO tickets (order_id, user_id, event_id, category, ticket_code, qr_data, holder_name, holder_nik)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [orderId, userId, order.event_id, order.category, ticketCode, qrData, user?.name, user?.nik]);
    }

    await pgClient.query('COMMIT');

    // Clean up Redis
    await releaseLock(order.event_id, order.category, userId);
    await redis.del(`order_timer:${orderId}`);
  } catch (err) {
    await pgClient.query('ROLLBACK');
    console.error('handlePaymentSuccess error:', err);
  } finally {
    pgClient.release();
  }
}

// ── Helper: Process Failed Payment ──────────────────────────────
async function handlePaymentFailure(orderId, userId, notification) {
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) return;

    const order = orderResult.rows[0];

    // Restore stock in Redis
    const stockKey = `stock:${order.event_id}:${order.category}`;
    await redis.incrby(stockKey, order.quantity);

    // Update order status
    await query(
      `UPDATE orders SET status = 'failed', metadata = metadata::jsonb || $1::jsonb WHERE id = $2`,
      [JSON.stringify({ failure_reason: notification.transaction_status }), orderId]
    );

    // Release lock
    await releaseLock(order.event_id, order.category, userId);
    await redis.del(`order_timer:${orderId}`);
  } catch (err) {
    console.error('handlePaymentFailure error:', err);
  }
}

export default router;
