// ================================================================
// FlashTiket Backend — Resilient PostgreSQL Pool & In-Memory Fallback
// Automatically falls back to In-Memory store if PostgreSQL is offline
// ================================================================
import pg from 'pg';
import dotenv from 'dotenv';
import inMemoryStore from './inMemoryStore.js';
import redis from './redis.js';

dotenv.config();

const { Pool } = pg;

let isPostgresAvailable = false;
let checkDone = false;

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'flashtiket',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, // Fast 2s timeout for fallback
});

// Quick probe on startup
pool.connect()
  .then((client) => {
    isPostgresAvailable = true;
    checkDone = true;
    console.log('  📦 PostgreSQL connected successfully');
    client.release();
  })
  .catch((_err) => {
    isPostgresAvailable = false;
    checkDone = true;
    console.log('  ℹ️  PostgreSQL offline/tidak terdeteksi.');
    console.log('  💡 Beralih otomatis ke In-Memory Data Store (Semua fitur tetap aktif)');
    // Sync initial stock to Redis if available
    inMemoryStore.syncToRedis(redis);
  });

pool.on('error', (err) => {
  if (isPostgresAvailable) {
    console.error('  ❌ PostgreSQL pool error:', err.message);
  }
});

/**
 * Execute a query with optional params
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  if (isPostgresAvailable) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log(`  ⚠️  Slow query (${duration}ms):`, text.substring(0, 80));
      }
      return result;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect')) {
        isPostgresAvailable = false;
        console.warn('  ⚠️  PostgreSQL disconnected, switching to in-memory fallback');
        return inMemoryStore.executeQuery(text, params);
      }
      throw err;
    }
  }

  // Use resilient in-memory store
  return inMemoryStore.executeQuery(text, params);
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<any>}
 */
export async function getClient() {
  if (isPostgresAvailable) {
    try {
      return await pool.connect();
    } catch (err) {
      isPostgresAvailable = false;
    }
  }

  // Simulated transaction client for in-memory mode
  return {
    async query(text, params = []) {
      const upper = text.trim().toUpperCase();
      if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }
      return inMemoryStore.executeQuery(text, params);
    },
    release() {
      // no-op for in-memory
    },
  };
}

export function isUsingFallback() {
  return !isPostgresAvailable;
}

export default pool;
