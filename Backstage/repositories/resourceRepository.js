const db = require('../db');

const resourceConfigs = {
  accounts: {
    table: 'backstage_accounts',
    required: ['name', 'role'],
    columns: {
      name: 'name',
      phone: 'phone',
      role: 'role',
      entry: 'entry',
      permissions: 'permissions',
      status: 'status',
      note: 'note'
    },
    defaults: { entry: '后台管理', permissions: [], status: '启用' },
    orderBy: 'id ASC'
  },
  ayis: {
    table: 'ayis',
    required: ['name', 'phone'],
    columns: {
      image: 'image',
      name: 'name',
      phone: 'phone',
      source: 'source',
      age: 'age',
      hometown: 'hometown',
      serviceType: 'service_type',
      experience: 'experience',
      liveType: 'live_type',
      salary: 'salary',
      availableTime: 'available_time',
      skills: 'skills',
      status: 'status',
      idCardImage: 'id_card_image',
      healthCertImage: 'health_cert_image',
      skillCertImage: 'skill_cert_image',
      intro: 'intro',
      visible: 'visible'
    },
    defaults: { source: '后台录入', skills: [], status: '待审核', visible: true },
    orderBy: 'updated_at DESC, id DESC'
  },
  demands: {
    table: 'demands',
    required: ['customerName', 'phone'],
    columns: {
      customerName: 'customer_name',
      phone: 'phone',
      source: 'source',
      serviceType: 'service_type',
      city: 'city',
      address: 'address',
      startTime: 'start_time',
      budget: 'budget',
      familyInfo: 'family_info',
      consultant: 'consultant',
      followNote: 'follow_note',
      status: 'status'
    },
    defaults: { source: '后台录入', status: '待跟进' },
    orderBy: 'updated_at DESC, id DESC'
  },
  appointments: {
    table: 'appointments',
    required: ['customerName'],
    columns: {
      customerName: 'customer_name',
      phone: 'phone',
      ayiName: 'ayi_name',
      serviceType: 'service_type',
      date: 'date',
      address: 'address',
      consultant: 'consultant',
      status: 'status',
      note: 'note'
    },
    defaults: { status: '待联系' },
    orderBy: 'updated_at DESC, id DESC'
  },
  applications: {
    table: 'applications',
    required: ['ayiName'],
    columns: {
      ayiName: 'ayi_name',
      ayiPhone: 'ayi_phone',
      demandId: 'demand_id',
      serviceType: 'service_type',
      customerAddress: 'customer_address',
      startTime: 'start_time',
      budget: 'budget',
      consultant: 'consultant',
      status: 'status',
      note: 'note'
    },
    defaults: { status: '已申请' },
    orderBy: 'updated_at DESC, id DESC'
  },
  orders: {
    table: 'orders',
    required: ['orderNo', 'customerName'],
    columns: {
      orderNo: 'order_no',
      customerName: 'customer_name',
      customerPhone: 'customer_phone',
      ayiName: 'ayi_name',
      ayiPhone: 'ayi_phone',
      serviceType: 'service_type',
      address: 'address',
      startTime: 'start_time',
      price: 'price',
      consultant: 'consultant',
      contractStatus: 'contract_status',
      payStatus: 'pay_status',
      status: 'status',
      note: 'note'
    },
    defaults: { status: '待上户' },
    orderBy: 'updated_at DESC, id DESC'
  },
  stores: {
    table: 'stores',
    required: ['name'],
    columns: {
      image: 'image',
      name: 'name',
      district: 'district',
      address: 'address',
      phone: 'phone',
      area: 'area',
      tags: 'tags',
      canStay: 'can_stay',
      visible: 'visible'
    },
    defaults: { tags: [], canStay: false, visible: true },
    orderBy: 'id ASC'
  },
  serviceModules: {
    table: 'service_modules',
    required: ['title'],
    columns: {
      title: 'title',
      summary: 'summary',
      image: 'image',
      sort: 'sort',
      visible: 'visible'
    },
    defaults: { sort: 0, visible: true },
    orderBy: 'sort ASC, id ASC'
  },
  banners: {
    table: 'banners',
    required: ['title'],
    columns: {
      title: 'title',
      subtitle: 'subtitle',
      image: 'image',
      targetType: 'target_type',
      sort: 'sort',
      visible: 'visible'
    },
    defaults: { sort: 0, visible: true },
    orderBy: 'sort ASC, id ASC'
  },
  orderDispatches: {
    table: 'order_dispatches',
    required: ['ayiName'],
    columns: {
      orderId: 'order_id',
      orderNo: 'order_no',
      ayiName: 'ayi_name',
      ayiPhone: 'ayi_phone',
      dispatchType: 'dispatch_type',
      status: 'status',
      assignedBy: 'assigned_by',
      note: 'note'
    },
    defaults: { dispatchType: '人工派单', status: '已派单' },
    orderBy: 'updated_at DESC, id DESC'
  }
};

function getConfig(resource) {
  const config = resourceConfigs[resource];
  if (!config) throw new Error(`Unknown resource: ${resource}`);
  return config;
}

function toArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
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
  if (['age', 'experience', 'sort', 'demandId', 'orderId'].includes(key)) return toNumber(value);
  return value === undefined ? null : value;
}

function normalizePayload(config, payload, partial = false) {
  const source = Object.assign({}, partial ? {} : config.defaults, payload || {});
  const normalized = {};

  Object.entries(config.columns).forEach(([apiKey, column]) => {
    if (source[apiKey] !== undefined) {
      normalized[column] = normalizeValue(apiKey, source[apiKey]);
    }
  });

  if (!partial) {
    config.required.forEach((key) => {
      const column = config.columns[key];
      if (!normalized[column]) {
        throw new Error(`${key} is required`);
      }
    });
  }

  return normalized;
}

function rowToResource(config, row) {
  const item = { id: row.id };
  Object.entries(config.columns).forEach(([apiKey, column]) => {
    item[apiKey] = row[column];
  });
  item.createdAt = row.created_at;
  item.updatedAt = row.updated_at;
  return item;
}

function buildSelect(config) {
  return `SELECT * FROM ${config.table}`;
}

async function list(resource, client = db) {
  const config = getConfig(resource);
  const result = await client.query(`${buildSelect(config)} ORDER BY ${config.orderBy}`);
  return result.rows.map((row) => rowToResource(config, row));
}

async function findById(resource, id, client = db) {
  const config = getConfig(resource);
  const result = await client.query(`${buildSelect(config)} WHERE id = $1`, [Number(id)]);
  return result.rows[0] ? rowToResource(config, result.rows[0]) : null;
}

function makeSummary(item) {
  if (!item) return null;
  return JSON.stringify(item).slice(0, 500);
}

async function writeAudit(client, action, resource, id, before, after, actor = {}) {
  await client.query(
    `INSERT INTO audit_logs (
      actor, actor_role, action, entity_type, resource_type, resource_id_text, before_data, after_data, before_summary, after_summary
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10)`,
    [
      actor.name || 'system',
      actor.role || null,
      action,
      resource,
      resource,
      String(id),
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      makeSummary(before),
      makeSummary(after)
    ]
  );
}

async function create(resource, payload, actor) {
  const config = getConfig(resource);
  return db.transaction(async (client) => {
    const normalized = normalizePayload(config, payload, false);
    const columns = Object.keys(normalized);
    const values = Object.values(normalized);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    const result = await client.query(
      `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    const created = rowToResource(config, result.rows[0]);
    await syncSequence(client, config.table);
    await writeAudit(client, 'create', resource, created.id, null, created, actor);
    return created;
  });
}

async function update(resource, id, payload, actor) {
  const config = getConfig(resource);
  return db.transaction(async (client) => {
    const before = await findById(resource, id, client);
    if (!before) return null;

    const normalized = normalizePayload(config, payload, true);
    const columns = Object.keys(normalized).filter((column) => column !== 'id');
    if (!columns.length) return before;

    const values = columns.map((column) => normalized[column]);
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
    values.push(Number(id));
    const result = await client.query(
      `UPDATE ${config.table} SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const updated = rowToResource(config, result.rows[0]);
    await writeAudit(client, 'update', resource, updated.id, before, updated, actor);
    return updated;
  });
}

async function remove(resource, id, actor) {
  const config = getConfig(resource);
  return db.transaction(async (client) => {
    const before = await findById(resource, id, client);
    if (!before) return false;

    if (resource === 'accounts' && before.role === '老板端' && before.status !== '停用') {
      const remaining = await client.query(
        `SELECT count(*)::integer AS count FROM ${config.table} WHERE id <> $1 AND role = '老板端' AND status <> '停用'`,
        [Number(id)]
      );
      if (remaining.rows[0].count <= 0) {
        throw new Error('至少保留一个启用的老板端账号');
      }
    }

    await client.query(`DELETE FROM ${config.table} WHERE id = $1`, [Number(id)]);
    await writeAudit(client, 'delete', resource, id, before, null, actor);
    return true;
  });
}

async function syncSequence(client, table) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence($1, 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1),
      true
    )
  `, [table]);
}

module.exports = {
  create,
  findById,
  list,
  remove,
  resourceConfigs,
  update,
  writeAudit
};
