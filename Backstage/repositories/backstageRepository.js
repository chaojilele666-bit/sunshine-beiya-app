const db = require('../db');
const resourceRepository = require('./resourceRepository');

const openDemandStatuses = ['待跟进', '待匹配', '已匹配', '已面试', '顾问待联系'];
const certifiedAyiStatuses = ['已认证', 'approved'];

async function getMiniprogramData() {
  const [ayis, demands, stores, serviceModules, banners] = await Promise.all([
    resourceRepository.list('ayis'),
    resourceRepository.list('demands'),
    resourceRepository.list('stores'),
    resourceRepository.list('serviceModules'),
    resourceRepository.list('banners')
  ]);

  return {
    source: 'postgres',
    ayis: ayis.filter((item) => certifiedAyiStatuses.includes(item.status) && item.visible !== false),
    demands: demands.filter((item) => openDemandStatuses.includes(item.status)),
    stores: stores.filter((item) => item.visible !== false),
    serviceModules: serviceModules.filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)),
    banners: banners.filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
  };
}

function rowsToNameValue(rows) {
  return rows.map((row) => ({ name: row.name || '未填写', value: Number(row.value) || 0 }));
}

async function getDashboard() {
  const result = await db.query(`
    WITH counts AS (
      SELECT
        (SELECT count(DISTINCT phone) FROM demands) AS customer_count,
        (SELECT count(*) FROM demands) AS demand_count,
        (SELECT count(*) FROM ayis) AS ayi_count,
        (SELECT count(*) FROM ayis WHERE status = '已认证') AS certified_ayi_count,
        (SELECT count(*) FROM ayis WHERE status = '待审核') AS pending_ayi_count,
        (SELECT count(*) FROM demands WHERE created_at >= CURRENT_DATE) AS today_demands,
        (SELECT count(*) FROM ayis WHERE created_at >= CURRENT_DATE) AS today_ayis,
        (SELECT count(*) FROM audit_logs WHERE created_at >= CURRENT_DATE AND action IN ('create','update','delete','dispatch')) AS today_changes,
        (SELECT count(*) FROM order_dispatches WHERE created_at >= CURRENT_DATE) AS today_dispatches,
        (SELECT count(*) FROM appointments) AS appointment_count,
        (SELECT count(*) FROM applications) AS application_count,
        (SELECT count(*) FROM orders) AS order_count
    )
    SELECT * FROM counts
  `);
  const counts = result.rows[0];

  const [demandStatuses, ayiStatuses, serviceTypes, orderStatuses, recentLogs] = await Promise.all([
    db.query(`SELECT status AS name, count(*) AS value FROM demands GROUP BY status ORDER BY value DESC, status ASC`),
    db.query(`SELECT status AS name, count(*) AS value FROM ayis GROUP BY status ORDER BY value DESC, status ASC`),
    db.query(`
      SELECT service_type AS name, count(*) AS value
      FROM (
        SELECT service_type FROM demands
        UNION ALL
        SELECT service_type FROM ayis
      ) source
      GROUP BY service_type
      ORDER BY value DESC, service_type ASC
    `),
    db.query(`SELECT status AS name, count(*) AS value FROM orders GROUP BY status ORDER BY value DESC, status ASC`),
    db.query(`
      SELECT actor, actor_role AS "actorRole", action, resource_type AS "resourceType", resource_id_text AS "resourceId", after_summary AS "afterSummary", created_at AS "createdAt"
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `)
  ]);

  return {
    source: 'postgres',
    cards: [
      { label: '客户总数', value: Number(counts.customer_count) || 0, note: '按需求手机号去重' },
      { label: '阿姨总数', value: Number(counts.ayi_count) || 0, note: '阿姨资料数量' },
      { label: '已认证阿姨', value: Number(counts.certified_ayi_count) || 0, note: '可对小程序展示' },
      { label: '待审核阿姨', value: Number(counts.pending_ayi_count) || 0, note: '需要运营处理' },
      { label: '客户需求总数', value: Number(counts.demand_count) || 0, note: '累计需求' },
      { label: '今日新增客户需求', value: Number(counts.today_demands) || 0, note: '今日创建' },
      { label: '今日新增阿姨', value: Number(counts.today_ayis) || 0, note: '今日创建' },
      { label: '今日修改记录', value: Number(counts.today_changes) || 0, note: '来自 audit_logs' },
      { label: '今日派单', value: Number(counts.today_dispatches) || 0, note: '人工派单记录' },
      { label: '预约面试', value: Number(counts.appointment_count) || 0, note: '累计预约' },
      { label: '接单申请', value: Number(counts.application_count) || 0, note: '累计申请' },
      { label: '订单数量', value: Number(counts.order_count) || 0, note: '累计订单' }
    ],
    tables: [
      { title: '客户需求状态分布', rows: rowsToNameValue(demandStatuses.rows) },
      { title: '阿姨审核状态分布', rows: rowsToNameValue(ayiStatuses.rows) },
      { title: '服务类型分布', rows: rowsToNameValue(serviceTypes.rows) },
      { title: '订单状态分布', rows: rowsToNameValue(orderStatuses.rows) },
      {
        title: '最近后台操作记录',
        rows: recentLogs.rows.map((row) => ({
          name: `${row.actor || 'system'} ${row.action} ${row.resourceType || '-'}`,
          value: row.resourceId || '-',
          note: row.createdAt
        }))
      }
    ],
    recentLogs: recentLogs.rows
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

async function listAuditLogs(limit = 100) {
  const result = await db.query(
    `SELECT id, actor, actor_role AS "actorRole", action, entity_type AS "entityType",
            resource_type AS "resourceType", resource_id_text AS "resourceId",
            before_summary AS "beforeSummary", after_summary AS "afterSummary",
            created_at AS "createdAt"
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [Number(limit) || 100]
  );
  return result.rows;
}

module.exports = {
  createDispatch,
  getDashboard,
  getMiniprogramData,
  listAuditLogs,
  listDispatches
};
