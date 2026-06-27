const db = require('../db');
const companyProfileRepository = require('./companyProfileRepository');
const resourceRepository = require('./resourceRepository');

const openDemandStatuses = ['待处理', '已联系', '匹配中', '已匹配', '待跟进', '待匹配', '已推荐', '已面试', '顾问待联系'];
const certifiedAyiStatuses = ['已认证', 'approved'];

async function getMiniprogramData() {
  const [ayis, demands, stores, serviceModules, banners, companyProfile] = await Promise.all([
    resourceRepository.list('ayis'),
    resourceRepository.list('demands'),
    resourceRepository.list('stores'),
    resourceRepository.list('serviceModules'),
    resourceRepository.list('banners'),
    companyProfileRepository.getProfile()
  ]);

  return {
    source: 'postgres',
    ayis: ayis.filter((item) => certifiedAyiStatuses.includes(item.status) && item.visible !== false),
    demands: demands.filter((item) => openDemandStatuses.includes(item.status)),
    stores: stores.filter((item) => item.visible !== false),
    serviceModules: serviceModules.filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)),
    banners: banners.filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)),
    companyProfile: companyProfileRepository.publicProfile(companyProfile)
  };
}

function rowsToNameValue(rows) {
  return rows.map((row) => ({ name: row.name || '未填写', value: Number(row.value) || 0 }));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDashboardRange(filters = {}) {
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const preset = filters.preset || 'today';
  let start = utcToday;
  let end = utcToday;
  let label = '今日';

  if (preset === 'yesterday') {
    start = addDays(utcToday, -1);
    end = addDays(utcToday, -1);
    label = '昨日';
  } else if (preset === 'last7') {
    start = addDays(utcToday, -6);
    label = '近 7 天';
  } else if (preset === 'last30') {
    start = addDays(utcToday, -29);
    label = '近 30 天';
  } else if (preset === 'month') {
    start = new Date(Date.UTC(utcToday.getUTCFullYear(), utcToday.getUTCMonth(), 1));
    label = '本月';
  } else if (preset === 'lastMonth') {
    start = new Date(Date.UTC(utcToday.getUTCFullYear(), utcToday.getUTCMonth() - 1, 1));
    end = new Date(Date.UTC(utcToday.getUTCFullYear(), utcToday.getUTCMonth(), 0));
    label = '上月';
  } else if (preset === 'custom') {
    const customStart = parseDateInput(filters.startDate);
    const customEnd = parseDateInput(filters.endDate);
    if (customStart && customEnd && customStart <= customEnd) {
      start = customStart;
      end = customEnd;
      label = `${toDateString(start)} 至 ${toDateString(end)}`;
    }
  }

  const dayCount = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return {
    preset,
    startDate: toDateString(start),
    endDate: toDateString(end),
    previousStartDate: toDateString(addDays(start, -dayCount)),
    previousEndDate: toDateString(addDays(start, -1)),
    label,
    dayCount
  };
}

function dashboardNumber(value) {
  return Number(value) || 0;
}

function dashboardDelta(current, previous) {
  const diff = dashboardNumber(current) - dashboardNumber(previous);
  if (!previous) return { diff, text: diff === 0 ? '较上一周期持平' : `较上一周期 ${diff > 0 ? '+' : ''}${diff}` };
  const rate = Math.round((diff / Number(previous)) * 100);
  return { diff, rate, text: `较上一周期 ${diff > 0 ? '+' : ''}${diff} (${rate > 0 ? '+' : ''}${rate}%)` };
}

function effectiveAuditWhereClause(alias = 'audit_logs') {
  return `${alias}.action IN ('create','update','dispatch','recommend','expire','customer_confirm','customer_reject','assign','follow_up','status_update')
    AND COALESCE(${alias}.resource_type, ${alias}.entity_type, '') NOT IN ('auditLogs','auth_sessions')
    AND COALESCE(${alias}.resource_type, ${alias}.entity_type, '') <> ''
    AND ${alias}.action NOT IN ('login','logout','export','view','search','page')`;
}

function normalizeDashboardMetric(metric) {
  const allowed = new Set([
    'customersTotal',
    'ayisTotal',
    'demandsTotal',
    'todayCustomers',
    'todayAyis',
    'rangeCustomers',
    'rangeAyis',
    'ayiStatus',
    'effectiveOperations'
  ]);
  return allowed.has(metric) ? metric : 'customersTotal';
}

function normalizeCompareMetric(metric) {
  const allowed = new Set(['newCustomers', 'newAyis', 'newDemands', 'followUps', 'appointments', 'effectiveOperations']);
  return allowed.has(metric) ? metric : 'effectiveOperations';
}

function buildDashboardCards(counts, previousCounts, range, ayiStatusRows) {
  const statusText = ayiStatusRows
    .slice(0, 5)
    .map((row) => `${row.name || '未填写'} ${Number(row.value) || 0}`)
    .join(' / ');
  const definitions = [
    ['customersTotal', '客户总数', counts.customer_count, previousCounts.customer_count, '按客户需求手机号去重，统计至当前日期范围结束日'],
    ['ayisTotal', '阿姨总数', counts.ayi_count, previousCounts.ayi_count, '阿姨资料累计数量'],
    ['demandsTotal', '客户需求总数', counts.demand_count, previousCounts.demand_count, '客户需求累计数量'],
    ['todayCustomers', '今日新增客户', counts.today_customers, counts.yesterday_customers, '按今日新建需求手机号去重'],
    ['todayAyis', '今日新增阿姨', counts.today_ayis, counts.yesterday_ayis, '今日录入阿姨资料'],
    ['rangeCustomers', '范围新增客户', counts.range_customers, previousCounts.range_customers, `统计范围：${range.label}`],
    ['rangeAyis', '范围新增阿姨', counts.range_ayis, previousCounts.range_ayis, `统计范围：${range.label}`],
    ['ayiStatus', '阿姨状态概览', counts.ayi_count, previousCounts.ayi_count, statusText || '暂无服务状态数据']
  ];

  return definitions.map(([key, label, value, previousValue, note]) => ({
    key,
    label,
    value: dashboardNumber(value),
    note,
    rangeLabel: range.label,
    delta: dashboardDelta(value, previousValue)
  }));
}

async function getDashboard(filters = {}) {
  const range = getDashboardRange(filters);
  const metric = normalizeDashboardMetric(filters.metric);
  const compareMetric = normalizeCompareMetric(filters.compareMetric);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const detailFilters = {
    storeName: filters.storeName || '',
    status: filters.status || '',
    serviceType: filters.serviceType || '',
    keyword: filters.keyword || ''
  };

  const countSql = `
    SELECT
      (SELECT count(DISTINCT phone) FROM demands WHERE created_at < ($2::date + INTERVAL '1 day')) AS customer_count,
      (SELECT count(*) FROM demands WHERE created_at < ($2::date + INTERVAL '1 day')) AS demand_count,
      (SELECT count(*) FROM ayis WHERE created_at < ($2::date + INTERVAL '1 day')) AS ayi_count,
      (SELECT count(DISTINCT phone) FROM demands WHERE created_at >= CURRENT_DATE AND created_at < (CURRENT_DATE + INTERVAL '1 day')) AS today_customers,
      (SELECT count(*) FROM ayis WHERE created_at >= CURRENT_DATE AND created_at < (CURRENT_DATE + INTERVAL '1 day')) AS today_ayis,
      (SELECT count(DISTINCT phone) FROM demands WHERE created_at >= (CURRENT_DATE - INTERVAL '1 day') AND created_at < CURRENT_DATE) AS yesterday_customers,
      (SELECT count(*) FROM ayis WHERE created_at >= (CURRENT_DATE - INTERVAL '1 day') AND created_at < CURRENT_DATE) AS yesterday_ayis,
      (SELECT count(DISTINCT phone) FROM demands WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')) AS range_customers,
      (SELECT count(*) FROM ayis WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')) AS range_ayis,
      (SELECT count(*) FROM audit_logs WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day') AND ${effectiveAuditWhereClause('audit_logs')}) AS effective_operations
  `;
  const [countsResult, previousCountsResult, demandStatuses, ayiStatuses, serviceTypes, trends, storeComparison, details] = await Promise.all([
    db.query(countSql, [range.startDate, range.endDate]),
    db.query(countSql, [range.previousStartDate, range.previousEndDate]),
    db.query(`
      SELECT status AS name, count(*) AS value
      FROM demands
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY status
      ORDER BY value DESC, status ASC
    `, [range.startDate, range.endDate]),
    db.query(`
      SELECT COALESCE(av.service_status, ayis.status, '未填写') AS name, count(*) AS value
      FROM ayis
      LEFT JOIN ayi_availability av ON av.ayi_id = ayis.id
      WHERE ayis.created_at < ($1::date + INTERVAL '1 day')
      GROUP BY COALESCE(av.service_status, ayis.status, '未填写')
      ORDER BY value DESC, name ASC
    `, [range.endDate]),
    db.query(`
      SELECT service_type AS name, count(*) AS value
      FROM (
        SELECT service_type FROM demands WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
        UNION ALL
        SELECT service_type FROM ayis WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
      ) source
      GROUP BY service_type
      ORDER BY value DESC, service_type ASC
    `, [range.startDate, range.endDate]),
    getDashboardTrends(range),
    getDashboardStoreComparison(compareMetric, range),
    getDashboardDetails(metric, range, detailFilters, pageSize, offset)
  ]);

  const counts = countsResult.rows[0] || {};
  const previousCounts = previousCountsResult.rows[0] || {};
  const cards = buildDashboardCards(counts, previousCounts, range, rowsToNameValue(ayiStatuses.rows));

  return {
    source: 'postgres',
    range,
    activeMetric: metric,
    compareMetric,
    cards,
    distributions: {
      demandStatuses: rowsToNameValue(demandStatuses.rows),
      ayiStatuses: rowsToNameValue(ayiStatuses.rows),
      serviceTypes: rowsToNameValue(serviceTypes.rows)
    },
    trends,
    storeComparison,
    details,
    tables: [
      { title: '客户需求状态分布', rows: rowsToNameValue(demandStatuses.rows) },
      { title: '阿姨状态分布', rows: rowsToNameValue(ayiStatuses.rows) },
      { title: '服务类型分布', rows: rowsToNameValue(serviceTypes.rows) }
    ],
    effectiveOperationDefinition: [
      '新增客户或需求',
      '修改客户或需求有效资料',
      '新增或修改阿姨资料',
      '新增跟进记录',
      '新增或修改面试安排',
      '推荐阿姨和业务状态处理'
    ]
  };
}

async function getDashboardTrends(range) {
  const result = await db.query(`
    WITH days AS (
      SELECT generate_series($1::date, $2::date, INTERVAL '1 day')::date AS day
    )
    SELECT
      to_char(days.day, 'YYYY-MM-DD') AS date,
      COALESCE(customers.value, 0)::integer AS "newCustomers",
      COALESCE(ayis.value, 0)::integer AS "newAyis",
      COALESCE(demands.value, 0)::integer AS "newDemands",
      COALESCE(ops.value, 0)::integer AS "effectiveOperations"
    FROM days
    LEFT JOIN (
      SELECT created_at::date AS day, count(DISTINCT phone) AS value
      FROM demands
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY created_at::date
    ) customers ON customers.day = days.day
    LEFT JOIN (
      SELECT created_at::date AS day, count(*) AS value
      FROM ayis
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY created_at::date
    ) ayis ON ayis.day = days.day
    LEFT JOIN (
      SELECT created_at::date AS day, count(*) AS value
      FROM demands
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY created_at::date
    ) demands ON demands.day = days.day
    LEFT JOIN (
      SELECT created_at::date AS day, count(*) AS value
      FROM audit_logs
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
        AND ${effectiveAuditWhereClause('audit_logs')}
      GROUP BY created_at::date
    ) ops ON ops.day = days.day
    ORDER BY days.day ASC
  `, [range.startDate, range.endDate]);
  return result.rows;
}

async function getDashboardStoreComparison(metric, range) {
  const queries = {
    newCustomers: `
      SELECT '未归属' AS "storeName", count(DISTINCT phone)::integer AS value
      FROM demands
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
    `,
    newAyis: `
      SELECT COALESCE(stores.name, '未归属') AS "storeName", count(ayis.id)::integer AS value
      FROM ayis
      LEFT JOIN stores ON stores.id = ayis.store_id
      WHERE ayis.created_at >= $1::date AND ayis.created_at < ($2::date + INTERVAL '1 day')
      GROUP BY COALESCE(stores.name, '未归属')
    `,
    newDemands: `
      SELECT '未归属' AS "storeName", count(*)::integer AS value
      FROM demands
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
    `,
    followUps: `
      SELECT '未归属' AS "storeName", count(*)::integer AS value
      FROM demand_follow_ups
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
    `,
    appointments: `
      SELECT '未归属' AS "storeName", count(*)::integer AS value
      FROM appointments
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
    `,
    effectiveOperations: `
      SELECT '未归属' AS "storeName", count(*)::integer AS value
      FROM audit_logs
      WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
        AND ${effectiveAuditWhereClause('audit_logs')}
    `
  };
  const result = await db.query(`
    SELECT "storeName", COALESCE(value, 0)::integer AS value
    FROM (${queries[metric] || queries.effectiveOperations}) source
    WHERE COALESCE(value, 0) > 0
    ORDER BY value DESC, "storeName" ASC
  `, [range.startDate, range.endDate]);
  return result.rows;
}

function addDashboardFilter(where, params, value, clause) {
  if (value === undefined || value === null || value === '') return;
  params.push(value);
  where.push(clause.replace(/\?/g, `$${params.length}`));
}

async function getDashboardDetails(metric, range, filters, pageSize, offset) {
  if (metric === 'ayisTotal' || metric === 'rangeAyis' || metric === 'todayAyis' || metric === 'ayiStatus') {
    return getDashboardAyiDetails(metric, range, filters, pageSize, offset);
  }
  if (metric === 'effectiveOperations') {
    return getDashboardOperationDetails(range, filters, pageSize, offset);
  }
  return getDashboardDemandDetails(metric, range, filters, pageSize, offset);
}

async function getDashboardDemandDetails(metric, range, filters, pageSize, offset) {
  const params = [];
  const where = [];
  if (metric === 'todayCustomers') {
    where.push(`demands.created_at >= CURRENT_DATE AND demands.created_at < (CURRENT_DATE + INTERVAL '1 day')`);
  } else if (metric === 'rangeCustomers') {
    addDashboardFilter(where, params, range.startDate, 'demands.created_at >= ?::date');
    addDashboardFilter(where, params, range.endDate, 'demands.created_at < (?::date + INTERVAL \'1 day\')');
  } else {
    addDashboardFilter(where, params, range.endDate, 'demands.created_at < (?::date + INTERVAL \'1 day\')');
  }
  addDashboardFilter(where, params, filters.status, 'demands.status = ?');
  addDashboardFilter(where, params, filters.serviceType, 'demands.service_type = ?');
  if (filters.keyword) {
    addDashboardFilter(where, params, `%${filters.keyword}%`, `(demands.customer_name ILIKE ? OR demands.phone ILIKE ? OR demands.service_type ILIKE ?)`);
  }
  if (filters.storeName && filters.storeName !== '未归属') where.push('1 = 0');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize, offset);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;
  const result = await db.query(`
    SELECT
      count(*) OVER()::integer AS total,
      demands.id,
      demands.customer_name AS name,
      demands.phone,
      demands.service_type AS "serviceType",
      demands.status,
      '未归属' AS "storeName",
      COALESCE(accounts.username, demands.consultant, '-') AS "operator",
      demands.created_at AS "createdAt"
    FROM demands
    LEFT JOIN user_accounts accounts ON accounts.id = demands.assigned_operator_id
    ${whereSql}
    ORDER BY demands.created_at DESC, demands.id DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, params);
  return {
    type: 'demands',
    page: Math.floor(offset / pageSize) + 1,
    pageSize,
    total: result.rows[0] ? Number(result.rows[0].total) : 0,
    rows: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      serviceType: row.serviceType,
      status: row.status,
      storeName: row.storeName,
      operator: row.operator,
      createdAt: row.createdAt
    }))
  };
}

async function getDashboardAyiDetails(metric, range, filters, pageSize, offset) {
  const params = [];
  const where = [];
  if (metric === 'todayAyis') {
    where.push(`ayis.created_at >= CURRENT_DATE AND ayis.created_at < (CURRENT_DATE + INTERVAL '1 day')`);
  } else if (metric === 'rangeAyis') {
    addDashboardFilter(where, params, range.startDate, 'ayis.created_at >= ?::date');
    addDashboardFilter(where, params, range.endDate, 'ayis.created_at < (?::date + INTERVAL \'1 day\')');
  } else {
    addDashboardFilter(where, params, range.endDate, 'ayis.created_at < (?::date + INTERVAL \'1 day\')');
  }
  addDashboardFilter(where, params, filters.status, `COALESCE(av.service_status, ayis.status, '未填写') = ?`);
  addDashboardFilter(where, params, filters.serviceType, 'ayis.service_type = ?');
  addDashboardFilter(where, params, filters.storeName === '未归属' ? null : filters.storeName, 'stores.name = ?');
  if (filters.storeName === '未归属') where.push('stores.id IS NULL');
  if (filters.keyword) {
    addDashboardFilter(where, params, `%${filters.keyword}%`, `(ayis.name ILIKE ? OR ayis.phone ILIKE ? OR ayis.service_type ILIKE ?)`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(pageSize, offset);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;
  const result = await db.query(`
    SELECT
      count(*) OVER()::integer AS total,
      ayis.id,
      ayis.name,
      ayis.phone,
      ayis.service_type AS "serviceType",
      COALESCE(av.service_status, ayis.status, '未填写') AS status,
      COALESCE(stores.name, '未归属') AS "storeName",
      ayis.source AS "operator",
      ayis.created_at AS "createdAt"
    FROM ayis
    LEFT JOIN stores ON stores.id = ayis.store_id
    LEFT JOIN ayi_availability av ON av.ayi_id = ayis.id
    ${whereSql}
    ORDER BY ayis.created_at DESC, ayis.id DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, params);
  return {
    type: 'ayis',
    page: Math.floor(offset / pageSize) + 1,
    pageSize,
    total: result.rows[0] ? Number(result.rows[0].total) : 0,
    rows: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      serviceType: row.serviceType,
      status: row.status,
      storeName: row.storeName,
      operator: row.operator,
      createdAt: row.createdAt
    }))
  };
}

async function getDashboardOperationDetails(range, filters, pageSize, offset) {
  const params = [];
  const where = [effectiveAuditWhereClause('audit_logs')];
  addDashboardFilter(where, params, range.startDate, 'audit_logs.created_at >= ?::date');
  addDashboardFilter(where, params, range.endDate, 'audit_logs.created_at < (?::date + INTERVAL \'1 day\')');
  addDashboardFilter(where, params, filters.status, 'audit_logs.action = ?');
  if (filters.keyword) {
    addDashboardFilter(where, params, `%${filters.keyword}%`, `(audit_logs.actor ILIKE ? OR audit_logs.action ILIKE ? OR COALESCE(audit_logs.resource_type, audit_logs.entity_type, '') ILIKE ?)`);
  }
  if (filters.storeName && filters.storeName !== '未归属') where.push('1 = 0');
  const whereSql = `WHERE ${where.join(' AND ')}`;
  params.push(pageSize, offset);
  const limitParam = `$${params.length - 1}`;
  const offsetParam = `$${params.length}`;
  const result = await db.query(`
    SELECT
      count(*) OVER()::integer AS total,
      audit_logs.id,
      audit_logs.actor AS name,
      audit_logs.action AS status,
      COALESCE(audit_logs.resource_type, audit_logs.entity_type, '-') AS "serviceType",
      '未归属' AS "storeName",
      audit_logs.actor AS "operator",
      audit_logs.created_at AS "createdAt"
    FROM audit_logs
    ${whereSql}
    ORDER BY audit_logs.created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, params);
  return {
    type: 'operations',
    page: Math.floor(offset / pageSize) + 1,
    pageSize,
    total: result.rows[0] ? Number(result.rows[0].total) : 0,
    rows: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: '',
      serviceType: row.serviceType,
      status: row.status,
      storeName: row.storeName,
      operator: row.operator,
      createdAt: row.createdAt
    }))
  };
}

async function createDispatch(payload, actor) {
  if (!payload || !payload.ayiName) {
    throw new Error('ayiName is required');
  }

  return db.transaction(async (client) => {
    let orderId = payload.orderId ? Number(payload.orderId) : null;
    if (!orderId && payload.orderNo) {
      const order = await client.query('SELECT id FROM orders WHERE order_no = $1', [payload.orderNo]);
      orderId = order.rows[0] ? order.rows[0].id : null;
    }

    const result = await client.query(
      `INSERT INTO order_dispatches (order_id, order_no, ayi_name, ayi_phone, dispatch_type, status, assigned_by, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        orderId,
        payload.orderNo || null,
        payload.ayiName,
        payload.ayiPhone || null,
        payload.dispatchType || '人工派单',
        payload.status || '已派单',
        payload.assignedBy || actor.name || '后台',
        payload.note || null
      ]
    );

    const dispatch = result.rows[0];
    await resourceRepository.writeAudit(client, 'dispatch', 'order_dispatches', dispatch.id, null, dispatch, actor);
    return {
      id: dispatch.id,
      orderId: dispatch.order_id,
      orderNo: dispatch.order_no,
      ayiName: dispatch.ayi_name,
      ayiPhone: dispatch.ayi_phone,
      dispatchType: dispatch.dispatch_type,
      status: dispatch.status,
      assignedBy: dispatch.assigned_by,
      note: dispatch.note,
      createdAt: dispatch.created_at,
      updatedAt: dispatch.updated_at
    };
  });
}

async function listDispatches(filter = null) {
  const clause = filter && filter.clause ? ` WHERE ${filter.clause}` : '';
  const result = await db.query(
    `SELECT * FROM order_dispatches${clause} ORDER BY created_at DESC, id DESC`,
    filter ? (filter.params || []) : []
  );
  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no,
    ayiName: row.ayi_name,
    ayiPhone: row.ayi_phone,
    dispatchType: row.dispatch_type,
    status: row.status,
    assignedBy: row.assigned_by,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'session',
  'session_key',
  'openid',
  'secret',
  'appsecret',
  'private_key',
  'authorization',
  'cookie',
  'customer_access_token_hash'
]);

function isSensitiveKey(key) {
  const normalized = String(key || '').toLowerCase();
  return SENSITIVE_KEYS.has(normalized) || normalized.includes('password') || normalized.includes('token');
}

function sanitizeAuditValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    isSensitiveKey(key) ? '[已隐藏]' : sanitizeAuditValue(item)
  ]));
}

function buildAuditFilters(filters = {}) {
  const where = [];
  const values = [];

  function add(value, clause) {
    if (value === undefined || value === null || value === '') return;
    values.push(value);
    where.push(clause.replace('?', `$${values.length}`));
  }

  if (filters.actor) add(`%${filters.actor}%`, 'actor ILIKE ?');
  if (filters.role) add(filters.role, 'actor_role = ?');
  if (filters.action) add(filters.action, 'action = ?');
  if (filters.entityType) {
    values.push(filters.entityType, filters.entityType);
    where.push(`(entity_type = $${values.length - 1} OR resource_type = $${values.length})`);
  }
  add(filters.startTime, 'created_at >= ?');
  add(filters.endTime, 'created_at <= ?');

  if (filters.keyword) {
    values.push(`%${filters.keyword}%`);
    where.push(`(
      actor ILIKE $${values.length}
      OR actor_role ILIKE $${values.length}
      OR action ILIKE $${values.length}
      OR entity_type ILIKE $${values.length}
      OR resource_type ILIKE $${values.length}
      OR resource_id_text ILIKE $${values.length}
      OR before_summary ILIKE $${values.length}
      OR after_summary ILIKE $${values.length}
    )`);
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
}

function auditRowToClient(row) {
  return {
    id: row.id,
    actor: row.actor,
    actorRole: row.actorRole,
    action: row.action,
    entityType: row.entityType,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    beforeSummary: row.beforeSummary,
    afterSummary: row.afterSummary,
    beforeData: sanitizeAuditValue(row.beforeData),
    afterData: sanitizeAuditValue(row.afterData),
    createdAt: row.createdAt
  };
}

async function listAuditLogs(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const requestedPageSize = Number(filters.pageSize) || Number(filters.limit) || 20;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  const offset = (page - 1) * pageSize;
  const built = buildAuditFilters(filters);
  const countResult = await db.query(
    `SELECT count(*) AS total FROM audit_logs ${built.clause}`,
    built.values
  );
  const result = await db.query(
    `SELECT id, actor, actor_role AS "actorRole", action, entity_type AS "entityType",
            resource_type AS "resourceType", resource_id_text AS "resourceId",
            before_data AS "beforeData", after_data AS "afterData",
            before_summary AS "beforeSummary", after_summary AS "afterSummary",
            created_at AS "createdAt"
     FROM audit_logs
     ${built.clause}
     ORDER BY created_at DESC
     LIMIT $${built.values.length + 1}
     OFFSET $${built.values.length + 2}`,
    built.values.concat([pageSize, offset])
  );
  const total = Number(countResult.rows[0].total) || 0;
  return {
    items: result.rows.map(auditRowToClient),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

async function listAuditLogsForExport(filters = {}) {
  const limit = Math.min(10000, Math.max(1, Number(filters.limit) || 10000));
  const built = buildAuditFilters(filters);
  const result = await db.query(
    `SELECT id, actor, actor_role AS "actorRole", action, entity_type AS "entityType",
            resource_type AS "resourceType", resource_id_text AS "resourceId",
            before_data AS "beforeData", after_data AS "afterData",
            before_summary AS "beforeSummary", after_summary AS "afterSummary",
            created_at AS "createdAt"
     FROM audit_logs
     ${built.clause}
     ORDER BY created_at DESC
     LIMIT $${built.values.length + 1}`,
    built.values.concat([limit])
  );
  return result.rows.map(auditRowToClient);
}

async function writeAuditExport(actor, filters, count) {
  await db.transaction(async (client) => {
    await resourceRepository.writeAudit(client, 'export', 'auditLogs', 'export', null, {
      filters,
      count
    }, actor);
  });
}

module.exports = {
  createDispatch,
  getDashboard,
  getMiniprogramData,
  listAuditLogs,
  listAuditLogsForExport,
  writeAuditExport,
  listDispatches
};
