const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ROOT = __dirname;
const PROJECT_ROOT = path.resolve(ROOT, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex < 0) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(PROJECT_ROOT, '.env'));
loadEnvFile(path.join(ROOT, '.env'));

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.POSTGRES_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };
  }

  if (!process.env.POSTGRES_PASSWORD) {
    throw new Error('Database password is not configured. Set DATABASE_URL or POSTGRES_PASSWORD in local environment.');
  }

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || 'sunshine_beiya',
    user: process.env.POSTGRES_USER || 'sunshine_app',
    password: process.env.POSTGRES_PASSWORD,
    max: Number(process.env.POSTGRES_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    pool.on('error', (error) => {
      console.error('PostgreSQL pool error:', error.message);
    });
  }
  return pool;
}

function getDatabaseSummary() {
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || 'sunshine_beiya',
    user: process.env.POSTGRES_USER || 'sunshine_app',
    usesDatabaseUrl: Boolean(process.env.DATABASE_URL)
  };
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function checkDatabase() {
  const result = await query('SELECT 1 AS ok');
  return result.rows[0];
}

async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = {
  checkDatabase,
  closePool,
  getDatabaseSummary,
  query,
  transaction
};
