const db = require('../db');
const notificationRepository = require('./notificationRepository');
const resourceRepository = require('./resourceRepository');

const FOLLOW_UP_METHODS = new Set(['phone', 'wechat', 'visit', 'other']);
const PENDING_STATUSES = new Set(['待处理', '待跟进', '顾问待联系']);
const CLOSED_TODO_STATUSES = new Set(['已匹配', '已关闭', '已取消', '已成交']);

function publicOperator(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    role: row.role,
    displayName: row.display_name || row.username || row.phone || `账号 ${row.id}`
  };
}

function demandSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    maskedPhone: maskPhone(row.phone),
    serviceType: row.service_type,
    city: row.city,
    address: row.address,
    startTime: row.start_time,
    budget: row.budget,
    familyInfo: row.family_info,
    status: row.status,
    assignedOperatorId: row.assigned_operator_id,
    assignedOperatorName: row.assigned_operator_name,
    assignedOperatorRole: row.assigned_operator_role,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
    lastFollowedUpAt: row.last_followed_up_at,
    nextFollowUpAt: row.next_follow_up_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function followUpToClient(row) {
  return {
    id: row.id,
    demandId: row.demand_id,
    operatorId: row.operator_id,
    operatorName: row.operator_name || row.operator_username || `账号 ${row.operator_id}`,
    method: row.method,
    result: row.result,
    note: row.note,
    contactedAt: row.contacted_at,
    nextFollowUpAt: row.next_follow_up_at,
    createdAt: row.created_at
  };
}

function maskPhone(phone) {
  const text = String(phone || '');
  if (text.length < 7) return text ? '***' : '';
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function auditActor(user) {
  return {
    id: user && user.id,
    name: user ? (user.name || user.username || user.phone || `user:${user.id}`) : 'system',
    role: user && user.role,
    storeId: user && (user.storeId || (user.store && user.store.id)),
    organizationType: user && user.organizationType
  };
}

function parsePositiveInteger(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(Math.floor(number), max);
}

function assertDate(value, field) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${field} is invalid`);
    error.status = 400;
    throw error;
  }
  return date.toISOString();
}

function assertText(value, field, maxLength, required = false) {
  const text = String(value || '').trim();
  if (required && !text) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  if (text.length > maxLength) {
    const error = new Error(`${field} is too long`);
    error.status = 400;
    throw error;
  }
  return text || null;
}

function isBoss(user) {
  return user && user.role === 'boss';
}

function assertDemandPermission(user, demand, action = 'access') {
  if (!user) {
    const error = new Error('Login required');
    error.status = 401;
    throw error;
  }
  if (isBoss(user)) return;
  if (user.role === 'operator' && Number(demand.assigned_operator_id) === Number(user.id)) return;
  const error = new Error(`No permission to ${action} this demand`);
  error.status = 403;
  throw error;
}

async function getDemandForUpdate(client, demandId) {
  const result = await client.query(
    `SELECT d.*, u.username AS assigned_operator_name, u.role AS assigned_operator_role
     FROM demands d
     LEFT JOIN user_accounts u ON u.id = d.assigned_operator_id
     WHERE d.id = $1
     FOR UPDATE OF d`,
    [Number(demandId)]
  );
  return result.rows[0] || null;
}

async function getDemand(demandId) {
  const result = await db.query(
    `SELECT d.*, u.username AS assigned_operator_name, u.role AS assigned_operator_role
     FROM demands d
     LEFT JOIN user_accounts u ON u.id = d.assigned_operator_id
     WHERE d.id = $1`,
    [Number(demandId)]
  );
  return demandSummary(result.rows[0]);
}

async function listAssignableOperators() {
  const result = await db.query(
    `SELECT u.id, u.username, u.phone, u.role, ba.name AS display_name
     FROM user_accounts u
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     WHERE u.status = 'active'
       AND u.role IN ('boss', 'operator')
       AND (
         u.role = 'boss'
         OR ba.id IS NULL
         OR ba.status = '启用'
       )
     ORDER BY
       CASE u.role WHEN 'boss' THEN 0 ELSE 1 END,
       COALESCE(ba.name, u.username, u.phone) ASC,
       u.id ASC`
  );
  return result.rows.map(publicOperator);
}

async function requireAssignableOperator(operatorId, client = db) {
  const result = await client.query(
    `SELECT u.id, u.username, u.phone, u.role, ba.name AS display_name
     FROM user_accounts u
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     WHERE u.id = $1
       AND u.status = 'active'
       AND u.role IN ('boss', 'operator')
       AND (
         u.role = 'boss'
         OR ba.id IS NULL
         OR ba.status = '启用'
       )
     LIMIT 1`,
    [Number(operatorId)]
  );
  if (!result.rows[0]) {
    const error = new Error('Assignable operator not found');
    error.status = 400;
    throw error;
  }
  return publicOperator(result.rows[0]);
}

async function assignDemand(demandId, payload, actorUser) {
  if (!isBoss(actorUser)) {
    const error = new Error('Management role required');
    error.status = 403;
    throw error;
  }

  return db.transaction(async (client) => {
    const before = await getDemandForUpdate(client, demandId);
    if (!before) {
      const error = new Error('Demand not found');
      error.status = 404;
      throw error;
    }

    let operator = null;
    let operatorId = null;
    if (payload.operatorId !== null && payload.operatorId !== undefined && payload.operatorId !== '') {
      operator = await requireAssignableOperator(payload.operatorId, client);
      operatorId = operator.id;
    }

    const result = await client.query(
      `UPDATE demands
       SET assigned_operator_id = $1,
           assigned_at = CASE WHEN $1::integer IS NULL THEN NULL ELSE now() END,
           assigned_by = $2
       WHERE id = $3
       RETURNING *`,
      [operatorId, actorUser.username || actorUser.phone || `user:${actorUser.id}`, Number(demandId)]
    );
    const after = result.rows[0];
    after.assigned_operator_name = operator ? operator.displayName : null;
    after.assigned_operator_role = operator ? operator.role : null;
    await resourceRepository.writeAudit(client, operatorId ? 'assign_operator' : 'unassign_operator', 'demands', demandId, demandSummary(before), demandSummary(after), auditActor(actorUser));
    return demandSummary(after);
  });
}

async function listFollowUps(demandId, user) {
  const demand = await getDemand(demandId);
  if (!demand) {
    const error = new Error('Demand not found');
    error.status = 404;
    throw error;
  }
  assertDemandPermission(user, { assigned_operator_id: demand.assignedOperatorId }, 'view');
  const result = await db.query(
    `SELECT f.*, u.username AS operator_username, ba.name AS operator_name
     FROM demand_follow_ups f
     JOIN user_accounts u ON u.id = f.operator_id
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     WHERE f.demand_id = $1
     ORDER BY f.contacted_at DESC, f.id DESC`,
    [Number(demandId)]
  );
  return {
    demand,
    items: result.rows.map(followUpToClient)
  };
}

async function createFollowUp(demandId, payload, user) {
  const method = String(payload.method || '').trim();
  if (!FOLLOW_UP_METHODS.has(method)) {
    const error = new Error('method must be phone, wechat, visit or other');
    error.status = 400;
    throw error;
  }
  const result = assertText(payload.result, 'result', 200, false);
  const note = assertText(payload.note, 'note', 2000, false);
  const contactedAt = assertDate(payload.contactedAt || new Date().toISOString(), 'contactedAt');
  const nextFollowUpAt = assertDate(payload.nextFollowUpAt, 'nextFollowUpAt');

  return db.transaction(async (client) => {
    const demandBefore = await getDemandForUpdate(client, demandId);
    if (!demandBefore) {
      const error = new Error('Demand not found');
      error.status = 404;
      throw error;
    }
    assertDemandPermission(user, demandBefore, 'follow up');

    const insert = await client.query(
      `INSERT INTO demand_follow_ups (
        demand_id, operator_id, method, result, note, contacted_at, next_follow_up_at,
        source_store_id, actor_store_id_snapshot, actor_organization_snapshot
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9)
       RETURNING *`,
      [
        Number(demandId),
        Number(user.id),
        method,
        result,
        note,
        contactedAt,
        nextFollowUpAt,
        user.storeId || (user.store && user.store.id) || null,
        user.organizationType || null
      ]
    );

    const nextStatus = PENDING_STATUSES.has(demandBefore.status) ? '已联系' : demandBefore.status;
    await client.query(
      `UPDATE demands
       SET status = $1,
           last_followed_up_at = $2,
           next_follow_up_at = $3
       WHERE id = $4`,
      [nextStatus, contactedAt, nextFollowUpAt, Number(demandId)]
    );
    const demandAfter = await getDemandForUpdate(client, demandId);
    await resourceRepository.writeAudit(client, 'follow_up', 'demand_follow_ups', insert.rows[0].id, null, followUpToClient(insert.rows[0]), auditActor(user));
    await resourceRepository.writeAudit(client, 'update_follow_up_time', 'demands', demandId, demandSummary(demandBefore), demandSummary(demandAfter), auditActor(user));
    await notificationRepository.notifyByPhone(client, demandAfter.phone, 'customer', {
      messageType: 'demand_follow_up',
      title: '已安排跟进',
      summary: '服务顾问已更新您的需求跟进记录，请进入小程序查看。',
      entityType: 'demands',
      entityId: demandId,
      pagePath: '/pages/demand-detail/demand-detail',
      pageParams: { id: Number(demandId) },
      dedupeKey: `demand-follow-up:${insert.rows[0].id}`,
      channels: ['in_app', 'wechat_subscription']
    });
    return {
      demand: demandSummary(demandAfter),
      followUp: followUpToClient(insert.rows[0])
    };
  });
}

function todoCategoryCondition(category, startIndex) {
  const todayStart = 'CURRENT_DATE';
  const tomorrowStart = "(CURRENT_DATE + INTERVAL '1 day')";
  switch (category) {
    case 'today':
      return { clause: `d.assigned_operator_id IS NOT NULL AND d.next_follow_up_at >= ${todayStart} AND d.next_follow_up_at < ${tomorrowStart}`, params: [] };
    case 'overdue':
      return { clause: `d.assigned_operator_id IS NOT NULL AND d.next_follow_up_at < ${todayStart}`, params: [] };
    case 'unassigned':
      return { clause: 'd.assigned_operator_id IS NULL', params: [] };
    case 'completedToday':
      return { clause: `d.last_followed_up_at >= ${todayStart} AND d.last_followed_up_at < ${tomorrowStart}`, params: [] };
    case 'future':
      return { clause: `d.assigned_operator_id IS NOT NULL AND d.next_follow_up_at >= ${tomorrowStart}`, params: [] };
    default:
      return { clause: '1 = 1', params: [] };
  }
}

function todoBaseWhere(user, filters = {}, includeKeyword = true) {
  const where = [`COALESCE(d.status, '') <> ALL($1::text[])`];
  const params = [[...CLOSED_TODO_STATUSES]];
  if (user.role === 'operator') {
    params.push(Number(user.id));
    where.push(`d.assigned_operator_id = $${params.length}`);
  } else if (filters.operatorId) {
    params.push(Number(filters.operatorId));
    where.push(`d.assigned_operator_id = $${params.length}`);
  }
  if (includeKeyword && filters.keyword) {
    params.push(`%${String(filters.keyword).trim()}%`);
    where.push(`(
      d.customer_name ILIKE $${params.length}
      OR d.phone ILIKE $${params.length}
      OR d.service_type ILIKE $${params.length}
      OR d.address ILIKE $${params.length}
      OR d.status ILIKE $${params.length}
    )`);
  }
  return { where, params };
}

async function todoStats(user, filters = {}) {
  const base = todoBaseWhere(user, filters, Boolean(filters.keyword));
  const categories = ['today', 'overdue', 'unassigned', 'completedToday', 'future'];
  const stats = {};
  for (const category of categories) {
    const condition = todoCategoryCondition(category);
    const result = await db.query(
      `SELECT count(*)::integer AS count
       FROM demands d
       WHERE ${base.where.join(' AND ')}
         AND ${condition.clause}`,
      base.params.concat(condition.params)
    );
    stats[category] = result.rows[0].count;
  }
  return stats;
}

async function listTodos(user, filters = {}) {
  if (!user || !['boss', 'operator'].includes(user.role)) {
    const error = new Error(user ? 'Permission denied' : 'Login required');
    error.status = user ? 403 : 401;
    throw error;
  }
  const category = ['today', 'overdue', 'unassigned', 'completedToday', 'future'].includes(filters.category)
    ? filters.category
    : 'today';
  const page = parsePositiveInteger(filters.page, 1, 100000);
  const pageSize = parsePositiveInteger(filters.pageSize, 20, 50);
  const offset = (page - 1) * pageSize;
  const base = todoBaseWhere(user, filters, true);
  const condition = todoCategoryCondition(category);
  const params = base.params.concat(condition.params);
  const whereSql = `${base.where.join(' AND ')} AND ${condition.clause}`;

  const [stats, countResult, rowsResult] = await Promise.all([
    todoStats(user, filters),
    db.query(`SELECT count(*)::integer AS total FROM demands d WHERE ${whereSql}`, params),
    db.query(
      `SELECT d.*, u.username AS assigned_operator_name, u.role AS assigned_operator_role
       FROM demands d
       LEFT JOIN user_accounts u ON u.id = d.assigned_operator_id
       WHERE ${whereSql}
       ORDER BY
         CASE WHEN d.next_follow_up_at IS NULL THEN 1 ELSE 0 END,
         d.next_follow_up_at ASC,
         d.updated_at DESC,
         d.id DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      params.concat([pageSize, offset])
    )
  ]);
  const total = countResult.rows[0].total;
  return {
    category,
    stats,
    items: rowsResult.rows.map((row) => {
      const item = demandSummary(row);
      item.isOverdue = Boolean(row.next_follow_up_at && new Date(row.next_follow_up_at) < new Date(new Date().toDateString()));
      return item;
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

module.exports = {
  assignDemand,
  createFollowUp,
  getDemand,
  listAssignableOperators,
  listFollowUps,
  listTodos,
  maskPhone
};
