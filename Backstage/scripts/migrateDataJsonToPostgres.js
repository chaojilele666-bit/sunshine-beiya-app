const fs = require('fs');
const path = require('path');
const db = require('../db');
const { resourceConfigs } = require('../repositories/resourceRepository');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function toArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function toBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeValue(key, value) {
  if (['permissions', 'skills', 'tags'].includes(key)) return toArray(value);
  if (['visible', 'canStay'].includes(key)) return toBoolean(value);
  if (['age', 'experience', 'sort', 'demandId'].includes(key)) return toNumber(value);
  return value === undefined ? null : value;
}

function normalizeRecord(resource, record) {
  const config = resourceConfigs[resource];
  const normalized = {};
  Object.entries(config.columns).forEach(([apiKey, column]) => {
    if (record[apiKey] !== undefined) {
      normalized[column] = normalizeValue(apiKey, record[apiKey]);
    } else if (config.defaults && config.defaults[apiKey] !== undefined) {
      normalized[column] = normalizeValue(apiKey, config.defaults[apiKey]);
    }
  });
  normalized.id = Number(record.id);
  return normalized;
}

async function upsertResource(client, resource, records) {
  const config = resourceConfigs[resource];
  let count = 0;

  for (const record of records || []) {
    const normalized = normalizeRecord(resource, record);
    if (!normalized.id) continue;

    const columns = Object.keys(normalized);
    const values = Object.values(normalized);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const updateColumns = columns.filter((column) => column !== 'id');
    const updates = updateColumns.map((column) => `${column} = EXCLUDED.${column}`);
    await client.query(
      `INSERT INTO ${config.table} (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`,
      values
    );
    count += 1;
  }

  await client.query(`
    SELECT setval(
      pg_get_serial_sequence($1, 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${config.table}), 1),
      true
    )
  `, [config.table]);

  return count;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const resources = ['accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners'];
  const result = {};

  await db.transaction(async (client) => {
    for (const resource of resources) {
      result[resource] = await upsertResource(client, resource, data[resource] || []);
    }
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.closePool());
