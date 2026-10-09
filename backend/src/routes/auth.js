// ================================================================
// FlashTiket Backend — Auth Routes
// ================================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/register ────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, nik, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nama, email, dan password wajib diisi.' 
      });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const avatarText = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';

    const result = await query(`
      INSERT INTO users (name, email, phone, nik, password_hash, avatar_text)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, nik, avatar_text, created_at
    `, [name, email, phone || null, nik || null, passwordHash, avatarText]);

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          nik: user.nik,
          avatarText: user.avatar_text,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email dan password wajib diisi.' 
      });
    }

    const result = await query(
      'SELECT id, name, email, phone, nik, password_hash, avatar_text FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email atau password salah.' 
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email atau password salah.' 
      });
    }

    const token = generateToken(user);
    const role = user.role || (user.email === 'admin@flashtiket.com' ? 'admin' : 'user');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          nik: user.nik,
          avatarText: user.avatar_text,
          role,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, nik, avatar_text, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nik: user.nik,
        avatarText: user.avatar_text,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

export default router;
