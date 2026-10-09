// ================================================================
// FlashTiket Backend — Database Schema Initialization
// ================================================================
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../config/database.js';

const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  nik           VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar_text   VARCHAR(5) DEFAULT 'U',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id          VARCHAR(100) PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  subtitle    VARCHAR(500),
  venue       VARCHAR(500) NOT NULL,
  city        VARCHAR(255) NOT NULL,
  event_date  VARCHAR(50) NOT NULL,
  event_time  VARCHAR(50) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  price_from  BIGINT NOT NULL DEFAULT 0,
  currency    VARCHAR(10) NOT NULL DEFAULT 'IDR',
  status      VARCHAR(50) NOT NULL DEFAULT 'on-sale',
  image       VARCHAR(500),
  hot         BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENT STOCK (per category tier)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_stock (
  id          SERIAL PRIMARY KEY,
  event_id    VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category    VARCHAR(50) NOT NULL,   -- 'vip', 'cat1', 'cat2'
  total       INT NOT NULL DEFAULT 0,
  available   INT NOT NULL DEFAULT 0,
  price       BIGINT NOT NULL DEFAULT 0,
  UNIQUE(event_id, category)
);

CREATE INDEX IF NOT EXISTS idx_event_stock_event ON event_stock(event_id);

-- ============================================================
-- ORDERS / RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  event_id        VARCHAR(100) NOT NULL REFERENCES events(id),
  category        VARCHAR(50) NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  total_price     BIGINT NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',   -- pending, confirmed, expired, cancelled
  lock_key        VARCHAR(255),
  locked_at       TIMESTAMPTZ,
  confirmed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- TICKETS (confirmed & issued e-tickets)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  event_id        VARCHAR(100) NOT NULL REFERENCES events(id),
  category        VARCHAR(50) NOT NULL,
  ticket_code     VARCHAR(50) UNIQUE NOT NULL,
  qr_data         TEXT,
  holder_name     VARCHAR(255) NOT NULL,
  holder_nik      VARCHAR(20),
  issued_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id    VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_name   VARCHAR(255) NOT NULL DEFAULT 'Anonim',
  user_avatar VARCHAR(5) DEFAULT 'AN',
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);

-- ============================================================
-- QUEUE LOG (virtual waiting room audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS queue_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID,
  event_id    VARCHAR(100),
  action      VARCHAR(50) NOT NULL,   -- 'join', 'advance', 'exit', 'timeout'
  position    INT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
`;

async function initDatabase() {
  console.log('🔧 Initializing FlashTiket database schema...');
  console.log('───────────────────────────────────────────────');
  
  try {
    await query(SCHEMA_SQL);
    console.log('✅ All tables created successfully!');
    console.log('   • users');
    console.log('   • events');
    console.log('   • event_stock');
    console.log('   • orders');
    console.log('   • tickets');
    console.log('   • wishlists');
    console.log('   • reviews');
    console.log('   • queue_log');
    console.log('───────────────────────────────────────────────');
    console.log('🎉 Database ready!');
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    throw err;
  }
  process.exit(0);
}

initDatabase();
