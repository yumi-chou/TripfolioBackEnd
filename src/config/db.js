const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

if (!global._tripfolioPool) {
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  global._tripfolioPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: true } : false, 
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 3_000,
    keepAlive: true,
  });
}

const pool = global._tripfolioPool;
const db = drizzle(pool);

module.exports = { db, pool };
