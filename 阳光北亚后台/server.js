const http = require('http');
const fs = require('fs');
const path = require('path');

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
  const allowed = ['accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners'];

  if (resource === 'dashboard' && req.method === 'GET') {
    send(res, 200, makeDashboard(readData()));
    return;
  }

  if (resource === 'miniprogram' && req.method === 'GET') {
    const data = readData();
    const visibleStores = (data.stores || []).filter((item) => item.visible !== false);
    const visibleModules = (data.serviceModules || [])
      .filter((item) => item.visible !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    const certifiedAyis = (data.ayis || []).filter((item) => item.status === '已认证');
    const openDemands = (data.demands || []).filter((item) => !['已成交', '已取消'].includes(item.status));

    send(res, 200, {
      ayis: certifiedAyis,
      demands: openDemands,
      stores: visibleStores,
      serviceModules: visibleModules,
      banners: (data.banners || []).filter((item) => item.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
    });
    return;
  }

  if (!allowed.includes(resource)) {
    send(res, 404, { error: 'Unknown resource' });
    return;
  }

  const data = readData();
  data[resource] = data[resource] || [];

  if (req.method === 'GET') {
    send(res, 200, id ? data[resource].find((item) => item.id === id) || null : data[resource]);
    return;
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const record = Object.assign({ id: nextId(data[resource]) }, body);
    data[resource].unshift(record);
    writeData(data);
    send(res, 201, record);
    return;
  }

  if (req.method === 'PUT' && id) {
    const body = await readBody(req);
    const index = data[resource].findIndex((item) => item.id === id);
    if (index < 0) {
      send(res, 404, { error: 'Record not found' });
      return;
    }
    data[resource][index] = Object.assign({}, data[resource][index], body, { id });
    writeData(data);
    send(res, 200, data[resource][index]);
    return;
  }

  if (req.method === 'DELETE' && id) {
    if (resource === 'accounts') {
      const target = data.accounts.find((item) => item.id === id);
      if (target && target.role === '老板端') {
        const remainingBosses = data.accounts.filter((item) => item.id !== id && item.role === '老板端' && item.status !== '停用');
        if (remainingBosses.length === 0) {
          send(res, 400, { error: '至少保留一个启用的老板端账号，否则后台会进不去。' });
          return;
        }
      }
    }
    data[resource] = data[resource].filter((item) => item.id !== id);
    writeData(data);
    send(res, 200, { ok: true });
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
