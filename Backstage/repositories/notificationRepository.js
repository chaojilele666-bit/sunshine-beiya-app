const https = require('https');
const db = require('../db');

const ALLOWED_PAGES = new Set([
  '/pages/messages/messages',
  '/pages/demand-detail/demand-detail',
  '/pages/my-applications/my-applications',
  '/pages/service/service',
  '/pages/ayi-profile/ayi-profile',
  '/pages/ayi-certs/ayi-certs',
  '/pages/mine/mine'
]);

const WECHAT_TEMPLATE_MAP = {
  interview: process.env.WECHAT_TEMPLATE_INTERVIEW || '',
  review_result: process.env.WECHAT_TEMPLATE_REVIEW_RESULT || '',
  application_result: process.env.WECHAT_TEMPLATE_APPLICATION_RESULT || '',
  demand_status: process.env.WECHAT_TEMPLATE_DEMAND_STATUS || '',
  appointment: process.env.WECHAT_TEMPLATE_APPOINTMENT || ''
};

const MAX_RETRY_COUNT = Number(process.env.NOTIFICATION_MAX_RETRY || 3);
const SCAN_INTERVAL_MS = Number(process.env.NOTIFICATION_SCAN_INTERVAL_MS || 5 * 60 * 1000);
const INTERVIEW_REMINDERS_ENABLED = process.env.INTERVIEW_REMINDERS_ENABLED !== 'false';
const WECHAT_API_TIMEOUT_MS = Number(process.env.WECHAT_API_TIMEOUT_MS || 8000);

let cachedAccessToken = null;
let schedulerStarted = false;

async function notificationTablesReady(client = db) {
  const result = await client.query(
    `SELECT
       to_regclass('public.notifications') AS notifications,
       to_regclass('public.notification_deliveries') AS deliveries`
  );
  const row = result.rows[0] || {};
  return Boolean(row.notifications && row.deliveries);
}

function sanitizePagePath(pagePath) {
  const value = String(pagePath || '').trim();
  if (!value) return '/pages/messages/messages';
  return ALLOWED_PAGES.has(value) ? value : '/pages/messages/messages';
}

function toClient(row) {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    recipientRole: row.recipient_role,
    messageType: row.message_type,
    title: row.title,
    summary: row.summary,
    entityType: row.entity_type,
    entityId: row.entity_id,
    storeId: row.store_id,
    pagePath: row.page_path,
    pageParams: row.page_params || {},
    isRead: Boolean(row.is_read),
    readAt: row.read_at,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function deliveryChannels(channels) {
  const list = Array.isArray(channels) && channels.length ? channels : ['in_app'];
  return Array.from(new Set(list.filter((item) => ['in_app', 'wechat_subscription', 'backstage'].includes(item))));
}

async function findUsersByPhone(client, phone, role) {
  if (!phone) return [];
  const params = [String(phone).trim()];
  let roleClause = '';
  if (role) {
    params.push(role);
    roleClause = ` AND role = $${params.length}`;
  }
  const result = await client.query(
    `SELECT id, role, wechat_openid, phone
     FROM user_accounts
     WHERE phone = $1
       AND status = 'active'
       ${roleClause}
     ORDER BY id ASC`,
    params
  );
  return result.rows;
}

async function findBackstageUsers(client) {
  const result = await client.query(
    `SELECT id, role
     FROM user_accounts
     WHERE role IN ('boss', 'operator')
       AND status = 'active'
     ORDER BY CASE role WHEN 'boss' THEN 0 ELSE 1 END, id ASC`
  );
  return result.rows;
}

async function createNotification(client, payload) {
  if (!payload || !payload.title) return null;
  if (!(await notificationTablesReady(client))) return null;
  const channels = deliveryChannels(payload.channels);
  const result = await client.query(
    `INSERT INTO notifications (
      recipient_user_id, recipient_role, message_type, title, summary, entity_type,
      entity_id, store_id, page_path, page_params, scheduled_at, dedupe_key
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::integer,$9,$10::jsonb,$11,$12)
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL AND dedupe_key <> ''
    DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      page_path = EXCLUDED.page_path,
      page_params = EXCLUDED.page_params,
      scheduled_at = EXCLUDED.scheduled_at,
      updated_at = now()
    RETURNING *`,
    [
      payload.recipientUserId || null,
      payload.recipientRole,
      payload.messageType,
      String(payload.title).slice(0, 160),
      payload.summary || '',
      payload.entityType || null,
      payload.entityId ? String(payload.entityId) : null,
      payload.storeId || null,
      sanitizePagePath(payload.pagePath),
      JSON.stringify(payload.pageParams || {}),
      payload.scheduledAt || null,
      payload.dedupeKey || null
    ]
  );
  const notification = result.rows[0];
  for (const channel of channels) {
    const initialStatus = channel === 'wechat_subscription' && !templateForType(payload.messageType)
      ? 'config_missing'
      : 'pending';
    await client.query(
      `INSERT INTO notification_deliveries (
        notification_id, channel, status, next_retry_at
      ) VALUES ($1,$2,$3,$4)
      ON CONFLICT (notification_id, channel) DO UPDATE SET
        status = CASE
          WHEN notification_deliveries.status = 'sent' THEN notification_deliveries.status
          ELSE EXCLUDED.status
        END,
        next_retry_at = CASE
          WHEN notification_deliveries.status = 'sent' THEN notification_deliveries.next_retry_at
          ELSE EXCLUDED.next_retry_at
        END,
        failed_reason = CASE
          WHEN notification_deliveries.status = 'sent' THEN notification_deliveries.failed_reason
          ELSE NULL
        END,
        updated_at = now()`,
      [notification.id, channel, initialStatus, payload.scheduledAt || new Date()]
    );
  }
  return toClient(notification);
}

function templateForType(messageType) {
  if (String(messageType).includes('interview')) return WECHAT_TEMPLATE_MAP.interview || WECHAT_TEMPLATE_MAP.appointment;
  if (String(messageType).includes('review')) return WECHAT_TEMPLATE_MAP.review_result;
  if (String(messageType).includes('application')) return WECHAT_TEMPLATE_MAP.application_result;
  if (String(messageType).includes('demand')) return WECHAT_TEMPLATE_MAP.demand_status;
  return '';
}

async function notifyByPhone(client, phone, role, payload) {
  const users = await findUsersByPhone(client, phone, role);
  const notifications = [];
  for (const user of users) {
    notifications.push(await createNotification(client, Object.assign({}, payload, {
      recipientUserId: user.id,
      recipientRole: user.role || role,
      dedupeKey: payload.dedupeKey ? `${payload.dedupeKey}:${user.id}` : null
    })));
  }
  return notifications.filter(Boolean);
}

async function notifyBackstage(client, payload) {
  const users = await findBackstageUsers(client);
  const notifications = [];
  for (const user of users) {
    notifications.push(await createNotification(client, Object.assign({}, payload, {
      recipientUserId: user.id,
      recipientRole: user.role,
      channels: ['backstage', 'in_app'],
      dedupeKey: payload.dedupeKey ? `${payload.dedupeKey}:backstage:${user.id}` : null
    })));
  }
  return notifications.filter(Boolean);
}

function filterForUser(user, filters = {}) {
  const where = ['(recipient_user_id = $1 OR (recipient_user_id IS NULL AND recipient_role = $2))'];
  const params = [Number(user.id), user.role];
  if (filters.unread === 'true' || filters.unread === true) where.push('is_read = false');
  if (filters.messageType) {
    params.push(`${filters.messageType}%`);
    where.push(`message_type ILIKE $${params.length}`);
  }
  if (filters.keyword) {
    params.push(`%${String(filters.keyword).trim()}%`);
    where.push(`(title ILIKE $${params.length} OR summary ILIKE $${params.length})`);
  }
  if (filters.storeId) {
    params.push(Number(filters.storeId));
    where.push(`store_id = $${params.length}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    where.push(`created_at >= $${params.length}::date`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    where.push(`created_at < ($${params.length}::date + INTERVAL '1 day')`);
  }
  return { where, params };
}

function parsePage(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(Math.floor(number), max);
}

async function listForUser(user, filters = {}) {
  if (!user) {
    const error = new Error('Login required');
    error.status = 401;
    throw error;
  }
  if (!(await notificationTablesReady())) {
    const page = parsePage(filters.page, 1, 100000);
    const pageSize = parsePage(filters.pageSize, 20, 50);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
  const page = parsePage(filters.page, 1, 100000);
  const pageSize = parsePage(filters.pageSize, 20, 50);
  const offset = (page - 1) * pageSize;
  const query = filterForUser(user, filters);
  const whereSql = query.where.join(' AND ');
  const [count, rows] = await Promise.all([
    db.query(`SELECT count(*)::integer AS total FROM notifications WHERE ${whereSql}`, query.params),
    db.query(
      `SELECT * FROM notifications
       WHERE ${whereSql}
       ORDER BY is_read ASC, COALESCE(scheduled_at, created_at) DESC, id DESC
       LIMIT $${query.params.length + 1}
       OFFSET $${query.params.length + 2}`,
      query.params.concat([pageSize, offset])
    )
  ]);
  const total = count.rows[0].total;
  return {
    items: rows.rows.map(toClient),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

async function unreadCount(user) {
  if (!user) {
    const error = new Error('Login required');
    error.status = 401;
    throw error;
  }
  if (!(await notificationTablesReady())) return 0;
  const result = await db.query(
    `SELECT count(*)::integer AS count
     FROM notifications
     WHERE (recipient_user_id = $1 OR (recipient_user_id IS NULL AND recipient_role = $2))
       AND is_read = false`,
    [Number(user.id), user.role]
  );
  return result.rows[0].count;
}

async function markRead(user, id) {
  if (!(await notificationTablesReady())) return null;
  const result = await db.query(
    `UPDATE notifications
     SET is_read = true, read_at = COALESCE(read_at, now())
     WHERE id = $1
       AND (recipient_user_id = $2 OR (recipient_user_id IS NULL AND recipient_role = $3))
     RETURNING *`,
    [Number(id), Number(user.id), user.role]
  );
  return toClient(result.rows[0]);
}

async function markAllRead(user) {
  if (!(await notificationTablesReady())) return;
  await db.query(
    `UPDATE notifications
     SET is_read = true, read_at = COALESCE(read_at, now())
     WHERE (recipient_user_id = $1 OR (recipient_user_id IS NULL AND recipient_role = $2))
       AND is_read = false`,
    [Number(user.id), user.role]
  );
}

function subscriptionConfig() {
  return Object.entries(WECHAT_TEMPLATE_MAP)
    .filter(([, templateId]) => Boolean(templateId))
    .map(([type, templateId]) => ({ type, templateId }));
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: WECHAT_API_TIMEOUT_MS }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('wechat timeout')));
    req.on('error', reject);
  });
}

async function getWechatAccessToken() {
  const appid = process.env.WECHAT_MINIPROGRAM_APPID;
  const secret = process.env.WECHAT_MINIPROGRAM_SECRET;
  if (!appid || !secret) return '';
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60 * 1000) return cachedAccessToken.value;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`;
  const data = await requestJson(url);
  if (!data.access_token) return '';
  cachedAccessToken = {
    value: data.access_token,
    expiresAt: now + Number(data.expires_in || 7200) * 1000
  };
  return cachedAccessToken.value;
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(url, {
      method: 'POST',
      timeout: WECHAT_API_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('wechat timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildWechatData(notification) {
  return {
    thing1: { value: String(notification.title || '').slice(0, 20) },
    thing2: { value: String(notification.summary || '').slice(0, 20) },
    time3: { value: new Date(notification.scheduled_at || notification.created_at || Date.now()).toISOString().slice(0, 16).replace('T', ' ') }
  };
}

async function sendWechatDelivery(client, delivery) {
  const token = await getWechatAccessToken();
  const templateId = templateForType(delivery.message_type);
  if (!token || !templateId || !delivery.wechat_openid) {
    await client.query(
      `UPDATE notification_deliveries
       SET status = $1, failed_reason = $2, retry_count = retry_count + 1
       WHERE id = $3`,
      [templateId ? 'config_missing' : 'config_missing', '\u5fae\u4fe1\u8ba2\u9605\u6d88\u606f\u6a21\u677f\u6216\u7528\u6237 OpenID \u672a\u914d\u7f6e', delivery.delivery_id]
    );
    return;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(token)}`;
  const result = await postJson(url, {
    touser: delivery.wechat_openid,
    template_id: templateId,
    page: sanitizePagePath(delivery.page_path).replace(/^\//, ''),
    data: buildWechatData(delivery)
  });
  if (result.errcode === 0) {
    await client.query(
      `UPDATE notification_deliveries
       SET status = 'sent', sent_at = now(), wechat_result = $1::jsonb
       WHERE id = $2`,
      [JSON.stringify({ errcode: result.errcode, errmsg: result.errmsg || 'ok' }), delivery.delivery_id]
    );
    return;
  }
  const retryCount = Number(delivery.retry_count || 0) + 1;
  await client.query(
    `UPDATE notification_deliveries
     SET status = $1,
         failed_reason = $2,
         retry_count = $3,
         next_retry_at = CASE WHEN $3::integer < $4::integer THEN now() + ($3::integer * INTERVAL '1 minute') ELSE NULL END,
         wechat_result = $5::jsonb
     WHERE id = $6`,
    [
      retryCount < MAX_RETRY_COUNT ? 'pending' : 'failed',
      String(result.errmsg || '\u5fae\u4fe1\u8ba2\u9605\u6d88\u606f\u53d1\u9001\u5931\u8d25').slice(0, 500),
      retryCount,
      MAX_RETRY_COUNT,
      JSON.stringify({ errcode: result.errcode, errmsg: result.errmsg || '' }),
      delivery.delivery_id
    ]
  );
}

async function processDueDeliveries(limit = 50) {
  if (!(await notificationTablesReady())) return;
  const rows = await db.query(
    `SELECT d.id AS delivery_id, d.retry_count, n.*, u.wechat_openid
     FROM notification_deliveries d
     JOIN notifications n ON n.id = d.notification_id
     LEFT JOIN user_accounts u ON u.id = n.recipient_user_id
     WHERE d.channel = 'wechat_subscription'
       AND d.status IN ('pending', 'failed', 'config_missing')
       AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
       AND (n.scheduled_at IS NULL OR n.scheduled_at <= now())
     ORDER BY COALESCE(d.next_retry_at, n.scheduled_at, d.created_at), d.id
     LIMIT $1`,
    [Number(limit)]
  );
  for (const row of rows.rows) {
    await db.transaction((client) => sendWechatDelivery(client, row));
  }
}

function startScheduler() {
  if (schedulerStarted || process.env.NOTIFICATION_SCHEDULER_ENABLED === 'false') return;
  schedulerStarted = true;
  setInterval(() => {
    processDueDeliveries().catch((error) => {
      console.warn(`[notifications] scheduler failed: ${error.message}`);
    });
  }, SCAN_INTERVAL_MS).unref();
}

async function skipInterviewReminders(client, appointmentId, reason = '\u9762\u8bd5\u5df2\u53d6\u6d88\u6216\u5b8c\u6210') {
  if (!appointmentId) return;
  if (!(await notificationTablesReady(client))) return;
  await client.query(
    `UPDATE notification_deliveries d
     SET status = 'skipped',
         failed_reason = $2,
         next_retry_at = NULL,
         updated_at = now()
     FROM notifications n
     WHERE d.notification_id = n.id
       AND d.status = 'pending'
       AND n.dedupe_key LIKE $1`,
    [`interview-reminder:${appointmentId}:%`, reason]
  );
}

function scheduleInterviewReminders(client, appointment) {
  if (!INTERVIEW_REMINDERS_ENABLED || !appointment || !appointment.date) return Promise.resolve();
  const status = String(appointment.status || '').trim();
  if (['\u5df2\u5b8c\u6210', '\u5df2\u53d6\u6d88', 'completed', 'cancelled', 'canceled'].includes(status)) {
    return skipInterviewReminders(client, appointment.id);
  }
  const interviewTime = new Date(appointment.date);
  if (Number.isNaN(interviewTime.getTime())) return Promise.resolve();
  const offsets = [24 * 60 * 60 * 1000, 2 * 60 * 60 * 1000];
  return Promise.all(offsets.map((offset) => {
    const scheduledAt = new Date(interviewTime.getTime() - offset);
    if (scheduledAt.getTime() <= Date.now()) return null;
    return notifyByPhone(client, appointment.phone, 'customer', {
      messageType: 'interview_reminder',
      title: '\u9762\u8bd5\u5373\u5c06\u5f00\u59cb',
      summary: `\u9762\u8bd5\u65f6\u95f4\uff1a${appointment.date}\uff0c\u8bf7\u63d0\u524d\u786e\u8ba4\u5b89\u6392\u3002`,
      entityType: 'appointments',
      entityId: appointment.id,
      pagePath: '/pages/messages/messages',
      scheduledAt: scheduledAt.toISOString(),
      dedupeKey: `interview-reminder:${appointment.id}:${offset}`,
      channels: ['in_app', 'wechat_subscription']
    });
  }));
}
module.exports = {
  createNotification,
  listForUser,
  markAllRead,
  markRead,
  notifyBackstage,
  notifyByPhone,
  processDueDeliveries,
  scheduleInterviewReminders,
  startScheduler,
  subscriptionConfig,
  unreadCount
};
