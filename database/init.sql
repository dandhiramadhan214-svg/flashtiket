-- ================================================================
-- Database Init Script (SRS Section 6.A)
-- 4 Core Tables: events, ticket_categories, orders, tickets
-- Complete with initial seeding data for 1 concert and 3 categories
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Acara Konser
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    venue VARCHAR(150) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    sale_start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Kategori Tiket
CREATE TABLE IF NOT EXISTS ticket_categories (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "VIP", "CAT 1", "CAT 2"
    price NUMERIC(12, 2) NOT NULL,
    total_quota INT NOT NULL,
    available_quota INT NOT NULL
);

-- 3. Tabel Transaksi / Pesanan
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    event_id INT REFERENCES events(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_nik VARCHAR(20) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'WAITING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED'
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP
);

-- 4. Tabel E-Tiket
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    category_id INT REFERENCES ticket_categories(id),
    seat_number VARCHAR(20),
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- 'ACTIVE', 'CHECKED_IN'
);

-- ── DATA SEEDING AWAL ──────────────────────────────────────────
-- 1 Acara Konser (Coldplay GBK)
INSERT INTO events (id, title, venue, event_date, sale_start_time)
VALUES (1, 'Coldplay: Music of the Spheres World Tour Jakarta', 'Gelora Bung Karno Stadium, Jakarta', '2026-03-22 19:00:00', '2026-03-01 10:00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 3 Kategori Tiket: VIP, CAT 1, CAT 2
INSERT INTO ticket_categories (id, event_id, name, price, total_quota, available_quota)
VALUES 
  (1, 1, 'VIP', 5500000.00, 100, 100),
  (2, 1, 'CAT 1', 2750000.00, 500, 500),
  (3, 1, 'CAT 2', 1250000.00, 1000, 1000)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;
