const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const backstageRepository = require('./repositories/backstageRepository');
const resourceRepository = require('./repositories/resourceRepository');
const serviceCatalogRepository = require('./repositories/serviceCatalogRepository');

const PORT = 5177;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data.json');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
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
    'Access-Control-Allow-Headers': 'Content-Type'
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

async function handleApi(req, res) {
  const parts = req.url.split('?')[0].split('/').filter(Boolean);
  const resource = parts[1];
  const id = parts[2] ? Number(parts[2]) : null;
  const allowed = ['accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners', 'orderDispatches'];

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
    try {
      send(res, 200, await backstageRepository.getDashboard());
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (resource === 'miniprogram' && req.method === 'GET') {
    try {
      send(res, 200, await backstageRepository.getMiniprogramData());
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
        stores: visibleStores,
        serviceModules: visibleModules,
        banners: (data.banners || []).filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
      });
    }
    return;
  }

  if (resource === 'orderDispatches') {
    try {
      if (req.method === 'GET') {
        send(res, 200, await backstageRepository.listDispatches());
        return;
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        send(res, 201, await backstageRepository.createDispatch(body, getActor(req)));
        return;
      }
      if (req.method === 'PUT' && id) {
        const body = await readBody(req);
        const record = await resourceRepository.update(resource, id, body, getActor(req));
        if (!record) {
          send(res, 404, { error: 'Record not found' });
          return;
        }
        send(res, 200, record);
        return;
      }
      if (req.method === 'DELETE' && id) {
        const deleted = await resourceRepository.remove(resource, id, getActor(req));
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

  if (req.method === 'GET') {
    try {
      send(res, 200, id ? await resourceRepository.findById(resource, id) : await resourceRepository.list(resource));
    } catch (error) {
      sendError(res, 503, 'Database unavailable', error.message);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      send(res, 201, await resourceRepository.create(resource, body, getActor(req)));
    } catch (error) {
      sendError(res, 400, 'Create failed', error.message);
    }
    return;
  }

  if (req.method === 'PUT' && id) {
    try {
      const body = await readBody(req);
      const record = await resourceRepository.update(resource, id, body, getActor(req));
      if (!record) {
        send(res, 404, { error: 'Record not found' });
        return;
      }
      send(res, 200, record);
    } catch (error) {
      sendError(res, 400, 'Update failed', error.message);
    }
    return;
  }

  if (req.method === 'DELETE' && id) {
    try {
      const deleted = await resourceRepository.remove(resource, id, getActor(req));
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

function getActor(req) {
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
