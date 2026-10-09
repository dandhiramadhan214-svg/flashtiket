// ================================================================
// FlashTiket Backend — Database Seed Data
// ================================================================
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../config/database.js';
import redis from '../config/redis.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Seeding FlashTiket database...');
  console.log('───────────────────────────────────────────────');

  try {
    await redis.connect();

    // ── Seed Demo User ──────────────────────────────────────────
    const passwordHash = await bcrypt.hash('demo1234', 10);
    await query(`
      INSERT INTO users (id, name, email, phone, nik, password_hash, avatar_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [
      'a1b2c3d4-0000-0000-0000-000000000001',
      'Kevin Pratama',
      'kevin.pratama@gmail.com',
      '+62 812-3456-7890',
      '31710482910002',
      passwordHash,
      'KP'
    ]);
    console.log('  👤 Demo user created (kevin.pratama@gmail.com / demo1234)');

    // ── Seed Events ─────────────────────────────────────────────
    const events = [
      {
        id: 'aurora-sg-2025',
        title: 'AURORA: Echoes of Eternity',
        subtitle: 'World Tour 2025 — Night 1',
        venue: 'Singapore National Stadium',
        city: 'Kallang, Singapore',
        event_date: '15 Nov 2025',
        event_time: '19:30 SGT',
        category: 'Konser',
        price_from: 188,
        currency: 'SGD',
        status: 'on-sale',
        image: '/banner.jpg',
        hot: true,
        stock: { vip: { total: 50, price: 588 }, cat1: { total: 150, price: 388 }, cat2: { total: 300, price: 188 } },
      },
      {
        id: 'coldplay-jkt-2026',
        title: 'Coldplay: Music of the Spheres',
        subtitle: 'World Tour 2026 — Jakarta',
        venue: 'Gelora Bung Karno Stadium',
        city: 'Senayan, Jakarta',
        event_date: '22 Mar 2026',
        event_time: '19:00 WIB',
        category: 'Konser',
        price_from: 1250000,
        currency: 'IDR',
        status: 'on-sale',
        image: '/events/coldplay.jpg',
        hot: true,
        stock: { vip: { total: 80, price: 5500000 }, cat1: { total: 500, price: 2750000 }, cat2: { total: 1200, price: 1250000 } },
      },
      {
        id: 'taylor-swift-sg',
        title: 'Taylor Swift: The Eras Tour',
        subtitle: 'Asia Pacific Leg — 6 Nights',
        venue: 'Singapore National Stadium',
        city: 'Kallang, Singapore',
        event_date: '2-7 Mar 2026',
        event_time: '19:00 SGT',
        category: 'Konser',
        price_from: 228,
        currency: 'SGD',
        status: 'sold-out',
        image: '/events/taylor-swift.jpg',
        hot: false,
        stock: { vip: { total: 0, price: 728 }, cat1: { total: 0, price: 428 }, cat2: { total: 0, price: 228 } },
      },
      {
        id: 'dewa19-reunion',
        title: 'Dewa 19 Reunion Concert',
        subtitle: '30th Anniversary Special',
        venue: 'Indonesia Arena',
        city: 'Senayan, Jakarta',
        event_date: '10 Jan 2026',
        event_time: '20:00 WIB',
        category: 'Konser',
        price_from: 450000,
        currency: 'IDR',
        status: 'on-sale',
        image: '/events/dewa19.jpg',
        hot: false,
        stock: { vip: { total: 100, price: 2500000 }, cat1: { total: 350, price: 1200000 }, cat2: { total: 800, price: 450000 } },
      },
      {
        id: 'jakarta-marathon-2026',
        title: 'Jakarta Marathon 2026',
        subtitle: 'International AIMS Certified',
        venue: 'Monas - Sudirman Route',
        city: 'Jakarta Pusat',
        event_date: '25 Oct 2026',
        event_time: '05:00 WIB',
        category: 'Olahraga',
        price_from: 350000,
        currency: 'IDR',
        status: 'on-sale',
        image: '/events/marathon.jpg',
        hot: false,
        stock: { vip: { total: 200, price: 1500000 }, cat1: { total: 2000, price: 750000 }, cat2: { total: 5000, price: 350000 } },
      },
      {
        id: 'comic-con-sg',
        title: 'Singapore Comic Con 2026',
        subtitle: 'Pop Culture & Cosplay Convention',
        venue: 'Sands Expo & Convention Centre',
        city: 'Marina Bay, Singapore',
        event_date: '8-9 Feb 2026',
        event_time: '10:00 SGT',
        category: 'Festival',
        price_from: 45,
        currency: 'SGD',
        status: 'on-sale',
        image: '/events/comic-con.jpg',
        hot: false,
        stock: { vip: { total: 500, price: 198 }, cat1: { total: 2000, price: 98 }, cat2: { total: 5000, price: 45 } },
      },
      {
        id: 'java-jazz-2026',
        title: 'Java Jazz Festival 2026',
        subtitle: "Southeast Asia's Largest Jazz Festival",
        venue: 'JIExpo Kemayoran',
        city: 'Jakarta Utara',
        event_date: '27-29 Mar 2026',
        event_time: '14:00 WIB',
        category: 'Festival',
        price_from: 550000,
        currency: 'IDR',
        status: 'coming-soon',
        image: '/events/java-jazz.jpg',
        hot: true,
        stock: { vip: { total: 300, price: 3500000 }, cat1: { total: 1500, price: 1500000 }, cat2: { total: 4000, price: 550000 } },
      },
      {
        id: 'valorant-masters-sg',
        title: 'VALORANT Masters Singapore',
        subtitle: 'VCT 2026 Stage 2',
        venue: 'Singapore Indoor Stadium',
        city: 'Kallang, Singapore',
        event_date: '15-22 Jun 2026',
        event_time: '12:00 SGT',
        category: 'Esports',
        price_from: 38,
        currency: 'SGD',
        status: 'on-sale',
        image: '/events/valorant.jpg',
        hot: true,
        stock: { vip: { total: 100, price: 198 }, cat1: { total: 800, price: 88 }, cat2: { total: 3000, price: 38 } },
      },
      {
        id: 'wayang-kulit-solo',
        title: 'Festival Wayang Kulit Nusantara',
        subtitle: 'Dalang Ki Manteb Soedharsono',
        venue: 'Pendopo Mangkunegaran',
        city: 'Solo, Jawa Tengah',
        event_date: '5 Dec 2025',
        event_time: '19:30 WIB',
        category: 'Seni & Budaya',
        price_from: 75000,
        currency: 'IDR',
        status: 'ended',
        image: '/events/wayang.jpg',
        hot: false,
        stock: { vip: { total: 0, price: 350000 }, cat1: { total: 0, price: 150000 }, cat2: { total: 0, price: 75000 } },
      },
      {
        id: 'ui-ux-workshop-jkt',
        title: 'Masterclass: Product Design',
        subtitle: 'UI/UX Workshop Series by Google',
        venue: 'Google Office Jakarta',
        city: 'Pacific Century Place, Jakarta',
        event_date: '20 Nov 2025',
        event_time: '09:00 WIB',
        category: 'Workshop',
        price_from: 250000,
        currency: 'IDR',
        status: 'on-sale',
        image: '/events/workshop.jpg',
        hot: false,
        stock: { vip: { total: 0, price: 0 }, cat1: { total: 30, price: 500000 }, cat2: { total: 70, price: 250000 } },
      },
    ];

    for (const evt of events) {
      // Insert event
      await query(`
        INSERT INTO events (id, title, subtitle, venue, city, event_date, event_time, category, price_from, currency, status, image, hot)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          status = EXCLUDED.status,
          hot = EXCLUDED.hot
      `, [
        evt.id, evt.title, evt.subtitle, evt.venue, evt.city,
        evt.event_date, evt.event_time, evt.category, evt.price_from,
        evt.currency, evt.status, evt.image, evt.hot
      ]);

      // Insert stock per tier & sync to Redis
      for (const [tier, data] of Object.entries(evt.stock)) {
        await query(`
          INSERT INTO event_stock (event_id, category, total, available, price)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (event_id, category) DO UPDATE SET
            total = EXCLUDED.total,
            available = EXCLUDED.available,
            price = EXCLUDED.price
        `, [evt.id, tier, data.total, data.total, data.price]);

        // Sync stock to Redis for real-time atomic reads
        await redis.set(`stock:${evt.id}:${tier}`, data.total);
      }

      console.log(`  🎫 Event seeded: ${evt.title}`);
    }

    // ── Seed Reviews ────────────────────────────────────────────
    const reviews = [
      {
        event_id: 'aurora-sg-2025',
        user_name: 'Andi Sanjaya',
        user_avatar: 'AS',
        rating: 5,
        comment: 'Visuals aurora yang luar biasa! Pencahayaan terbaik yang pernah saya lihat di konser.',
      },
      {
        event_id: 'wayang-kulit-solo',
        user_name: 'Dewi Lestari',
        user_avatar: 'DL',
        rating: 5,
        comment: 'Audio gamelannya sangat jernih dan kursi VIP nyaman banget. FlashTiket proses tiketnya cepat tanpa calo!',
      },
      {
        event_id: 'coldplay-jkt-2026',
        user_name: 'Kevin Pratama',
        user_avatar: 'KP',
        rating: 5,
        comment: 'Konser terbaik sepanjang masa di GBK! War tiket di FlashTiket beneran fair dan anti-bot!',
      },
    ];

    for (const rev of reviews) {
      await query(`
        INSERT INTO reviews (event_id, user_name, user_avatar, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
      `, [rev.event_id, rev.user_name, rev.user_avatar, rev.rating, rev.comment]);
    }
    console.log('  ⭐ 3 seed reviews inserted');

    console.log('───────────────────────────────────────────────');
    console.log('🎉 Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  }

  await redis.quit();
  process.exit(0);
}

seedDatabase();
