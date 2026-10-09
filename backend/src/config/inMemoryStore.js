// ================================================================
// FlashTiket Backend — Resilient In-Memory Database Store
// Provides seamless zero-config fallback when PostgreSQL is offline
// ================================================================
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

class InMemoryStore {
  constructor() {
    this.users = [];
    this.events = [];
    this.eventStock = [];
    this.wishlist = [];
    this.reviews = [];
    this.orders = [];
    this.tickets = [];
    this.waitingRoom = [];

    this.initSeedData();
  }

  initSeedData() {
    // 1. Demo User
    const passwordHash = bcrypt.hashSync('demo1234', 10);
    this.users.push({
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      name: 'Kevin Pratama',
      email: 'kevin.pratama@gmail.com',
      phone: '+62 812-3456-7890',
      nik: '31710482910002',
      password_hash: passwordHash,
      role: 'user',
      avatar_text: 'KP',
      created_at: new Date(),
    });

    // 1b. Super Admin User
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    this.users.push({
      id: 'a1b2c3d4-0000-0000-0000-000000000099',
      name: 'Super Administrator',
      email: 'admin@flashtiket.com',
      phone: '+62 811-9988-7766',
      nik: '3171000000000001',
      password_hash: adminPasswordHash,
      role: 'admin',
      avatar_text: 'AD',
      created_at: new Date(),
    });

    // 2. Events Seed
    const initialEvents = [
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

    for (const evt of initialEvents) {
      this.events.push({
        id: evt.id,
        title: evt.title,
        subtitle: evt.subtitle,
        venue: evt.venue,
        city: evt.city,
        event_date: evt.event_date,
        event_time: evt.event_time,
        category: evt.category,
        price_from: evt.price_from,
        currency: evt.currency,
        status: evt.status,
        image: evt.image,
        hot: evt.hot,
        created_at: new Date(),
      });

      for (const [cat, info] of Object.entries(evt.stock)) {
        this.eventStock.push({
          id: `${evt.id}-${cat}`,
          event_id: evt.id,
          category: cat,
          total: info.total,
          available: info.total,
          price: info.price,
        });
      }
    }

    // 3. Reviews Seed
    this.reviews = [
      {
        id: 1,
        event_id: 'aurora-sg-2025',
        user_name: 'Andi Sanjaya',
        user_avatar: 'AS',
        rating: 5,
        comment: 'Visuals aurora yang luar biasa! Pencahayaan terbaik yang pernah saya lihat di konser.',
        created_at: new Date('2025-10-01'),
      },
      {
        id: 2,
        event_id: 'wayang-kulit-solo',
        user_name: 'Dewi Lestari',
        user_avatar: 'DL',
        rating: 5,
        comment: 'Audio gamelannya sangat jernih dan kursi VIP nyaman banget. FlashTiket proses tiketnya cepat tanpa calo!',
        created_at: new Date('2025-10-02'),
      },
      {
        id: 3,
        event_id: 'coldplay-jkt-2026',
        user_name: 'Kevin Pratama',
        user_avatar: 'KP',
        rating: 5,
        comment: 'Konser terbaik sepanjang masa di GBK! War tiket di FlashTiket beneran fair dan anti-bot!',
        created_at: new Date('2025-10-03'),
      },
    ];

    // 4. Seed Demo Orders for Admin Dashboard
    this.orders = [
      {
        id: 'FT-MID-98214',
        user_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        event_id: 'aurora-sg-2025',
        category: 'vip',
        quantity: 2,
        total_amount: 1176,
        status: 'PAID',
        payment_method: 'gopay',
        created_at: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: 'FT-MID-98215',
        user_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        event_id: 'coldplay-jkt-2026',
        category: 'cat1',
        quantity: 1,
        total_amount: 2750000,
        status: 'PAID',
        payment_method: 'qris',
        created_at: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: 'FT-MID-98216',
        user_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        event_id: 'taylor-swift-sg',
        category: 'cat2',
        quantity: 2,
        total_amount: 576,
        status: 'PENDING',
        payment_method: 'bca_va',
        created_at: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'FT-MID-98217',
        user_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        event_id: 'java-jazz-2026',
        category: 'cat1',
        quantity: 1,
        total_amount: 850000,
        status: 'EXPIRED',
        payment_method: 'mandiri_bill',
        created_at: new Date(Date.now() - 120 * 60 * 1000),
      },
    ];
  }

  // Populate Redis with initial stock numbers
  async syncToRedis(redis) {
    if (!redis) return;
    try {
      for (const stock of this.eventStock) {
        const key = `stock:${stock.event_id}:${stock.category}`;
        const current = await redis.get(key);
        if (current === null) {
          await redis.set(key, stock.available);
        }
      }
      console.log('  ⚡ In-Memory stock synced to Redis');
    } catch (err) {
      console.warn('  ⚠️ Redis sync skipped:', err.message);
    }
  }

  async executeQuery(text, params = []) {
    const cleanSql = text.trim();
    const upper = cleanSql.toUpperCase();

    // ── HEALTH CHECK / DUMMY ─────────────────────────────────────────
    if (upper.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }

    // ── USERS TABLE ──────────────────────────────────────────────────
    if (upper.includes('FROM USERS WHERE EMAIL = $1')) {
      const email = params[0]?.toLowerCase();
      const user = this.users.find(u => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (upper.includes('FROM USERS WHERE ID = $1')) {
      const id = params[0];
      const user = this.users.find(u => u.id === id);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (upper.startsWith('INSERT INTO USERS')) {
      const [id, name, email, phone, nik, password_hash, avatar_text] = params;
      const newUser = {
        id: id || uuidv4(),
        name,
        email,
        phone,
        nik,
        password_hash,
        role: 'user',
        avatar_text: avatar_text || name?.slice(0, 2).toUpperCase() || 'US',
        created_at: new Date(),
      };
      this.users.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }

    // ── EVENTS TABLE ─────────────────────────────────────────────────
    if (upper.includes('FROM EVENTS') && upper.includes('LEFT JOIN EVENT_STOCK')) {
      // Check if it's get by ID
      if (upper.includes('WHERE E.ID = $1')) {
        const id = params[0];
        const evt = this.events.find(e => e.id === id);
        if (!evt) return { rows: [], rowCount: 0 };
        const stock = this.eventStock
          .filter(s => s.event_id === evt.id)
          .map(s => ({ category: s.category, total: s.total, available: s.available, price: s.price }));
        return { rows: [{ ...evt, stock }], rowCount: 1 };
      }

      // Filtered list
      let filtered = [...this.events];

      let paramIdx = 0;
      if (upper.includes('E.CATEGORY = $')) {
        const cat = params[paramIdx++];
        filtered = filtered.filter(e => e.category === cat);
      }
      if (upper.includes('E.TITLE ILIKE $') || upper.includes('E.VENUE ILIKE $')) {
        const searchPattern = (params[paramIdx++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(e =>
          e.title.toLowerCase().includes(searchPattern) ||
          e.venue.toLowerCase().includes(searchPattern) ||
          e.city.toLowerCase().includes(searchPattern)
        );
      }
      if (upper.includes('E.STATUS = $')) {
        const status = params[paramIdx++];
        filtered = filtered.filter(e => e.status === status);
      }

      // Sort by hot desc, created_at desc
      filtered.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0));

      const rows = filtered.map(evt => {
        const stock = this.eventStock
          .filter(s => s.event_id === evt.id)
          .map(s => ({ category: s.category, total: s.total, available: s.available, price: s.price }));
        return { ...evt, stock };
      });

      return { rows, rowCount: rows.length };
    }

    if (upper.includes('SELECT ID, STATUS, TITLE FROM EVENTS WHERE ID = $1') || upper.includes('SELECT ID, TITLE FROM EVENTS WHERE ID = $1')) {
      const id = params[0];
      const evt = this.events.find(e => e.id === id);
      return { rows: evt ? [evt] : [], rowCount: evt ? 1 : 0 };
    }

    if (upper.includes('SELECT ID FROM EVENTS WHERE ID = $1')) {
      const id = params[0];
      const evt = this.events.find(e => e.id === id);
      return { rows: evt ? [{ id: evt.id }] : [], rowCount: evt ? 1 : 0 };
    }

    // ── EVENT_STOCK TABLE ────────────────────────────────────────────
    if (upper.includes('SELECT PRICE, AVAILABLE FROM EVENT_STOCK')) {
      const [eventId, category] = params;
      const stock = this.eventStock.find(s => s.event_id === eventId && s.category === category);
      return { rows: stock ? [{ price: stock.price, available: stock.available }] : [], rowCount: stock ? 1 : 0 };
    }

    if (upper.includes('UPDATE EVENT_STOCK SET AVAILABLE =')) {
      const [qty, eventId, category] = params;
      const stock = this.eventStock.find(s => s.event_id === eventId && s.category === category);
      if (stock) {
        stock.available = Math.max(0, stock.available - qty);
      }
      return { rows: [], rowCount: stock ? 1 : 0 };
    }

    // ── ORDERS TABLE ─────────────────────────────────────────────────
    if (upper.startsWith('INSERT INTO ORDERS')) {
      const [id, userId, eventId, category, quantity, totalAmount, status, expiresAt] = params;
      const newOrder = {
        id: id || uuidv4(),
        user_id: userId,
        event_id: eventId,
        category,
        quantity,
        total_amount: totalAmount,
        status: status || 'WAITING_PAYMENT',
        created_at: new Date(),
        expires_at: expiresAt || new Date(Date.now() + 600000),
      };
      this.orders.push(newOrder);
      return { rows: [newOrder], rowCount: 1 };
    }

    if (upper.includes('FROM ORDERS WHERE ID = $1')) {
      const id = params[0];
      const order = this.orders.find(o => o.id === id);
      return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
    }

    if (upper.includes('UPDATE ORDERS SET STATUS = \'PAID\'')) {
      const id = params[0];
      const order = this.orders.find(o => o.id === id);
      if (order) {
        order.status = 'PAID';
        order.paid_at = new Date();
      }
      return { rows: [], rowCount: order ? 1 : 0 };
    }

    if (upper.includes('GROUP BY STATUS') && upper.includes('FROM ORDERS')) {
      const grouped = {};
      this.orders.forEach(o => {
        grouped[o.status] = grouped[o.status] || { count: 0, total: 0 };
        grouped[o.status].count++;
        grouped[o.status].total += Number(o.total_amount || 0);
      });
      const rows = Object.entries(grouped).map(([status, d]) => ({
        status,
        count: d.count,
        total: d.total,
      }));
      return { rows, rowCount: rows.length };
    }

    if (upper.includes('FROM ORDERS') && !upper.includes('WHERE ID = $1')) {
      const rows = this.orders.map(o => {
        const evt = this.events.find(e => e.id === o.event_id) || {};
        const usr = this.users.find(u => u.id === o.user_id) || {};
        return {
          id: o.id,
          user_id: o.user_id,
          event_id: o.event_id,
          category: o.category,
          quantity: o.quantity,
          total_amount: o.total_amount,
          status: o.status,
          payment_method: o.payment_method || 'qris',
          created_at: o.created_at,
          user_name: usr.name || 'Pelanggan FlashTiket',
          user_email: usr.email || 'customer@flashtiket.com',
          event_title: evt.title || o.event_id,
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows, rowCount: rows.length };
    }

    // ── TICKETS TABLE ────────────────────────────────────────────────
    if (upper.startsWith('INSERT INTO TICKETS')) {
      const [orderId, userId, eventId, category, seatNumber, qrToken, status] = params;
      const newTicket = {
        id: uuidv4(),
        order_id: orderId,
        user_id: userId,
        event_id: eventId,
        category,
        seat_number: seatNumber,
        qr_token: qrToken,
        status: status || 'ACTIVE',
        created_at: new Date(),
      };
      this.tickets.push(newTicket);
      return { rows: [newTicket], rowCount: 1 };
    }

    if (upper.includes('FROM TICKETS T') && upper.includes('WHERE T.USER_ID = $1')) {
      const userId = params[0];
      const userTickets = this.tickets.filter(t => t.user_id === userId);
      const rows = userTickets.map(t => {
        const evt = this.events.find(e => e.id === t.event_id) || {};
        return {
          ...t,
          event_title: evt.title,
          venue: evt.venue,
          event_date: evt.event_date,
          event_time: evt.event_time,
          image: evt.image,
        };
      });
      return { rows, rowCount: rows.length };
    }

    // ── WISHLIST TABLE ───────────────────────────────────────────────
    if (upper.includes('FROM WISHLISTS') && upper.includes('W.USER_ID = $1')) {
      const userId = params[0];
      const userWishlist = this.wishlist.filter(w => w.user_id === userId);
      const rows = userWishlist.map(w => {
        const evt = this.events.find(e => e.id === w.event_id);
        if (!evt) return null;
        return {
          event_id: evt.id,
          wishlisted_at: w.added_at,
          ...evt,
        };
      }).filter(Boolean);
      return { rows, rowCount: rows.length };
    }

    if (upper.startsWith('INSERT INTO WISHLISTS') || upper.startsWith('INSERT INTO WISHLIST')) {
      const [userId, eventId] = params;
      const existing = this.wishlist.find(w => w.user_id === userId && w.event_id === eventId);
      if (!existing) {
        const item = {
          id: this.wishlist.length + 1,
          user_id: userId,
          event_id: eventId,
          added_at: new Date(),
        };
        this.wishlist.push(item);
      }
      return { rows: [], rowCount: 1 };
    }

    if (upper.includes('DELETE FROM WISHLISTS') || upper.includes('DELETE FROM WISHLIST')) {
      if (upper.includes('EVENT_ID = $2')) {
        const [userId, eventId] = params;
        const index = this.wishlist.findIndex(w => w.user_id === userId && w.event_id === eventId);
        if (index !== -1) {
          this.wishlist.splice(index, 1);
          return { rows: [{ id: 1 }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      } else {
        const userId = params[0];
        const initial = this.wishlist.length;
        this.wishlist = this.wishlist.filter(w => w.user_id !== userId);
        return { rows: [], rowCount: initial - this.wishlist.length };
      }
    }

    // ── REVIEWS TABLE ────────────────────────────────────────────────
    if (upper.includes('FROM REVIEWS WHERE EVENT_ID = $1 ORDER BY CREATED_AT DESC')) {
      const eventId = params[0];
      const rows = this.reviews
        .filter(r => r.event_id === eventId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows, rowCount: rows.length };
    }

    if (upper.includes('ROUND(AVG(RATING), 1)') && upper.includes('FROM REVIEWS')) {
      const eventId = params[0];
      const revs = this.reviews.filter(r => r.event_id === eventId);
      if (revs.length === 0) {
        return { rows: [{ avg_rating: null, total_reviews: 0 }], rowCount: 1 };
      }
      const sum = revs.reduce((acc, r) => acc + r.rating, 0);
      const avg = (sum / revs.length).toFixed(1);
      return { rows: [{ avg_rating: parseFloat(avg), total_reviews: revs.length }], rowCount: 1 };
    }

    if (upper.startsWith('INSERT INTO REVIEWS')) {
      const [eventId, userName, userAvatar, rating, comment] = params;
      const newReview = {
        id: this.reviews.length + 1,
        event_id: eventId,
        user_name: userName,
        user_avatar: userAvatar,
        rating: Number(rating),
        comment,
        created_at: new Date(),
      };
      this.reviews.push(newReview);
      return { rows: [newReview], rowCount: 1 };
    }

    // ── ADMIN COUNTS ─────────────────────────────────────────────────
    if (upper.includes('COUNT(*) AS COUNT FROM EVENTS')) {
      return { rows: [{ count: this.events.length }], rowCount: 1 };
    }
    if (upper.includes('COUNT(*) AS COUNT FROM USERS')) {
      return { rows: [{ count: this.users.length }], rowCount: 1 };
    }
    if (upper.includes('COUNT(*) AS COUNT FROM TICKETS')) {
      return { rows: [{ count: this.tickets.length }], rowCount: 1 };
    }

    // Default fallback
    return { rows: [], rowCount: 0 };
  }
}

export const inMemoryStore = new InMemoryStore();
export default inMemoryStore;
