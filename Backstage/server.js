const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const accessControl = require('./accessControl');
const authRepository = require('./repositories/authRepository');
const backstageRepository = require('./repositories/backstageRepository');
const companyProfileRepository = require('./repositories/companyProfileRepository');
const miniprogramAuthRepository = require('./repositories/miniprogramAuthRepository');
const notificationRepository = require('./repositories/notificationRepository');
const ayiAvailabilityRepository = require('./repositories/ayiAvailabilityRepository');
const demandFollowUpRepository = require('./repositories/demandFollowUpRepository');
const demandMatchRepository = require('./repositories/demandMatchRepository');
const resourceRepository = require('./repositories/resourceRepository');
const serviceCatalogRepository = require('./repositories/serviceCatalogRepository');

const PORT = 5177;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data.json');
const STORE_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'stores');
const SERVICE_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'service-modules');
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const SERVICE_MODULE_TYPES = new Set(['highlight', 'service', 'shortcut']);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function getServiceModuleTypeFromQuery(req) {
  const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
  const moduleType = query.get('moduleType');
  if (!moduleType) return '';
  return SERVICE_MODULE_TYPES.has(moduleType) ? moduleType : '__invalid__';
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demand-Access-Token'
  });
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    res.end(body);
    return;
  }
  res.end(JSON.stringify(body));
}

function sendCsv(res, filename, content) {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demand-Access-Token'
  });
  res.end(content);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function readDemandAccessToken(req) {
  const token = req.headers['x-demand-access-token'];
  return Array.isArray(token) ? token[0] : token;
}

function auditQueryFromSearchParams(searchParams) {
  return {
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    limit: searchParams.get('limit'),
    actor: searchParams.get('actor'),
    role: searchParams.get('role'),
    action: searchParams.get('action'),
    entityType: searchParams.get('entityType'),
    startTime: searchParams.get('startTime'),
    endTime: searchParams.get('endTime'),
    keyword: searchParams.get('keyword')
  };
}

function csvSafeCell(value) {
  let text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function auditLogsToCsv(rows) {
  const headers = ['操作时间', '操作人', '角色', '操作类型', '模块', '对象ID', '操作摘要', '修改前', '修改后'];
  const lines = [headers.map(csvSafeCell).join(',')].concat(rows.map((row) => [
    row.createdAt || '',
    row.actor || 'system',
    row.actorRole || '',
    row.action || '',
    row.entityType || row.resourceType || '',
    row.resourceId || '',
    row.afterSummary || row.beforeSummary || '',
    row.beforeData || null,
    row.afterData || null
  ].map(csvSafeCell).join(',')));
  return `\ufeff${lines.join('\r\n')}`;
}

const exportInfoTypes = {
  demands: { resource: 'demands', label: '\u5ba2\u6237\u9700\u6c42', filename: '\u5ba2\u6237\u9700\u6c42' },
  ayis: { resource: 'ayis', label: '\u963f\u59e8\u4fe1\u606f', filename: '\u963f\u59e8\u4fe1\u606f' },
  appointments: { resource: 'appointments', label: '\u9762\u8bd5\u5b89\u6392', filename: '\u9762\u8bd5\u5b89\u6392' },
  appointmentRecords: { resource: 'appointments', label: '\u9884\u7ea6\u8bb0\u5f55', filename: '\u9884\u7ea6\u8bb0\u5f55' }
};

function exportInfoQueryFromSearchParams(searchParams) {
  return {
    type: searchParams.get('type') || 'demands',
    preset: searchParams.get('preset') || 'today',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    status: searchParams.get('status') || '',
    serviceType: searchParams.get('serviceType') || '',
    store: searchParams.get('store') || '',
    operator: searchParams.get('operator') || '',
    interviewMethod: searchParams.get('interviewMethod') || '',
    page: Number(searchParams.get('page') || 1),
    pageSize: Math.min(Math.max(Number(searchParams.get('pageSize') || 20), 1), 100)
  };
}

function dateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function exportInfoDateLabel(filters) {
  if (!filters.startDate && !filters.endDate) return '\u5168\u90e8';
  if (filters.startDate && filters.endDate) return `${filters.startDate}_\u81f3_${filters.endDate}`;
  return filters.startDate || filters.endDate || '\u5168\u90e8';
}

function recordMatchesExportFilters(record, filters) {
  const created = dateOnly(record.createdAt);
  if (filters.startDate && created && created < filters.startDate) return false;
  if (filters.endDate && created && created > filters.endDate) return false;
  if (filters.status && record.status !== filters.status) return false;
  if (filters.serviceType && record.serviceType !== filters.serviceType) return false;
  if (filters.interviewMethod && record.interviewMethod !== filters.interviewMethod) return false;
  if (filters.store) {
    const storeText = String(record.storeName || record.storeId || record.district || record.address || '').toLowerCase();
    if (!storeText.includes(String(filters.store).toLowerCase())) return false;
  }
  if (filters.operator) {
    const operatorText = String(record.consultant || record.source || record.assignedOperatorName || '').toLowerCase();
    if (!operatorText.includes(String(filters.operator).toLowerCase())) return false;
  }
  return true;
}

function exportInfoRowsToCsv(type, rows) {
  const headersByType = {
    demands: ['\u5ba2\u6237\u59d3\u540d', '\u624b\u673a\u53f7', '\u670d\u52a1\u7c7b\u578b', '\u5730\u5740', '\u9884\u7b97', '\u9700\u6c42\u72b6\u6001', '\u8d1f\u8d23\u4eba/\u987e\u95ee', '\u521b\u5efa\u65e5\u671f'],
    ayis: ['\u963f\u59e8\u59d3\u540d', '\u624b\u673a\u53f7', '\u670d\u52a1\u7c7b\u578b', '\u72b6\u6001', '\u6240\u5c5e\u95e8\u5e97', '\u5f55\u5165\u6765\u6e90', '\u5f55\u5165\u65e5\u671f'],
    appointments: ['\u5ba2\u6237\u59d3\u540d', '\u624b\u673a\u53f7', '\u9884\u7ea6\u963f\u59e8', '\u670d\u52a1\u7c7b\u578b', '\u9762\u8bd5\u65f6\u95f4', '\u9762\u8bd5\u65b9\u5f0f', '\u9762\u8bd5\u72b6\u6001', '\u9762\u8bd5\u7ed3\u679c', '\u4e0b\u4e00\u6b65', '\u521b\u5efa\u65e5\u671f'],
    appointmentRecords: ['\u5ba2\u6237\u59d3\u540d', '\u624b\u673a\u53f7', '\u9884\u7ea6\u963f\u59e8', '\u670d\u52a1\u7c7b\u578b', '\u9762\u8bd5\u65f6\u95f4', '\u9762\u8bd5\u65b9\u5f0f', '\u9762\u8bd5\u72b6\u6001', '\u5907\u6ce8', '\u521b\u5efa\u65e5\u671f']
  };
  const rowValues = {
    demands: (row) => [row.customerName, row.phone, row.serviceType, `${row.city || ''} ${row.address || ''}`.trim(), row.budget, row.status, row.assignedOperatorName || row.consultant, dateOnly(row.createdAt)],
    ayis: (row) => [row.name, row.phone, row.serviceType, row.status, row.storeName || row.storeId || '', row.source, dateOnly(row.createdAt)],
    appointments: (row) => [row.customerName, row.phone, row.ayiName, row.serviceType, row.date, row.interviewMethod, row.status, row.interviewResult, row.nextStep, dateOnly(row.createdAt)],
    appointmentRecords: (row) => [row.customerName, row.phone, row.ayiName, row.serviceType, row.date, row.interviewMethod, row.status, row.note, dateOnly(row.createdAt)]
  };
  const headers = headersByType[type] || headersByType.demands;
  const mapper = rowValues[type] || rowValues.demands;
  const lines = [headers.map(csvSafeCell).join(',')].concat(rows.map((row) => mapper(row).map(csvSafeCell).join(',')));
  return `\ufeff${lines.join('\r\n')}`;
}
function timestampForFilename() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `${date}_${time}`;
}

function getRequestOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

function isDataImage(value) {
  return typeof value === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function imageExtension(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'png';
}

function saveUploadImage(dataUrl, uploadDir, urlPrefix, filePrefix, recordId, fieldName) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error('Invalid image data URL');
  }

  const mime = match[1];
  const base64 = match[2].replace(/\s/g, '');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new Error('Uploaded image is empty');
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = imageExtension(mime);
  const safeField = String(fieldName || 'image').replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `${filePrefix}-${recordId || 'new'}-${safeField}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `${urlPrefix}/${filename}`;
}

function saveStoreImage(dataUrl, storeId, fieldName) {
  const safeField = fieldName === 'managerImage' ? 'manager' : 'image';
  return saveUploadImage(dataUrl, STORE_UPLOAD_DIR, '/uploads/stores', 'store', storeId, safeField);
}

function saveServiceModuleImage(dataUrl, moduleId, fieldName) {
  return saveUploadImage(dataUrl, SERVICE_UPLOAD_DIR, '/uploads/service-modules', 'service-module', moduleId, fieldName);
}

function normalizeUploadUrl(value, req) {
  if (typeof value !== 'string') return value;
  const origin = getRequestOrigin(req);
  if (value.startsWith(`${origin}/uploads/`)) {
    return value.slice(origin.length);
  }
  return value;
}

function prepareStoreImagePayload(req, payload, id) {
  const next = Object.assign({}, payload);
  ['image', 'managerImage'].forEach((key) => {
    if (!(key in next)) return;
    if (isDataImage(next[key])) {
      next[key] = saveStoreImage(next[key], id, key);
      return;
    }
    next[key] = normalizeUploadUrl(next[key], req);
  });
  return next;
}

function prepareServiceModuleImagePayload(req, payload, id) {
  const next = Object.assign({}, payload);
  ['image', 'iconImage'].forEach((key) => {
    if (!(key in next)) return;
    if (isDataImage(next[key])) {
      next[key] = saveServiceModuleImage(next[key], id, key);
      return;
    }
    next[key] = normalizeUploadUrl(next[key], req);
  });
  return next;
}

function expandUploadUrl(req, value) {
  if (typeof value === 'string' && value.startsWith('/uploads/')) {
    return `${getRequestOrigin(req)}${value}`;
  }
  return value;
}

function expandStoreImages(req, store) {
  if (!store || typeof store !== 'object') return store;
  return Object.assign({}, store, {
    image: expandUploadUrl(req, store.image),
    managerImage: expandUploadUrl(req, store.managerImage)
  });
}

function expandServiceModuleImages(req, item) {
  if (!item || typeof item !== 'object') return item;
  return Object.assign({}, item, {
    image: expandUploadUrl(req, item.image),
    iconImage: expandUploadUrl(req, item.iconImage)
  });
}

function expandResourceImages(req, resource, value) {
  if (resource === 'stores') {
    if (Array.isArray(value)) return value.map((item) => expandStoreImages(req, item));
    return expandStoreImages(req, value);
  }
  if (resource === 'serviceModules') {
    if (Array.isArray(value)) return value.map((item) => expandServiceModuleImages(req, item));
    return expandServiceModuleImages(req, value);
  }
  return value;
}

function expandMiniprogramImages(req, data) {
  return Object.assign({}, data, {
    stores: (data.stores || []).map((item) => expandStoreImages(req, item)),
    serviceModules: (data.serviceModules || []).map((item) => expandServiceModuleImages(req, item))
  });
}

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function checkLoginRateLimit(identifier, ipAddress) {
  const key = `${ipAddress || 'unknown'}:${String(identifier || '').toLowerCase()}`;
  const now = Date.now();
  const current = loginAttempts.get(key) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + LOGIN_WINDOW_MS;
  }
  current.count += 1;
  loginAttempts.set(key, current);
  if (current.count > LOGIN_MAX_ATTEMPTS) {
    const error = new authRepository.AuthError('RATE_LIMITED', 'Too many login attempts. Try again later.', 429);
    throw error;
  }
}

function clearLoginRateLimit(identifier, ipAddress) {
  const key = `${ipAddress || 'unknown'}:${String(identifier || '').toLowerCase()}`;
  loginAttempts.delete(key);
}

async function getCurrentUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  return authRepository.getUserByToken(token);
}

function sendAuthError(res, error) {
  send(res, error.status || 401, {
    ok: false,
    code: error.code || 'AUTH_ERROR',
    error: error.message || 'Authentication failed'
  });
}

function sendApiError(res, error, fallbackMessage = 'Request failed') {
  sendError(res, error.status || 400, fallbackMessage, error.message);
}

async function emitResourceNotifications(resource, record, before = null) {
  try {
    await db.transaction(async (client) => {
      if (resource === 'appointments') {
        const title = before ? '面试安排已更新' : '新面试已安排';
        const summary = `${record.date || '待确认时间'} ${record.interviewMethod || ''} ${record.address || ''}`.trim();
        await notificationRepository.notifyByPhone(client, record.phone, 'customer', {
          messageType: before && record.status === '已取消' ? 'interview_cancelled' : 'interview_updated',
          title,
          summary: summary || '请进入小程序查看面试安排。',
          entityType: 'appointments',
          entityId: record.id,
          pagePath: '/pages/messages/messages',
          dedupeKey: `appointment-notice:${record.id}:${record.updatedAt || Date.now()}`,
          channels: ['in_app', 'wechat_subscription']
        });
        if (record.ayiId) {
          const ayiResult = await client.query('SELECT phone FROM ayis WHERE id = $1', [Number(record.ayiId)]);
          const ayiPhone = ayiResult.rows[0] && ayiResult.rows[0].phone;
          await notificationRepository.notifyByPhone(client, ayiPhone, 'ayi', {
            messageType: before && record.status === '已取消' ? 'interview_cancelled' : 'interview_updated',
            title,
            summary: summary || '请进入小程序查看面试安排。',
            entityType: 'appointments',
            entityId: record.id,
            pagePath: '/pages/messages/messages',
            dedupeKey: `appointment-ayi-notice:${record.id}:${record.updatedAt || Date.now()}`,
            channels: ['in_app', 'wechat_subscription']
          });
        }
        await notificationRepository.notifyBackstage(client, {
          messageType: 'new_interview',
          title,
          summary: `${record.customerName || '客户'} ${summary || ''}`.trim(),
          entityType: 'appointments',
          entityId: record.id,
          pagePath: '/pages/messages/messages',
          dedupeKey: `appointment-backstage:${record.id}:${record.updatedAt || Date.now()}`
        });
        await notificationRepository.scheduleInterviewReminders(client, record);
      }

      if (resource === 'applications') {
        await notificationRepository.notifyByPhone(client, record.ayiPhone, 'ayi', {
          messageType: before ? 'application_status_changed' : 'application_submitted',
          title: before ? '接单申请状态变化' : '申请已提交',
          summary: before ? `您的申请状态已更新为：${record.status || '-'}` : '您的接单申请已提交，请等待工作人员处理。',
          entityType: 'applications',
          entityId: record.id,
          pagePath: '/pages/my-applications/my-applications',
          dedupeKey: `application-notice:${record.id}:${record.status || 'created'}:${record.updatedAt || Date.now()}`,
          channels: ['in_app', 'wechat_subscription']
        });
        if (!before) {
          await notificationRepository.notifyBackstage(client, {
            messageType: 'new_application',
            title: '新阿姨申请',
            summary: `${record.ayiName || '阿姨'} 提交了接单申请。`,
            entityType: 'applications',
            entityId: record.id,
            pagePath: '/pages/messages/messages',
            dedupeKey: `new-application:${record.id}`
          });
        }
      }

      if (resource === 'ayis') {
        if (!before) {
          await notificationRepository.notifyBackstage(client, {
            messageType: 'ayi_review_pending',
            title: '阿姨资料待审核',
            summary: `${record.name || '阿姨'} 提交或录入了资料。`,
            entityType: 'ayis',
            entityId: record.id,
            pagePath: '/pages/messages/messages',
            dedupeKey: `ayi-review-pending:${record.id}`
          });
        } else if (before.status !== record.status) {
          await notificationRepository.notifyByPhone(client, record.phone, 'ayi', {
            messageType: 'review_result',
            title: '资料审核结果更新',
            summary: `您的资料审核状态已更新为：${record.status || '-'}`,
            entityType: 'ayis',
            entityId: record.id,
            pagePath: '/pages/ayi-profile/ayi-profile',
            dedupeKey: `ayi-review-result:${record.id}:${record.status || ''}:${record.updatedAt || Date.now()}`,
            channels: ['in_app', 'wechat_subscription']
          });
        }
      }

      if (resource === 'demands' && before && before.status !== record.status) {
        await notificationRepository.notifyByPhone(client, record.phone, 'customer', {
          messageType: 'demand_status_changed',
          title: '需求状态变化',
          summary: `您的需求状态已更新为：${record.status || '-'}`,
          entityType: 'demands',
          entityId: record.id,
          pagePath: '/pages/demand-detail/demand-detail',
          pageParams: { id: record.id },
          dedupeKey: `demand-status:${record.id}:${record.status || ''}:${record.updatedAt || Date.now()}`,
          channels: ['in_app', 'wechat_subscription']
        });
      }
    });
  } catch (error) {
    console.warn(`[notifications] emit failed: ${error.message}`);
  }
}

function requireBackstageUser(user) {
  if (!accessControl.canUseBackstage(user)) {
    const error = new Error('Backstage role required');
    error.status = user ? 403 : 401;
    throw error;
  }
}

function requireBackstageResource(user, resource, method = 'GET') {
  const authz = accessControl.canAccessResource(user, resource, method);
  if (!authz.ok) {
    const error = new Error(authz.message || 'Permission denied');
    error.status = authz.status || 403;
    throw error;
  }
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function countBy(list, key) {
  return list.reduce((result, item) => {
    const value = item[key] || '未填写';
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function makeDashboard(data) {
  const today = (data.analytics && data.analytics.today) || {};
  const ayis = data.ayis || [];
  const demands = data.demands || [];
  const appointments = data.appointments || [];
  const applications = data.applications || [];
  const orders = data.orders || [];

  return {
    cards: [
      { label: '今日客户点击', value: today.customerClicks || 0, note: '后续接小程序埋点' },
      { label: '今日阿姨点击', value: today.ayiClicks || 0, note: '后续接小程序埋点' },
      { label: '今日客户信息量', value: today.customerLeads || demands.length, note: '客户需求数量' },
      { label: '今日阿姨信息量', value: today.ayiLeads || ayis.length, note: '阿姨资料数量' },
      { label: '后台发布客户量', value: demands.filter((item) => item.source === '后台录入').length, note: '员工录入需求' },
      { label: '后台发布阿姨量', value: ayis.filter((item) => item.source === '后台录入').length, note: '员工录入阿姨' },
      { label: '预约面试', value: appointments.length, note: '累计预约' },
      { label: '接单申请', value: applications.length, note: '阿姨申请记录' },
      { label: '订单数量', value: orders.length, note: '累计订单' }
    ],
    tables: [
      {
        title: '客户需求状态',
        rows: Object.entries(countBy(demands, 'status')).map(([name, value]) => ({ name, value }))
      },
      {
        title: '阿姨审核状态',
        rows: Object.entries(countBy(ayis, 'status')).map(([name, value]) => ({ name, value }))
      },
      {
        title: '服务类型分布',
        rows: Object.entries(countBy(demands.concat(ayis), 'serviceType')).map(([name, value]) => ({ name, value }))
      },
      {
        title: '订单服务状态',
        rows: Object.entries(countBy(orders, 'status')).map(([name, value]) => ({ name, value }))
      }
    ]
  };
}

function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return;
  }

  const ext = path.extname(filePath);
  send(res, 200, fs.readFileSync(filePath), contentTypes[ext] || 'text/plain; charset=utf-8');
}

async function handleAuth(req, res, parts, currentUser) {
  const action = parts[2];
  try {
    if (action === 'login' && req.method === 'POST') {
      const body = await readBody(req);
      const ipAddress = getClientIp(req);
      checkLoginRateLimit(body.identifier || body.username || body.phone, ipAddress);
      const result = await authRepository.login({
        identifier: body.identifier || body.username || body.phone,
        password: body.password,
        ipAddress,
        userAgent: req.headers['user-agent'] || null
      });
      clearLoginRateLimit(body.identifier || body.username || body.phone, ipAddress);
      send(res, 200, Object.assign({ ok: true }, result));
      return;
    }

    if (['wechat-login', 'wechatLogin'].includes(action) && req.method === 'POST') {
      const body = await readBody(req);
      const ipAddress = getClientIp(req);
      checkLoginRateLimit(`wechat:${body.code || ''}`, ipAddress);
      const result = await miniprogramAuthRepository.loginWithWechat({
        code: body.code,
        role: body.role,
        source: body.source || 'miniprogram',
        ipAddress,
        userAgent: req.headers['user-agent'] || null
      });
      clearLoginRateLimit(`wechat:${body.code || ''}`, ipAddress);
      send(res, 200, Object.assign({ ok: true }, result));
      return;
    }

    if (['wechat-phone-login', 'wechat-phone', 'wechatPhoneLogin'].includes(action) && req.method === 'POST') {
      const body = await readBody(req);
      const ipAddress = getClientIp(req);
      checkLoginRateLimit(`wechat-phone:${body.phoneCode || ''}`, ipAddress);
      const result = await miniprogramAuthRepository.loginWithWechatPhone({
        loginCode: body.loginCode || body.code,
        phoneCode: body.phoneCode,
        role: body.role,
        source: body.source || 'miniprogram',
        ipAddress,
        userAgent: req.headers['user-agent'] || null
      });
      clearLoginRateLimit(`wechat-phone:${body.phoneCode || ''}`, ipAddress);
      send(res, 200, Object.assign({ ok: true }, result));
      return;
    }

    if (action === 'miniprogram-users' && req.method === 'GET') {
      if (!currentUser) {
        send(res, 401, { ok: false, error: 'Login required' });
        return;
      }
      const authz = accessControl.canAccessModule(currentUser, 'accounts');
      if (!authz.ok) {
        send(res, authz.status, { ok: false, error: authz.message });
        return;
      }
      send(res, 200, {
        ok: true,
        users: await miniprogramAuthRepository.listMiniprogramUsers()
      });
      return;
    }

    if (action === 'logout' && req.method === 'POST') {
      await authRepository.logout(getBearerToken(req), currentUser);
      send(res, 200, { ok: true });
      return;
    }

    if (action === 'me' && req.method === 'GET') {
      if (!currentUser) {
        send(res, 401, { ok: false, error: 'Login required' });
        return;
      }
      send(res, 200, {
        ok: true,
        user: currentUser,
        allowedResources: accessControl.allowedResourcesForUser(currentUser),
        canUseBackstage: accessControl.canUseBackstage(currentUser)
      });
      return;
    }

    if (action === 'change-password' && req.method === 'POST') {
      if (!currentUser) {
        send(res, 401, { ok: false, error: 'Login required' });
        return;
      }
      const body = await readBody(req);
      const user = await authRepository.changePassword(currentUser, body.currentPassword, body.newPassword);
      send(res, 200, { ok: true, user });
      return;
    }

    send(res, 404, { ok: false, error: '登录服务暂时不可用，请稍后重试' });
  } catch (error) {
    if (error instanceof authRepository.AuthError || error.code) {
      sendAuthError(res, error);
      return;
    }
    sendError(res, 500, 'Authentication failed');
  }
}

async function handleApi(req, res) {
  const parts = req.url.split('?')[0].split('/').filter(Boolean);
  const resource = parts[1];
  const id = parts[2] ? Number(parts[2]) : null;
  const allowed = ['accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners', 'orderDispatches', 'companyProfile'];
  const currentUser = await getCurrentUser(req);

  if (resource === 'auth') {
    await handleAuth(req, res, parts, currentUser);
    return;
  }

  if (resource === 'health' && parts[2] === 'database' && req.method === 'GET') {
    try {
      const result = await db.checkDatabase();
      send(res, 200, {
        ok: true,
        source: 'postgres',
        database: db.getDatabaseSummary(),
        result
      });
    } catch (error) {
      send(res, 503, {
        ok: false,
        source: 'postgres',
        error: 'Database unavailable',
        detail: error.message
      });
    }
    return;
  }

  if (resource === 'notifications') {
    try {
      if (!currentUser) {
        send(res, 401, { ok: false, error: 'Login required' });
        return;
      }
      if (parts[2] === 'subscription-config' && req.method === 'GET') {
        send(res, 200, {
          ok: true,
          templates: notificationRepository.subscriptionConfig()
        });
        return;
      }
      if (parts[2] === 'unread-count' && req.method === 'GET') {
        send(res, 200, {
          ok: true,
          count: await notificationRepository.unreadCount(currentUser)
        });
        return;
      }
      if (parts[2] === 'read-all' && req.method === 'PUT') {
        await notificationRepository.markAllRead(currentUser);
        send(res, 200, { ok: true });
        return;
      }
      if (id && parts[3] === 'read' && req.method === 'PUT') {
        const notification = await notificationRepository.markRead(currentUser, id);
        if (!notification) {
          send(res, 404, { ok: false, error: 'Notification not found' });
          return;
        }
        send(res, 200, { ok: true, notification });
        return;
      }
      if (req.method === 'GET' && parts.length === 2) {
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;
        send(res, 200, Object.assign({ ok: true }, await notificationRepository.listForUser(currentUser, {
          unread: query.get('unread') || '',
          messageType: query.get('messageType') || '',
          keyword: query.get('keyword') || '',
          storeId: query.get('storeId') || '',
          startDate: query.get('startDate') || '',
          endDate: query.get('endDate') || '',
          page: query.get('page') || 1,
          pageSize: query.get('pageSize') || 20
        })));
        return;
      }
      send(res, 405, { ok: false, error: 'Method not allowed' });
    } catch (error) {
      sendError(res, error.status || 400, 'Notifications failed', error.message);
    }
    return;
  }

  if (resource === 'service-categories' && req.method === 'GET') {
    try {
      send(res, 200, {
        source: 'postgres',
        data: await serviceCatalogRepository.listServiceCategories()
      });
    } catch (error) {
      send(res, 503, {
        source: 'postgres',
        error: 'Database unavailable',
        detail: error.message
      });
    }
    return;
  }

  if (resource === 'service-items' && req.method === 'GET') {
    try {
      send(res, 200, {
        source: 'postgres',
        data: await serviceCatalogRepository.listServiceItems()
      });
    } catch (error) {
      send(res, 503, {
        source: 'postgres',
        error: 'Database unavailable',
        detail: error.message
      });
    }
    return;
  }

  if (resource === 'service-catalog' && req.method === 'GET') {
    try {
      send(res, 200, {
        source: 'postgres',
        data: await serviceCatalogRepository.getServiceCatalog()
      });
    } catch (error) {
      send(res, 503, {
        source: 'postgres',
        error: 'Database unavailable',
        detail: error.message
      });
    }
    return;
  }

  if (resource === 'dashboard' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, resource, req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      send(res, 200, await backstageRepository.getDashboard(Object.fromEntries(query.entries())));
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (resource === 'auditLogs' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, resource, req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      const filters = auditQueryFromSearchParams(query);
      if (parts[2] === 'export') {
        const rows = await backstageRepository.listAuditLogsForExport(Object.assign({}, filters, { limit: 10000 }));
        await backstageRepository.writeAuditExport(getActor(req, currentUser), filters, rows.length);
        sendCsv(res, `操作记录_${timestampForFilename()}.csv`, auditLogsToCsv(rows));
        return;
      }
      send(res, 200, await backstageRepository.listAuditLogs(filters));
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (resource === 'exportInfo' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'exportInfo', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      const filters = exportInfoQueryFromSearchParams(query);
      const typeConfig = exportInfoTypes[filters.type];
      if (!typeConfig) {
        send(res, 400, { ok: false, error: '请选择导出对象' });
        return;
      }
      const targetAuthz = accessControl.canAccessResource(currentUser, typeConfig.resource, 'GET');
      if (!targetAuthz.ok) {
        send(res, targetAuthz.status, { ok: false, error: targetAuthz.message || '您没有该导出权限' });
        return;
      }
      const accessFilter = accessControl.listFilterForUser(currentUser, typeConfig.resource);
      const records = accessFilter
        ? await resourceRepository.listWhere(typeConfig.resource, accessFilter)
        : await resourceRepository.list(typeConfig.resource);
      const filtered = records.filter((record) => recordMatchesExportFilters(record, filters));
      if (parts[2] === 'export') {
        const limited = filtered.slice(0, 10000);
        const filename = `${typeConfig.filename}_${filters.status || filters.interviewMethod || exportInfoDateLabel(filters)}.csv`;
        sendCsv(res, filename, exportInfoRowsToCsv(filters.type, limited));
        return;
      }
      const page = Math.max(Number(filters.page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
      const start = (page - 1) * pageSize;
      send(res, 200, {
        ok: true,
        type: filters.type,
        label: typeConfig.label,
        total: filtered.length,
        page,
        pageSize,
        items: filtered.slice(start, start + pageSize)
      });
    } catch (error) {
      sendError(res, 503, '导出信息查询失败', error.message);
    }
    return;
  }

  if (resource === 'todos' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'todos', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      send(res, 200, await demandFollowUpRepository.listTodos(currentUser, {
        category: query.get('category'),
        keyword: query.get('keyword'),
        operatorId: query.get('operatorId'),
        page: query.get('page'),
        pageSize: query.get('pageSize')
      }));
    } catch (error) {
      sendError(res, error.status || 400, 'Load todos failed', error.message);
    }
    return;
  }

  if (resource === 'company-profile') {
    const authz = accessControl.canAccessResource(currentUser, 'companyProfile', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method === 'GET') {
        send(res, 200, await companyProfileRepository.getProfile());
        return;
      }
      if (req.method === 'PUT') {
        const body = await readBody(req);
        send(res, 200, await companyProfileRepository.updateProfile(body, getActor(req, currentUser)));
        return;
      }
      send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      sendError(res, error.status || 400, 'Company profile failed', error.message);
    }
    return;
  }

  if (resource === 'miniprogram' && req.method === 'GET' && parts.length === 2) {
    try {
      send(res, 200, expandMiniprogramImages(req, await backstageRepository.getMiniprogramData()));
    } catch (error) {
      const data = readData();
      const visibleStores = (data.stores || []).filter((item) => item.visible !== false);
      const visibleModules = (data.serviceModules || [])
        .filter((item) => item.visible !== false)
        .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
      const certifiedAyis = (data.ayis || []).filter((item) => item.status === '已认证');
      const openDemands = (data.demands || []).filter((item) => !['已成交', '已取消', '已关闭'].includes(item.status));

      send(res, 200, {
        source: 'data-json-fallback',
        databaseUnavailable: true,
        error: error.message,
        ayis: certifiedAyis,
        demands: openDemands,
        stores: visibleStores.map((item) => expandStoreImages(req, item)),
        serviceModules: visibleModules.map((item) => expandServiceModuleImages(req, item)),
        banners: (data.banners || []).filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)),
        companyProfile: data.companyProfile || {}
      });
    }
    return;
  }

  if (resource === 'miniprogram' && parts[2] === 'demands' && req.method === 'POST' && parts.length === 3) {
    try {
      const body = await readBody(req);
      if (!body.customerName || !body.phone || !body.address || !body.startTime) {
        send(res, 400, { ok: false, error: 'customerName, phone, address and startTime are required' });
        return;
      }
      const result = await demandMatchRepository.createCustomerDemand(body);
      send(res, 201, {
        ok: true,
        demandId: result.demand.id,
        accessToken: result.accessToken,
        demand: result.demand
      });
    } catch (error) {
      sendApiError(res, error, 'Create demand failed');
    }
    return;
  }

  if (resource === 'miniprogram' && parts[2] === 'demands' && parts[3] && req.method === 'GET') {
    try {
      const demandId = Number(parts[3]);
      const accessToken = readDemandAccessToken(req);
      if (!accessToken) {
        send(res, 400, { ok: false, error: 'X-Demand-Access-Token header is required' });
        return;
      }
      if (parts[4] === 'matches') {
        send(res, 200, {
          ok: true,
          demandId,
          matches: await demandMatchRepository.listPublicMatches(demandId, accessToken)
        });
        return;
      }
      if (parts.length === 4) {
        const demand = await demandMatchRepository.findCustomerDemand(demandId, accessToken);
        if (!demand) {
          send(res, 403, { ok: false, error: 'Demand token mismatch' });
          return;
        }
        send(res, 200, { ok: true, demand });
        return;
      }
    } catch (error) {
      sendApiError(res, error, 'Load demand failed');
      return;
    }
  }

  if (resource === 'miniprogram' && parts[2] === 'demand-matches' && parts[3] && parts[4] === 'decision' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const accessToken = readDemandAccessToken(req);
      if (!accessToken) {
        send(res, 400, { ok: false, error: 'X-Demand-Access-Token header is required' });
        return;
      }
      const match = await demandMatchRepository.decideMatch(Number(parts[3]), Object.assign({}, body, { accessToken }));
      send(res, 200, { ok: true, match });
    } catch (error) {
      sendApiError(res, error, 'Update match decision failed');
    }
    return;
  }

  if (resource === 'ayis' && parts[2] === 'candidates' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'ayis', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      send(res, 200, Object.assign({ ok: true }, await ayiAvailabilityRepository.listCandidates(Object.fromEntries(query.entries()), currentUser)));
    } catch (error) {
      sendError(res, error.status || 400, 'Load ayi candidates failed', error.message);
    }
    return;
  }

  if (resource === 'ayis' && id && parts[3] === 'availability') {
    const authz = accessControl.canAccessResource(currentUser, 'ayis', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method === 'GET') {
        send(res, 200, { ok: true, profile: await ayiAvailabilityRepository.getProfile(id) });
        return;
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        const body = await readBody(req);
        send(res, 200, { ok: true, profile: await ayiAvailabilityRepository.updateAvailability(id, body, getActor(req, currentUser)) });
        return;
      }
      send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      sendError(res, error.status || 400, 'Ayi availability failed', error.message);
    }
    return;
  }

  if (resource === 'ayis' && id && parts[3] === 'preferences') {
    const authz = accessControl.canAccessResource(currentUser, 'ayis', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method !== 'PUT' && req.method !== 'POST') {
        send(res, 405, { error: 'Method not allowed' });
        return;
      }
      const body = await readBody(req);
      send(res, 200, { ok: true, profile: await ayiAvailabilityRepository.updatePreferences(id, body, getActor(req, currentUser)) });
    } catch (error) {
      sendError(res, error.status || 400, 'Ayi preferences failed', error.message);
    }
    return;
  }

  if (resource === 'ayis' && id && parts[3] === 'status-history' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'ayis', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      send(res, 200, { ok: true, history: await ayiAvailabilityRepository.listHistory(id, currentUser) });
    } catch (error) {
      sendError(res, error.status || 400, 'Load ayi history failed', error.message);
    }
    return;
  }

  if (resource === 'ayis' && id && parts[3] === 'recommendation-check' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'ayis', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const query = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`).searchParams;
      send(res, 200, { ok: true, recommendation: await ayiAvailabilityRepository.checkRecommendable(id, Object.fromEntries(query.entries())) });
    } catch (error) {
      sendError(res, error.status || 400, 'Check ayi recommendation failed', error.message);
    }
    return;
  }

  if (resource === 'demands' && parts[2] === 'assignable-operators' && req.method === 'GET') {
    const authz = accessControl.canAccessResource(currentUser, 'demands', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      send(res, 200, {
        ok: true,
        operators: await demandFollowUpRepository.listAssignableOperators()
      });
    } catch (error) {
      sendError(res, error.status || 400, 'Load assignable operators failed', error.message);
    }
    return;
  }

  if (resource === 'demands' && id && parts[3] === 'assignment') {
    const authz = accessControl.canAccessResource(currentUser, 'demands', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method !== 'PUT' && req.method !== 'POST') {
        send(res, 405, { error: 'Method not allowed' });
        return;
      }
      const body = await readBody(req);
      send(res, 200, {
        ok: true,
        demand: await demandFollowUpRepository.assignDemand(id, body, currentUser)
      });
    } catch (error) {
      sendError(res, error.status || 400, 'Assign demand failed', error.message);
    }
    return;
  }

  if (resource === 'demands' && id && parts[3] === 'follow-ups') {
    const authz = accessControl.canAccessResource(currentUser, 'demands', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method === 'GET') {
        send(res, 200, Object.assign({ ok: true }, await demandFollowUpRepository.listFollowUps(id, currentUser)));
        return;
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        send(res, 201, Object.assign({ ok: true }, await demandFollowUpRepository.createFollowUp(id, body, currentUser)));
        return;
      }
      send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      sendError(res, error.status || 400, 'Follow-up failed', error.message);
    }
    return;
  }

  if (resource === 'demands' && id && parts[3] === 'matches') {
    try {
      requireBackstageResource(currentUser, 'demands', req.method);
      if (req.method === 'GET') {
        send(res, 200, {
          ok: true,
          demandId: id,
          matches: await demandMatchRepository.listBackstageMatches(id)
        });
        return;
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const match = await demandMatchRepository.createBackstageMatch(id, body, getActor(req, currentUser));
        send(res, 201, { ok: true, match });
        return;
      }
      send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      sendApiError(res, error, 'Demand matching failed');
    }
    return;
  }

  if (resource === 'appointments' && id && parts[3] === 'status' && req.method === 'PUT') {
    const authz = accessControl.canAccessResource(currentUser, 'appointments', req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      const allowedStatuses = ['待安排', '待面试', '面试中', '已面试', '跟进中', '已完成', '已取消'];
      const body = await readBody(req);
      if (!allowedStatuses.includes(body.status)) {
        send(res, 400, { ok: false, error: 'Invalid interview status' });
        return;
      }
      const before = await resourceRepository.findById('appointments', id);
      if (!before) {
        send(res, 404, { ok: false, error: 'Record not found' });
        return;
      }
      if (!accessControl.canAccessRecord(currentUser, 'appointments', before)) {
        send(res, 403, { ok: false, error: 'Permission denied' });
        return;
      }
      const record = await resourceRepository.update('appointments', id, {
        status: body.status,
        statusUpdatedBy: currentUser && currentUser.id ? Number(currentUser.id) : null,
        statusUpdatedAt: new Date().toISOString()
      }, getActor(req, currentUser));
      await emitResourceNotifications('appointments', record, before);
      send(res, 200, expandResourceImages(req, 'appointments', record));
    } catch (error) {
      sendError(res, error.status || 400, 'Update interview status failed', error.message);
    }
    return;
  }

  if (resource === 'demandMatches' && id && parts[3] === 'expire' && req.method === 'POST') {
    try {
      requireBackstageResource(currentUser, 'demands', req.method);
      const match = await demandMatchRepository.expireBackstageMatch(id, getActor(req, currentUser));
      send(res, 200, { ok: true, match });
    } catch (error) {
      sendApiError(res, error, 'Expire match failed');
    }
    return;
  }

  if (resource === 'orderDispatches') {
    const authz = accessControl.canAccessResource(currentUser, resource, req.method);
    if (!authz.ok) {
      send(res, authz.status, { ok: false, error: authz.message });
      return;
    }
    try {
      if (req.method === 'GET') {
        send(res, 200, await backstageRepository.listDispatches(accessControl.listFilterForUser(currentUser, resource)));
        return;
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const payload = accessControl.scopePayloadForCreate(currentUser, resource, body);
        send(res, 201, await backstageRepository.createDispatch(payload, getActor(req, currentUser)));
        return;
      }
      if (req.method === 'PUT' && id) {
        const body = await readBody(req);
        const before = await resourceRepository.findById(resource, id);
        if (!before) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        if (!accessControl.canAccessRecord(currentUser, resource, before)) {
          send(res, 403, { ok: false, error: 'Permission denied' });
          return;
        }
        const payload = accessControl.scopePayloadForUpdate(currentUser, resource, body);
        const record = await resourceRepository.update(resource, id, payload, getActor(req, currentUser));
        if (!record) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        send(res, 200, record);
        return;
      }
      if (req.method === 'DELETE' && id) {
        const before = await resourceRepository.findById(resource, id);
        if (!before) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        if (!accessControl.canAccessRecord(currentUser, resource, before)) {
          send(res, 403, { ok: false, error: 'Permission denied' });
          return;
        }
        const deleted = await resourceRepository.remove(resource, id, getActor(req, currentUser));
        if (!deleted) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        send(res, 200, { ok: true });
        return;
      }
      send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      sendError(res, 400, 'Order dispatch failed', error.message);
    }
    return;
  }

  if (!allowed.includes(resource)) {
    send(res, 404, { error: 'Unknown resource' });
    return;
  }

  const authz = accessControl.canAccessResource(currentUser, resource, req.method);
  if (!authz.ok) {
    send(res, authz.status, { ok: false, error: authz.message });
    return;
  }

  if (req.method === 'GET') {
    try {
      if (id) {
        const record = await resourceRepository.findById(resource, id);
        if (!record) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        const serviceModuleType = resource === 'serviceModules' ? getServiceModuleTypeFromQuery(req) : '';
        if (serviceModuleType === '__invalid__') {
          send(res, 400, { ok: false, error: 'Invalid moduleType' });
          return;
        }
        if (resource === 'serviceModules' && serviceModuleType && record.moduleType !== serviceModuleType) {
          send(res, 403, { ok: false, error: 'Cannot load service module across type pages' });
          return;
        }
        if (!accessControl.canAccessRecord(currentUser, resource, record)) {
          send(res, 403, { ok: false, error: 'Permission denied' });
          return;
        }
        send(res, 200, expandResourceImages(req, resource, record));
        return;
      }
      const serviceModuleType = resource === 'serviceModules' ? getServiceModuleTypeFromQuery(req) : '';
      if (serviceModuleType === '__invalid__') {
        send(res, 400, { ok: false, error: 'Invalid moduleType' });
        return;
      }
      const accessFilter = accessControl.listFilterForUser(currentUser, resource);
      const filters = [];
      const params = [];
      if (accessFilter) {
        filters.push(accessFilter.clause);
        params.push(...(accessFilter.params || []));
      }
      if (serviceModuleType) {
        params.push(serviceModuleType);
        filters.push(`module_type = $${params.length}`);
      }
      const filter = filters.length ? { clause: filters.join(' AND '), params } : null;
      const records = filter ? await resourceRepository.listWhere(resource, filter) : await resourceRepository.list(resource);
      send(res, 200, expandResourceImages(req, resource, records));
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const serviceModuleType = resource === 'serviceModules' ? getServiceModuleTypeFromQuery(req) : '';
      if (serviceModuleType === '__invalid__') {
        send(res, 400, { ok: false, error: 'Invalid moduleType' });
        return;
      }
      const payload = accessControl.scopePayloadForCreate(currentUser, resource, body);
      if (resource === 'serviceModules') {
        if (!serviceModuleType) {
          send(res, 400, { ok: false, error: 'moduleType query is required' });
          return;
        }
        payload.moduleType = serviceModuleType;
      }
      const preparedPayload = resource === 'stores'
        ? prepareStoreImagePayload(req, payload)
        : resource === 'serviceModules'
          ? prepareServiceModuleImagePayload(req, payload)
          : payload;
      const record = await resourceRepository.create(resource, preparedPayload, getActor(req, currentUser));
      await emitResourceNotifications(resource, record, null);
      send(res, 201, expandResourceImages(req, resource, record));
    } catch (error) {
      sendError(res, error.status || 400, 'Create failed', error.message);
    }
    return;
  }

  if (req.method === 'PUT' && id) {
    try {
      const body = await readBody(req);
      const before = await resourceRepository.findById(resource, id);
      if (!before) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
      if (!accessControl.canAccessRecord(currentUser, resource, before)) {
        send(res, 403, { ok: false, error: 'Permission denied' });
        return;
      }
      const serviceModuleType = resource === 'serviceModules' ? getServiceModuleTypeFromQuery(req) : '';
      if (serviceModuleType === '__invalid__') {
        send(res, 400, { ok: false, error: 'Invalid moduleType' });
        return;
      }
      if (resource === 'serviceModules' && serviceModuleType && before.moduleType !== serviceModuleType) {
        send(res, 403, { ok: false, error: 'Cannot edit service module across type pages' });
        return;
      }
      const payload = accessControl.scopePayloadForUpdate(currentUser, resource, body);
      if (resource === 'serviceModules') {
        payload.moduleType = before.moduleType;
      }
      const preparedPayload = resource === 'stores'
        ? prepareStoreImagePayload(req, payload, id)
        : resource === 'serviceModules'
          ? prepareServiceModuleImagePayload(req, payload, id)
          : payload;
      const record = await resourceRepository.update(resource, id, preparedPayload, getActor(req, currentUser));
      if (!record) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
      await emitResourceNotifications(resource, record, before);
      send(res, 200, expandResourceImages(req, resource, record));
    } catch (error) {
      sendError(res, error.status || 400, 'Update failed', error.message);
    }
    return;
  }

  if (req.method === 'DELETE' && id) {
    try {
      const before = await resourceRepository.findById(resource, id);
      if (!before) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
      if (!accessControl.canAccessRecord(currentUser, resource, before)) {
        send(res, 403, { ok: false, error: 'Permission denied' });
        return;
      }
      const serviceModuleType = resource === 'serviceModules' ? getServiceModuleTypeFromQuery(req) : '';
      if (serviceModuleType === '__invalid__') {
        send(res, 400, { ok: false, error: 'Invalid moduleType' });
        return;
      }
      if (resource === 'serviceModules' && serviceModuleType && before.moduleType !== serviceModuleType) {
        send(res, 403, { ok: false, error: 'Cannot delete service module across type pages' });
        return;
      }
      const deleted = await resourceRepository.remove(resource, id, getActor(req, currentUser));
      if (!deleted) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
      send(res, 200, { ok: true });
    } catch (error) {
      sendError(res, 400, 'Delete failed', error.message);
    }
    return;
  }

  send(res, 405, { error: 'Method not allowed' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      send(res, 204, '');
      return;
    }
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`北京阳光北亚家政后台已启动: http://localhost:${PORT}`);
  notificationRepository.startScheduler();
});

async function shutdown() {
  await db.closePool();
  server.close(() => process.exit(0));
}

function sendError(res, status, message, detail) {
  send(res, status, {
    ok: false,
    error: message,
    detail
  });
}

function getActor(req, user) {
  if (user) {
    return {
      name: user.username || user.phone || `user:${user.id}`,
      role: user.role
    };
  }
  const decodeHeader = (value, fallback) => {
    if (!value) return fallback;
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  };
  return {
    name: decodeHeader(req.headers['x-actor-name'], '后台'),
    role: decodeHeader(req.headers['x-actor-role'], 'system')
  };
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
