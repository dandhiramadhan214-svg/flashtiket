// ================================================================
// FlashTiket Backend — Redis Connection
// ================================================================
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.log(`  🔄 Redis reconnecting... attempt ${times} (${delay}ms)`);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('  ⚡ Redis connected');
});

redis.on('error', (err) => {
  console.error('  ❌ Redis error:', err.message);
});

// ================================================================
// Lua Scripts — Atomic Operations for Ticket War
// ================================================================

/**
 * ATOMIC STOCK DECREMENT — prevents race conditions / overselling
 * 
 * KEYS[1] = stock key (e.g., "stock:event-id:vip")
 * ARGV[1] = quantity to decrement
 * 
 * Returns:
 *   1  = success (stock decremented)
 *   0  = failure (insufficient stock)
 *  -1  = key doesn't exist
 */
const LUA_DECREMENT_STOCK = `
  local current = redis.call('GET', KEYS[1])
  if current == false then
    return -1
  end
  current = tonumber(current)
  local qty = tonumber(ARGV[1])
  if current >= qty then
    redis.call('DECRBY', KEYS[1], qty)
    return 1
  else
    return 0
  end
`;

/**
 * ATOMIC SEAT LOCK — distributed locking for seat reservation
 * 
 * KEYS[1] = lock key (e.g., "lock:event-id:vip:A12")
 * ARGV[1] = user ID (lock owner)
 * ARGV[2] = TTL in seconds
 * 
 * Returns:
 *   1  = lock acquired
 *   0  = lock already held by someone else
 */
const LUA_ACQUIRE_LOCK = `
  local current = redis.call('GET', KEYS[1])
  if current == false then
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
    return 1
  elseif current == ARGV[1] then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
  else
    return 0
  end
`;

/**
 * ATOMIC LOCK RELEASE — only the owner can release
 * 
 * KEYS[1] = lock key
 * ARGV[1] = user ID (must match lock owner)
 * 
 * Returns:
 *   1  = released
 *   0  = not the owner / key doesn't exist
 */
const LUA_RELEASE_LOCK = `
  local current = redis.call('GET', KEYS[1])
  if current == ARGV[1] then
    redis.call('DEL', KEYS[1])
    return 1
  else
    return 0
  end
`;

// Pre-define scripts for reuse
export async function decrementStock(eventId, category, quantity = 1) {
  const key = `stock:${eventId}:${category}`;
  return redis.eval(LUA_DECREMENT_STOCK, 1, key, quantity);
}

export async function acquireLock(eventId, category, userId, ttlSeconds) {
  const key = `lock:${eventId}:${category}:${userId}`;
  return redis.eval(LUA_ACQUIRE_LOCK, 1, key, userId, ttlSeconds);
}

export async function releaseLock(eventId, category, userId) {
  const key = `lock:${eventId}:${category}:${userId}`;
  return redis.eval(LUA_RELEASE_LOCK, 1, key, userId);
}

export default redis;
