const crypto = require('crypto');
const db = require('../db');
const ayiAvailabilityRepository = require('./ayiAvailabilityRepository');
const notificationRepository = require('./notificationRepository');
const resourceRepository = require('./resourceRepository');

const DEMAND_STATUSES = new Set(['待处理', '已联系', '匹配中', '已匹配', '已关闭']);
const OLD_STATUS_MAP = {
  待跟进: '待处理',
  顾问待联系: '待处理',
  待匹配: '匹配中',
  已面试: '已匹配',
  已成交: '已匹配',
  已取消: '已关闭'
};

function createAccessToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function normalizeDemandStatus(status) {
  if (DEMAND_STATUSES.has(status)) return status;
  return OLD_STATUS_MAP[status] || status || '待处理';
}

function demandRowToPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    source: row.source,
    serviceType: row.service_type,
    city: row.city,
    address: row.address,
    startTime: row.start_time,
    budget: row.budget,
    familyInfo: row.family_info,
    consultant: row.consultant,
    followNote: row.follow_note,
    status: normalizeDemandStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function ayiRowToPublic(row) {
  return {
    id: row.id,
    image: row.image,
    name: row.name,
    age: row.age,
    hometown: row.hometown,
    serviceType: row.service_type,
    role: row.service_type,
    experience: row.experience,
    liveType: row.live_type,
    salary: row.salary,
    availableTime: row.available_time,
    schedule: row.available_time,
    skills: row.skills || [],
    intro: row.intro,
    storeId: row.store_id,
    featured: row.featured,
    featuredTitle: row.featured_title,
    status: row.ayi_status || row.status
  };
}

function matchRowToPublic(row) {
  return {
    id: row.match_id || row.id,
    demandId: row.demand_id,
    ayiId: row.ayi_id,
    status: row.match_status || row.status,
    recommendNote: row.recommend_note,
    recommendedBy: row.recommended_by,
    customerDecisionAt: row.customer_decision_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ayi: ayiRowToPublic(row)
  };
}

function matchRowToBackstage(row) {
  return {
    id: row.id,
    demandId: row.demand_id,
    ayiId: row.ayi_id,
    ayiName: row.name,
    ayiPhone: row.phone,
    serviceType: row.service_type,
    status: row.status,
    recommendNote: row.recommend_note,
    recommendedBy: row.recommended_by,
    customerDecisionAt: row.customer_decision_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function publicMatchSelect() {
  return `
    SELECT
      dm.id AS match_id,
      dm.demand_id,
      dm.ayi_id,
      dm.status AS match_status,
      dm.recommend_note,
      dm.recommended_by,
      dm.customer_decision_at,
      dm.created_at,
      dm.updated_at,
      a.id,
      a.image,
      a.name,
      a.age,
      a.hometown,
      a.service_type,
      a.experience,
      a.live_type,
      a.salary,
      a.available_time,
      a.skills,
      a.intro,
      a.store_id,
      a.featured,
      a.featured_title,
      a.status AS ayi_status
  `;
}

async function createCustomerDemand(payload) {
  const token = createAccessToken();
  return db.transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO demands (
        customer_name, phone, source, service_type, city, address, start_time,
        budget, family_info, consultant, follow_note, status, customer_access_token_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        payload.customerName,
        payload.phone,
        '小程序',
        payload.serviceType || null,
        payload.city || null,
        payload.address || null,
        payload.startTime || null,
        payload.budget || null,
        payload.familyInfo || null,
        '',
        payload.followNote || payload.note || '',
        '待处理',
        hashToken(token)
      ]
    );
    const demand = demandRowToPublic(result.rows[0]);
    await resourceRepository.writeAudit(client, 'create', 'demands', demand.id, null, demand, {
      name: 'mini-program-customer',
      role: 'customer'
    });
    await notificationRepository.notifyByPhone(client, demand.phone, 'customer', {
      messageType: 'demand_submitted',
      title: '需求已提交',
      summary: `您的${demand.serviceType || '家政'}需求已提交，顾问会尽快跟进。`,
      entityType: 'demands',
      entityId: demand.id,
      pagePath: '/pages/demand-detail/demand-detail',
      pageParams: { id: demand.id },
      dedupeKey: `demand-submitted:${demand.id}`,
      channels: ['in_app', 'wechat_subscription']
    });
    await notificationRepository.notifyBackstage(client, {
      messageType: 'new_demand',
      title: '新客户需求',
      summary: `${demand.customerName || '客户'} 提交了${demand.serviceType || '家政'}需求。`,
      entityType: 'demands',
      entityId: demand.id,
      pagePath: '/pages/messages/messages',
      dedupeKey: `new-demand:${demand.id}`
    });
    return {
      demand,
      accessToken: token
    };
  });
}

async function findCustomerDemand(demandId, accessToken, client = db) {
  const result = await client.query(
    `SELECT * FROM demands WHERE id = $1 AND customer_access_token_hash = $2`,
    [Number(demandId), hashToken(accessToken)]
  );
  return demandRowToPublic(result.rows[0]);
}

async function requireCustomerDemand(demandId, accessToken, client = db) {
  const demand = await findCustomerDemand(demandId, accessToken, client);
  if (!demand) {
    const error = new Error('Demand token mismatch');
    error.status = 403;
    throw error;
  }
  return demand;
}

async function listPublicMatches(demandId, accessToken) {
  return db.transaction(async (client) => {
    await requireCustomerDemand(demandId, accessToken, client);
    const result = await client.query(
      `${publicMatchSelect()}
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.demand_id = $1 AND dm.status <> '已失效'
       ORDER BY
         CASE dm.status
           WHEN '客户已确认' THEN 1
           WHEN '已推荐' THEN 2
           WHEN '客户已拒绝' THEN 3
           ELSE 4
         END,
         dm.created_at DESC,
         dm.id DESC`,
      [Number(demandId)]
    );
    return result.rows.map(matchRowToPublic);
  });
}

async function decideMatch(matchId, payload) {
  const nextStatus = payload.decision === 'confirm' ? '客户已确认' : payload.decision === 'reject' ? '客户已拒绝' : null;
  if (!nextStatus) {
    const error = new Error('decision must be confirm or reject');
    error.status = 400;
    throw error;
  }

  return db.transaction(async (client) => {
    await requireCustomerDemand(payload.demandId, payload.accessToken, client);
    const beforeResult = await client.query(
      `${publicMatchSelect()}
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.id = $1 AND dm.demand_id = $2
       FOR UPDATE`,
      [Number(matchId), Number(payload.demandId)]
    );
    const before = beforeResult.rows[0];
    if (!before) {
      const error = new Error('Match not found for demand');
      error.status = 404;
      throw error;
    }
    const beforeStatus = before.match_status || before.status;
    if (beforeStatus !== '已推荐') {
      const error = new Error(`Match already decided: ${beforeStatus}`);
      error.status = 409;
      throw error;
    }

    const updatedResult = await client.query(
      `UPDATE demand_matches
       SET status = $1, customer_decision_at = now()
       WHERE id = $2
       RETURNING *`,
      [nextStatus, Number(matchId)]
    );

    if (nextStatus === '客户已确认') {
      await client.query(`UPDATE demands SET status = '已匹配' WHERE id = $1`, [Number(payload.demandId)]);
    }

    const afterJoin = await client.query(
      `${publicMatchSelect()}
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.id = $1`,
      [updatedResult.rows[0].id]
    );
    const after = matchRowToPublic(afterJoin.rows[0]);
    await resourceRepository.writeAudit(client, nextStatus === '客户已确认' ? 'customer_confirm' : 'customer_reject', 'demand_matches', after.id, matchRowToPublic(before), after, {
      name: 'mini-program-customer',
      role: 'customer'
    });
    return after;
  });
}

async function listBackstageMatches(demandId) {
  const result = await db.query(
    `SELECT dm.*, a.name, a.phone, a.service_type
     FROM demand_matches dm
     JOIN ayis a ON a.id = dm.ayi_id
     WHERE dm.demand_id = $1
     ORDER BY dm.created_at DESC, dm.id DESC`,
    [Number(demandId)]
  );
  return result.rows.map(matchRowToBackstage);
}

async function createBackstageMatch(demandId, payload, actor) {
  if (!payload.ayiId) {
    const error = new Error('ayiId is required');
    error.status = 400;
    throw error;
  }

  return db.transaction(async (client) => {
    const demandResult = await client.query('SELECT * FROM demands WHERE id = $1 FOR UPDATE', [Number(demandId)]);
    const demandBefore = demandResult.rows[0];
    if (!demandBefore) {
      const error = new Error('Demand not found');
      error.status = 404;
      throw error;
    }

    const ayiResult = await client.query(
      `SELECT * FROM ayis WHERE id = $1 AND status IN ('已认证', 'approved') AND visible IS NOT FALSE`,
      [Number(payload.ayiId)]
    );
    if (!ayiResult.rows[0]) {
      const error = new Error('Only certified ayis can be recommended');
      error.status = 400;
      throw error;
    }

    const eligibility = await ayiAvailabilityRepository.checkRecommendable(payload.ayiId, demandBefore, client);
    if (!eligibility.recommendable) {
      const error = new Error(`Ayi cannot be recommended: ${eligibility.reasons.join('；')}`);
      error.status = 400;
      error.reasons = eligibility.reasons;
      throw error;
    }

    let inserted;
    try {
      const result = await client.query(
        `INSERT INTO demand_matches (demand_id, ayi_id, status, recommend_note, recommended_by)
         VALUES ($1,$2,'已推荐',$3,$4)
         RETURNING *`,
        [
          Number(demandId),
          Number(payload.ayiId),
          payload.recommendNote || '',
          payload.recommendedBy || actor.name || '后台'
        ]
      );
      inserted = result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        const duplicate = new Error('This ayi has already been recommended for the demand');
        duplicate.status = 409;
        throw duplicate;
      }
      throw error;
    }

    if (demandBefore.status !== '已匹配') {
      await client.query(`UPDATE demands SET status = '匹配中' WHERE id = $1`, [Number(demandId)]);
    }

    const afterJoin = await client.query(
      `SELECT dm.*, a.name, a.phone, a.service_type
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.id = $1`,
      [inserted.id]
    );
    const match = matchRowToBackstage(afterJoin.rows[0]);
    await resourceRepository.writeAudit(client, 'recommend', 'demand_matches', match.id, null, match, actor);
    await notificationRepository.notifyByPhone(client, demandBefore.phone, 'customer', {
      messageType: 'demand_match_recommended',
      title: '已推荐阿姨',
      summary: `顾问已为您推荐${match.ayiName || '阿姨'}，请进入小程序查看。`,
      entityType: 'demand_matches',
      entityId: match.id,
      pagePath: '/pages/demand-detail/demand-detail',
      pageParams: { id: Number(demandId) },
      dedupeKey: `demand-match-recommended:${match.id}`,
      channels: ['in_app', 'wechat_subscription']
    });
    return match;
  });
}

async function expireBackstageMatch(matchId, actor) {
  return db.transaction(async (client) => {
    const beforeResult = await client.query(
      `SELECT dm.*, a.name, a.phone, a.service_type
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.id = $1
       FOR UPDATE`,
      [Number(matchId)]
    );
    const before = beforeResult.rows[0];
    if (!before) {
      const error = new Error('Match not found');
      error.status = 404;
      throw error;
    }
    if (before.status === '客户已确认') {
      const error = new Error('Confirmed match cannot be expired');
      error.status = 409;
      throw error;
    }

    await client.query(`UPDATE demand_matches SET status = '已失效' WHERE id = $1`, [Number(matchId)]);
    const afterResult = await client.query(
      `SELECT dm.*, a.name, a.phone, a.service_type
       FROM demand_matches dm
       JOIN ayis a ON a.id = dm.ayi_id
       WHERE dm.id = $1`,
      [Number(matchId)]
    );
    const after = matchRowToBackstage(afterResult.rows[0]);
    await resourceRepository.writeAudit(client, 'expire', 'demand_matches', after.id, matchRowToBackstage(before), after, actor);
    return after;
  });
}

module.exports = {
  createBackstageMatch,
  createCustomerDemand,
  decideMatch,
  expireBackstageMatch,
  findCustomerDemand,
  hashToken,
  listBackstageMatches,
  listPublicMatches,
  normalizeDemandStatus
};
