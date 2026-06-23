const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const accessControl = require('./accessControl');
const authRepository = require('./repositories/authRepository');
const backstageRepository = require('./repositories/backstageRepository');
const resourceRepository = require('./repositories/resourceRepository');
const serviceCatalogRepository = require('./repositories/serviceCatalogRepository');

const PORT = 5177;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data.json');
const STORE_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'stores');
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

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

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  if (Buffer.isBuffer(body) || typeof body === 'string') {
    res.end(body);
    return;
  }
  res.end(JSON.stringify(body));
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

function saveStoreImage(dataUrl, storeId, fieldName) {
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

  fs.mkdirSync(STORE_UPLOAD_DIR, { recursive: true });
  const ext = imageExtension(mime);
  const safeField = fieldName === 'managerImage' ? 'manager' : 'image';
  const filename = `store-${storeId || 'new'}-${safeField}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;
  const filePath = path.join(STORE_UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/stores/${filename}`;
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

function expandResourceImages(req, resource, value) {
  if (resource !== 'stores') return value;
  if (Array.isArray(value)) return value.map((item) => expandStoreImages(req, item));
  return expandStoreImages(req, value);
}

function expandMiniprogramImages(req, data) {
  return Object.assign({}, data, {
    stores: (data.stores || []).map((item) => expandStoreImages(req, item))
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
        allowedResources: accessControl.allowedResourcesForRole(currentUser.role),
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

    send(res, 404, { error: 'Unknown auth endpoint' });
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
  const allowed = ['accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners', 'orderDispatches'];
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
      send(res, 200, await backstageRepository.getDashboard());
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
      send(res, 200, await backstageRepository.listAuditLogs());
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (resource === 'miniprogram' && req.method === 'GET') {
    try {
      send(res, 200, expandMiniprogramImages(req, await backstageRepository.getMiniprogramData()));
    } catch (error) {
      const data = readData();
      const visibleStores = (data.stores || []).filter((item) => item.visible !== false);
      const visibleModules = (data.serviceModules || [])
        .filter((item) => item.visible !== false)
        .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
      const certifiedAyis = (data.ayis || []).filter((item) => item.status === '已认证');
      const openDemands = (data.demands || []).filter((item) => !['已成交', '已取消'].includes(item.status));

      send(res, 200, {
        source: 'data-json-fallback',
        databaseUnavailable: true,
        error: error.message,
        ayis: certifiedAyis,
        demands: openDemands,
        stores: visibleStores.map((item) => expandStoreImages(req, item)),
        serviceModules: visibleModules,
        banners: (data.banners || []).filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
      });
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
        if (!accessControl.canAccessRecord(currentUser, resource, record)) {
          send(res, 403, { ok: false, error: 'Permission denied' });
          return;
        }
        send(res, 200, expandResourceImages(req, resource, record));
        return;
      }
      const filter = accessControl.listFilterForUser(currentUser, resource);
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
      const payload = accessControl.scopePayloadForCreate(currentUser, resource, body);
      const preparedPayload = resource === 'stores' ? prepareStoreImagePayload(req, payload) : payload;
      const record = await resourceRepository.create(resource, preparedPayload, getActor(req, currentUser));
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
      const payload = accessControl.scopePayloadForUpdate(currentUser, resource, body);
      const preparedPayload = resource === 'stores' ? prepareStoreImagePayload(req, payload, id) : payload;
      const record = await resourceRepository.update(resource, id, preparedPayload, getActor(req, currentUser));
      if (!record) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
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
