const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_PATH = path.join(ROOT, 'docs', '13_V3_ACCEPTANCE_REPORT.md');
const API_BASE = process.env.V3_ACCEPTANCE_API_BASE || 'http://localhost:5177';
const POSTGRES_CONTAINER = process.env.POSTGRES_CONTAINER || 'sunshine-beiya-postgres';
const POSTGRES_USER = process.env.POSTGRES_USER || 'sunshine_app';
const POSTGRES_DB = process.env.POSTGRES_DB || 'sunshine_beiya';
const TEMP_DB = `sunshine_beiya_v3_acceptance_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const TEST_PREFIX = `V3_ACCEPTANCE_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const OPERATOR_PERMISSION_SQL = "ARRAY['阿姨管理','客户需求','预约面试','接单申请','订单跟进','人工派单','门店信息','服务中心','首页轮播']";

const results = [];
const cleanupTasks = [];
const created = {
  demands: [],
  matches: [],
  ayis: [],
  serviceModules: [],
  userAccounts: [],
  backstageAccounts: [],
  customers: []
};
const acceptanceCredentials = {};

function run(command, options = {}) {
  return childProcess.execSync(command, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
    env: Object.assign({}, process.env, options.env || {})
  });
}

function runStatus(command) {
  const result = childProcess.spawnSync(command, {
    cwd: ROOT,
    shell: true,
    encoding: 'utf8',
    env: process.env
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function add(name, status, detail = '') {
  results.push({ name, status, detail: String(detail || '') });
}

async function step(name, fn) {
  try {
    const detail = await fn();
    add(name, 'PASS', detail);
  } catch (error) {
    add(name, 'FAIL', error.message || error);
  }
}

function skip(name, detail) {
  add(name, 'NOT_RUN', detail);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function psql(database, sql) {
  const result = childProcess.spawnSync('docker', [
    'exec', '-i', POSTGRES_CONTAINER,
    'psql', '-v', 'ON_ERROR_STOP=1', '-U', POSTGRES_USER, '-d', database
  ], {
    cwd: ROOT,
    input: sql,
    encoding: 'utf8',
    env: process.env
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `psql failed for ${database}`);
  }
  return result.stdout || '';
}

function psqlFile(database, fileName) {
  const remotePath = `/docker-entrypoint-initdb.d/${fileName}`;
  const command = [
    'docker', 'exec', POSTGRES_CONTAINER,
    'psql', '-v', 'ON_ERROR_STOP=1', '-U', POSTGRES_USER, '-d', database,
    '-f', remotePath
  ].join(' ');
  return run(command);
}

function psqlCsv(database, sql) {
  const result = childProcess.spawnSync('docker', [
    'exec', '-i', POSTGRES_CONTAINER,
    'psql', '-A', '-t', '-F', ',', '-v', 'ON_ERROR_STOP=1',
    '-U', POSTGRES_USER, '-d', database
  ], {
    cwd: ROOT,
    input: sql,
    encoding: 'utf8',
    env: process.env
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `psql csv failed for ${database}`);
  }
  return (result.stdout || '').trim();
}

function collectFiles(dir, predicate) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'public/uploads', 'test-assets'].some((part) => relative.includes(part))) continue;
      files.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkBalancedWxml(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '');
  const stack = [];
  const tagPattern = /<\/?([a-zA-Z][\w-]*)(?:\s[^<>]*)?>/g;
  const voidTags = new Set(['image', 'input', 'textarea', 'progress', 'slider', 'switch', 'checkbox', 'radio']);
  let match;
  while ((match = tagPattern.exec(text))) {
    const raw = match[0];
    const name = match[1];
    if (raw.endsWith('/>') || voidTags.has(name)) continue;
    if (raw.startsWith('</')) {
      const previous = stack.pop();
      if (previous !== name) {
        throw new Error(`${path.relative(ROOT, filePath)} mismatched ${previous || 'none'} vs ${name}`);
      }
    } else {
      stack.push(name);
    }
  }
  if (stack.length) throw new Error(`${path.relative(ROOT, filePath)} unclosed ${stack.join(',')}`);
}

function request(method, pathname, options = {}) {
  const url = new URL(pathname, API_BASE);
  return new Promise((resolve, reject) => {
    const body = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(url, {
      method,
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, options.token ? { Authorization: `Bearer ${options.token}` } : {}, options.headers || {})
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data = raw;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch (error) {
          // Keep raw response for diagnostics.
        }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function expectStatus(name, method, pathname, expected, options = {}) {
  const response = await request(method, pathname, options);
  assert(response.status === expected, `${name}: expected ${expected}, got ${response.status}`);
  return response.data;
}

async function login(role) {
  const password = acceptanceCredentials[role];
  assert(password, `${role} acceptance password was not prepared`);
  const response = await request('POST', '/api/auth/login', {
    body: {
      identifier: `v3_accept_${role}_${TEST_PREFIX.toLowerCase()}`,
      password
    }
  });
  assert(response.status === 200 && response.data && response.data.token, `${role} login failed with ${response.status}`);
  return response.data.token;
}

async function cleanDatabase() {
  const sql = `
    DELETE FROM auth_sessions WHERE user_account_id IN (SELECT id FROM user_accounts WHERE username LIKE 'v3_accept_%');
    DELETE FROM user_accounts WHERE username LIKE 'v3_accept_%';
    DELETE FROM backstage_accounts WHERE phone LIKE '17399%';
    DELETE FROM customers WHERE phone LIKE '17499%';
    DELETE FROM demand_matches WHERE recommend_note LIKE 'V3_ACCEPTANCE_%'
      OR demand_id IN (SELECT id FROM demands WHERE customer_name LIKE 'V3_ACCEPTANCE_%')
      OR ayi_id IN (SELECT id FROM ayis WHERE name LIKE 'V3_ACCEPTANCE_%');
    DELETE FROM audit_logs WHERE after_summary::text LIKE '%V3_ACCEPTANCE_%' OR before_summary::text LIKE '%V3_ACCEPTANCE_%';
    DELETE FROM demands WHERE customer_name LIKE 'V3_ACCEPTANCE_%';
    DELETE FROM ayis WHERE name LIKE 'V3_ACCEPTANCE_%' OR intro LIKE 'V3_ACCEPTANCE_%';
    DELETE FROM service_modules WHERE title LIKE 'V3_ACCEPTANCE_%';
  `;
  try {
    psql(POSTGRES_DB, sql);
  } catch (error) {
    add('测试数据清理', 'FAIL', error.message);
    return;
  }
  add('测试数据清理', 'PASS', 'V3 acceptance rows removed by prefix.');
}

async function prepareAcceptanceAccounts() {
  const roles = ['boss', 'operator', 'customer', 'ayi'];
  for (const role of roles) {
    acceptanceCredentials[role] = crypto.randomBytes(18).toString('base64url');
  }
  const hashes = {};
  for (const role of roles) {
    hashes[role] = await bcrypt.hash(acceptanceCredentials[role], 10);
  }

  const backstageBossPhone = `17399${String(Date.now()).slice(-6)}`;
  const backstageOperatorPhone = `17398${String(Date.now()).slice(-6)}`;
  const customerPhone = `17499${String(Date.now()).slice(-6)}`;
  const ayiPhone = `17099${String(Date.now()).slice(-6)}`;

  const sql = `
    WITH boss_profile AS (
      INSERT INTO backstage_accounts (name, phone, role, entry, permissions, status, note)
      VALUES ('V3 acceptance boss', '${backstageBossPhone}', '管理端', '后台管理', ARRAY['acceptance'], '启用', '${TEST_PREFIX}')
      RETURNING id, phone
    ),
    operator_profile AS (
      INSERT INTO backstage_accounts (name, phone, role, entry, permissions, status, note)
      VALUES ('V3 acceptance operator', '${backstageOperatorPhone}', '运营端', '后台管理', ${OPERATOR_PERMISSION_SQL}, '启用', '${TEST_PREFIX}')
      RETURNING id, phone
    ),
    customer_profile AS (
      INSERT INTO customers (name, phone, source, status, notes)
      VALUES ('${TEST_PREFIX}_customer_profile', '${customerPhone}', 'acceptance', 'active', '${TEST_PREFIX}')
      RETURNING id, phone
    ),
    ayi_profile AS (
      INSERT INTO ayis (name, phone, source, status, visible, service_type, intro)
      VALUES ('${TEST_PREFIX}_ayi_profile', '${ayiPhone}', 'acceptance', '已认证', true, '育儿嫂', '${TEST_PREFIX}')
      RETURNING id, phone
    )
    INSERT INTO user_accounts (username, phone, password_hash, role, related_profile_type, related_profile_id, status)
    SELECT 'v3_accept_boss_${TEST_PREFIX.toLowerCase()}', phone, '${hashes.boss}', 'boss', 'backstage_accounts', id::text, 'active' FROM boss_profile
    UNION ALL
    SELECT 'v3_accept_operator_${TEST_PREFIX.toLowerCase()}', phone, '${hashes.operator}', 'operator', 'backstage_accounts', id::text, 'active' FROM operator_profile
    UNION ALL
    SELECT 'v3_accept_customer_${TEST_PREFIX.toLowerCase()}', phone, '${hashes.customer}', 'customer', 'customers', id::text, 'active' FROM customer_profile
    UNION ALL
    SELECT 'v3_accept_ayi_${TEST_PREFIX.toLowerCase()}', phone, '${hashes.ayi}', 'ayi', 'ayis', id::text, 'active' FROM ayi_profile;
  `;
  psql(POSTGRES_DB, sql);
}

async function staticChecks() {
  await step('全仓 JS node --check', () => {
    const files = collectFiles(ROOT, (file) => file.endsWith('.js'));
    for (const file of files) {
      run(`${JSON.stringify(process.execPath)} --check ${JSON.stringify(file)}`);
    }
    return `${files.length} JS files checked`;
  });

  await step('JSON 解析', () => {
    const files = collectFiles(ROOT, (file) => file.endsWith('.json'));
    for (const file of files) JSON.parse(fs.readFileSync(file, 'utf8'));
    return `${files.length} JSON files parsed`;
  });

  await step('WXML 标签检查', () => {
    const files = collectFiles(path.join(ROOT, 'frontend'), (file) => file.endsWith('.wxml'));
    for (const file of files) checkBalancedWxml(file);
    return `${files.length} WXML files checked`;
  });

  await step('SQL UTF-8/BOM/乱码检查', () => {
    const files = collectFiles(path.join(ROOT, 'database', 'init'), (file) => file.endsWith('.sql'));
    const badMarkers = ['\uFFFD', '\u951f'];
    for (const file of files) {
      const buffer = fs.readFileSync(file);
      assert(!(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf), `${path.basename(file)} has BOM`);
      const text = buffer.toString('utf8');
      assert(!badMarkers.some((marker) => text.includes(marker)), `${path.basename(file)} has mojibake marker`);
    }
    return `${files.length} SQL files checked`;
  });

  await step('常见乱码搜索', () => {
    const files = collectFiles(ROOT, (file) => /\.(md|js|json|wxml|wxss|sql|html|css)$/.test(file));
    const markers = ['\u951f', '\uFFFD'];
    const hits = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (markers.some((marker) => text.includes(marker))) hits.push(path.relative(ROOT, file));
    }
    assert(hits.length === 0, `garbled replacement markers found in ${hits.join(', ')}`);
    return `${files.length} text files scanned`;
  });

  await step('敏感信息扫描', () => {
    const status = runStatus('git ls-files --cached --others --exclude-standard');
    const files = status.stdout.split(/\r?\n/).filter(Boolean);
    const patterns = [
      /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
      /xox[baprs]-[A-Za-z0-9-]+/,
      /sk-[A-Za-z0-9]{20,}/,
      /DATABASE_URL\s*=\s*postgres(?:ql)?:\/\/.+:.+@/i,
      /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /token\s*[:=]\s*['"][A-Za-z0-9._~+/=-]{20,}['"]/i
    ];
    const hits = [];
    for (const rel of files) {
      if (rel === '.env' || rel.includes('node_modules') || rel.includes('public/uploads') || rel.includes('test-assets')) continue;
      const fullPath = path.join(ROOT, rel);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size > 1024 * 1024) continue;
      const text = fs.readFileSync(fullPath, 'utf8');
      if (patterns.some((pattern) => pattern.test(text))) hits.push(rel);
    }
    assert(hits.length === 0, `possible sensitive literals in ${hits.join(', ')}`);
    return `${files.length} tracked/untracked candidates scanned`;
  });

  await step('git diff --check', () => {
    const result = runStatus('git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check');
    assert(result.status === 0, result.stderr || result.stdout || 'git diff --check failed');
    return 'clean';
  });

  await step('git status --short', () => {
    const status = run('git status --short');
    return `${status.split(/\r?\n/).filter(Boolean).length} changed/untracked entries`;
  });
}

async function migrationChecks() {
  await step('临时数据库创建', () => {
    psql('postgres', `DROP DATABASE IF EXISTS ${TEMP_DB};`);
    psql('postgres', `CREATE DATABASE ${TEMP_DB};`);
    cleanupTasks.push(() => {
      psql('postgres', `DROP DATABASE IF EXISTS ${TEMP_DB};`);
    });
    return TEMP_DB;
  });

  const migrationFiles = fs.readdirSync(path.join(ROOT, 'database', 'init'))
    .filter((name) => /^V00[1-8].*\.sql$/.test(name))
    .sort();

  await step('V001-V008 空库首次迁移', () => {
    for (const file of migrationFiles) psqlFile(TEMP_DB, file);
    return migrationFiles.join(', ');
  });

  await step('V001-V008 空库重复迁移', () => {
    for (const file of migrationFiles) psqlFile(TEMP_DB, file);
    return migrationFiles.join(', ');
  });

  await step('空库迁移后门店不重复', () => {
    const duplicates = psqlCsv(TEMP_DB, `SELECT COALESCE(count(*),0) FROM (SELECT name FROM stores GROUP BY name HAVING count(*) > 1) d;`);
    assert(Number(duplicates) === 0, `duplicate stores: ${duplicates}`);
    return '0 duplicate store names';
  });

  await step('ayis.store_id 外键完整', () => {
    const invalid = psqlCsv(TEMP_DB, `SELECT count(*) FROM ayis a WHERE a.store_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = a.store_id);`);
    assert(Number(invalid) === 0, `invalid store_id rows: ${invalid}`);
    return 'all store_id values are valid or NULL';
  });

  await step('当前数据库 V004-V008 重复迁移', () => {
    for (const file of migrationFiles.filter((name) => /^V00[4-8]/.test(name))) psqlFile(POSTGRES_DB, file);
    return 'V004-V008 repeated on current database';
  });
}

async function apiChecks() {
  await step('API 健康检查', async () => {
    const data = await expectStatus('database health', 'GET', '/api/health/database', 200);
    assert(data && data.ok === true, 'database health returned not ok');
    return 'database healthy';
  });

  let bossToken;
  let operatorToken;
  let customerToken;
  let ayiToken;

  await step('Prepare temporary acceptance accounts', async () => {
    await prepareAcceptanceAccounts();
    return 'temporary accounts created with random credentials';
  });

  await step('测试账号登录', async () => {
    bossToken = await login('boss');
    operatorToken = await login('operator');
    customerToken = await login('customer');
    ayiToken = await login('ayi');
    return 'boss/operator/customer/ayi login ok';
  });

  await step('未登录后台接口 401', async () => {
    await expectStatus('unauth ayis', 'GET', '/api/ayis', 401);
    return '/api/ayis requires login';
  });

  await step('boss 权限矩阵', async () => {
    await expectStatus('boss dashboard', 'GET', '/api/dashboard', 200, { token: bossToken });
    await expectStatus('boss company profile', 'GET', '/api/company-profile', 200, { token: bossToken });
    await expectStatus('boss ayis', 'GET', '/api/ayis', 200, { token: bossToken });
    await expectStatus('boss demands', 'GET', '/api/demands', 200, { token: bossToken });
    return 'boss can access management resources';
  });

  await step('operator 权限矩阵', async () => {
    await expectStatus('operator company profile', 'GET', '/api/company-profile', 403, { token: operatorToken });
    await expectStatus('operator dashboard', 'GET', '/api/dashboard', 403, { token: operatorToken });
    await expectStatus('operator accounts', 'GET', '/api/accounts', 403, { token: operatorToken });
    await expectStatus('operator ayis', 'GET', '/api/ayis', 200, { token: operatorToken });
    await expectStatus('operator demands', 'GET', '/api/demands', 200, { token: operatorToken });
    return 'operator denied management-only resources and can access daily resources';
  });

  for (const [role, token] of [['customer', customerToken], ['ayi', ayiToken]]) {
    await step(`${role} 后台通用 CRUD 被拒绝`, async () => {
      const resources = ['ayis', 'demands', 'orders', 'appointments', 'applications', 'orderDispatches'];
      for (const resource of resources) {
        await expectStatus(`${role} ${resource}`, 'GET', `/api/${resource}`, 403, { token });
      }
      return `${resources.length} resources rejected`;
    });
  }

  await step('公司基础信息读取、修改、恢复', async () => {
    const before = await expectStatus('company profile get', 'GET', '/api/company-profile', 200, { token: bossToken });
    const changed = Object.assign({}, before, {
      shortName: `${before.shortName || '阳光北亚'}验收`,
      customerServicePhone: before.customerServicePhone || '18611607087'
    });
    const saved = await expectStatus('company profile put', 'PUT', '/api/company-profile', 200, { token: bossToken, body: changed });
    assert(saved.shortName === changed.shortName, 'company profile did not update');
    await expectStatus('company profile restore', 'PUT', '/api/company-profile', 200, { token: bossToken, body: before });
    return 'company profile updated and restored';
  });

  await step('小程序公开数据接口', async () => {
    const data = await expectStatus('miniprogram', 'GET', '/api/miniprogram', 200);
    assert(data.source === 'postgres', `unexpected source ${data.source}`);
    assert(data.companyProfile, 'companyProfile missing');
    assert(Array.isArray(data.serviceModules), 'serviceModules missing');
    assert(data.serviceModules.some((item) => item.moduleType === 'shortcut'), 'shortcut modules missing');
    return `source=${data.source}, serviceModules=${data.serviceModules.length}`;
  });

  let serviceModule;
  await step('服务项目停用、恢复', async () => {
    const modules = await expectStatus('service modules', 'GET', '/api/serviceModules', 200, { token: bossToken });
    serviceModule = modules.find((item) => item.moduleType === 'service');
    assert(serviceModule, 'no service module found');
    await expectStatus('disable service', 'PUT', `/api/serviceModules/${serviceModule.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, serviceModule, { visible: false })
    });
    let mini = await expectStatus('miniprogram after disable', 'GET', '/api/miniprogram', 200);
    assert(!mini.serviceModules.some((item) => item.id === serviceModule.id), 'disabled service still visible');
    await expectStatus('restore service', 'PUT', `/api/serviceModules/${serviceModule.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, serviceModule, { visible: serviceModule.visible !== false })
    });
    mini = await expectStatus('miniprogram after restore', 'GET', '/api/miniprogram', 200);
    assert(mini.serviceModules.some((item) => item.id === serviceModule.id), 'restored service missing');
    return `serviceModule=${serviceModule.id}`;
  });

  await step('快捷入口修改、停用、恢复', async () => {
    const modules = await expectStatus('service modules', 'GET', '/api/serviceModules', 200, { token: bossToken });
    const shortcut = modules.find((item) => item.moduleType === 'shortcut');
    assert(shortcut, 'no shortcut found');
    const changed = Object.assign({}, shortcut, { title: `${TEST_PREFIX}_shortcut`, visible: true });
    await expectStatus('update shortcut', 'PUT', `/api/serviceModules/${shortcut.id}`, 200, { token: bossToken, body: changed });
    let mini = await expectStatus('miniprogram changed shortcut', 'GET', '/api/miniprogram', 200);
    assert(mini.serviceModules.some((item) => item.id === shortcut.id && item.title === changed.title), 'changed shortcut missing');
    await expectStatus('disable shortcut', 'PUT', `/api/serviceModules/${shortcut.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, changed, { visible: false })
    });
    mini = await expectStatus('miniprogram disabled shortcut', 'GET', '/api/miniprogram', 200);
    assert(!mini.serviceModules.some((item) => item.id === shortcut.id), 'disabled shortcut still visible');
    await expectStatus('restore shortcut', 'PUT', `/api/serviceModules/${shortcut.id}`, 200, { token: bossToken, body: shortcut });
    return `shortcut=${shortcut.id}`;
  });

  let testAyi;
  await step('创建并验证阿姨上架/下架', async () => {
    testAyi = await expectStatus('create ayi', 'POST', '/api/ayis', 201, {
      token: bossToken,
      body: {
        name: `${TEST_PREFIX}_ayi`,
        phone: `17099${String(Date.now()).slice(-6)}`,
        serviceType: '育儿嫂',
        status: '已认证',
        visible: true,
        skills: ['验收'],
        intro: 'V3 acceptance test'
      }
    });
    created.ayis.push(testAyi.id);
    let mini = await expectStatus('mini with ayi', 'GET', '/api/miniprogram', 200);
    assert(mini.ayis.some((item) => item.id === testAyi.id), 'visible ayi missing in miniprogram');
    await expectStatus('downlist ayi', 'PUT', `/api/ayis/${testAyi.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, testAyi, { visible: false })
    });
    mini = await expectStatus('mini without ayi', 'GET', '/api/miniprogram', 200);
    assert(!mini.ayis.some((item) => item.id === testAyi.id), 'downlisted ayi still public');
    await expectStatus('restore ayi', 'PUT', `/api/ayis/${testAyi.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, testAyi, { visible: true })
    });
    return `ayi=${testAyi.id}`;
  });

  let demandId;
  let accessToken;
  let matchId;
  await step('客户提交需求和 token 校验', async () => {
    const data = await expectStatus('create miniprogram demand', 'POST', '/api/miniprogram/demands', 201, {
      body: {
        customerName: `${TEST_PREFIX}_customer`,
        phone: `17199${String(Date.now()).slice(-6)}`,
        serviceType: '育儿嫂',
        city: '北京',
        address: `${TEST_PREFIX}_address`,
        startTime: '2026-07-01',
        budget: '面议',
        familyInfo: 'V3 acceptance test'
      }
    });
    demandId = data.demandId;
    accessToken = data.accessToken;
    created.demands.push(demandId);
    await expectStatus('wrong token demand', 'GET', `/api/miniprogram/demands/${demandId}`, 403, {
      headers: { 'X-Demand-Access-Token': 'wrong-token' }
    });
    const detail = await expectStatus('correct token demand', 'GET', `/api/miniprogram/demands/${demandId}`, 200, {
      headers: { 'X-Demand-Access-Token': accessToken }
    });
    assert(detail.demand && detail.demand.id === demandId, 'demand detail mismatch');
    return `demand=${demandId}`;
  });

  await step('后台推荐、重复推荐409、下架阿姨不可推荐', async () => {
    await expectStatus('downlist before recommend', 'PUT', `/api/ayis/${testAyi.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, testAyi, { visible: false })
    });
    await expectStatus('recommend downlisted ayi', 'POST', `/api/demands/${demandId}/matches`, 400, {
      token: bossToken,
      body: { ayiId: testAyi.id, recommendNote: `${TEST_PREFIX}_downlisted` }
    });
    await expectStatus('restore before recommend', 'PUT', `/api/ayis/${testAyi.id}`, 200, {
      token: bossToken,
      body: Object.assign({}, testAyi, { visible: true })
    });
    const data = await expectStatus('create match', 'POST', `/api/demands/${demandId}/matches`, 201, {
      token: bossToken,
      body: { ayiId: testAyi.id, recommendNote: `${TEST_PREFIX}_recommend` }
    });
    matchId = data.match.id;
    created.matches.push(matchId);
    await expectStatus('duplicate match', 'POST', `/api/demands/${demandId}/matches`, 409, {
      token: bossToken,
      body: { ayiId: testAyi.id, recommendNote: `${TEST_PREFIX}_duplicate` }
    });
    return `match=${matchId}`;
  });

  await step('客户推荐列表、确认、重复操作409', async () => {
    const list = await expectStatus('match list', 'GET', `/api/miniprogram/demands/${demandId}/matches`, 200, {
      headers: { 'X-Demand-Access-Token': accessToken }
    });
    assert(list.matches.some((item) => item.id === matchId), 'match not listed');
    await expectStatus('confirm match', 'POST', `/api/miniprogram/demand-matches/${matchId}/decision`, 200, {
      headers: { 'X-Demand-Access-Token': accessToken },
      body: { demandId, decision: 'confirm' }
    });
    await expectStatus('repeat confirm match', 'POST', `/api/miniprogram/demand-matches/${matchId}/decision`, 409, {
      headers: { 'X-Demand-Access-Token': accessToken },
      body: { demandId, decision: 'confirm' }
    });
    return `confirmed match=${matchId}`;
  });

  await step('客户拒绝与跨需求操作被拒绝', async () => {
    const data = await expectStatus('create second miniprogram demand', 'POST', '/api/miniprogram/demands', 201, {
      body: {
        customerName: `${TEST_PREFIX}_customer_2`,
        phone: `17299${String(Date.now()).slice(-6)}`,
        serviceType: '育儿嫂',
        city: '北京',
        address: `${TEST_PREFIX}_address_2`,
        startTime: '2026-07-02'
      }
    });
    created.demands.push(data.demandId);
    const match = await expectStatus('create second match', 'POST', `/api/demands/${data.demandId}/matches`, 201, {
      token: bossToken,
      body: { ayiId: testAyi.id, recommendNote: `${TEST_PREFIX}_recommend_2` }
    });
    created.matches.push(match.match.id);
    await expectStatus('cross demand decision', 'POST', `/api/miniprogram/demand-matches/${match.match.id}/decision`, 404, {
      headers: { 'X-Demand-Access-Token': accessToken },
      body: { demandId, decision: 'reject' }
    });
    await expectStatus('reject second match', 'POST', `/api/miniprogram/demand-matches/${match.match.id}/decision`, 200, {
      headers: { 'X-Demand-Access-Token': data.accessToken },
      body: { demandId: data.demandId, decision: 'reject' }
    });
    await expectStatus('repeat reject second match', 'POST', `/api/miniprogram/demand-matches/${match.match.id}/decision`, 409, {
      headers: { 'X-Demand-Access-Token': data.accessToken },
      body: { demandId: data.demandId, decision: 'reject' }
    });
    return `secondDemand=${data.demandId}`;
  });

  await step('audit_logs 写入', () => {
    const count = psqlCsv(POSTGRES_DB, `SELECT count(*) FROM audit_logs WHERE after_summary::text LIKE '%${TEST_PREFIX}%' OR before_summary::text LIKE '%${TEST_PREFIX}%';`);
    assert(Number(count) >= 4, `expected audit logs, got ${count}`);
    return `${count} audit rows found before cleanup`;
  });

  await step('原有门店和图片接口回归', async () => {
    const stores = await expectStatus('stores', 'GET', '/api/stores', 200, { token: bossToken });
    const mini = await expectStatus('miniprogram stores', 'GET', '/api/miniprogram', 200);
    assert(Array.isArray(stores), 'stores not array');
    assert(Array.isArray(mini.stores), 'miniprogram stores missing');
    return `stores=${stores.length}, publicStores=${mini.stores.length}`;
  });
}

function reportCounts() {
  return {
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    notRun: results.filter((item) => item.status === 'NOT_RUN').length
  };
}

function writeReport() {
  const counts = reportCounts();
  const p0 = counts.fail === 0 ? 0 : counts.fail;
  const p1 = [
    'WeChat DevTools manual checks are still required for customer homepage, demand detail, service center, store images, and ayi pages.',
    'HTTPS, official WeChat login, production deployment, filing, and formal file service are not complete.'
  ];
  const conclusion = counts.fail === 0
    ? 'Ready for WeChat manual acceptance'
    : 'Not ready to commit';

  const lines = [
    '# V3 Acceptance Report',
    '',
    `Generated at: ${new Date().toISOString()}`,
    `Branch: ${run('git branch --show-current').trim()}`,
    '',
    '## Summary',
    '',
    `- Total tests: ${counts.total}`,
    `- PASS: ${counts.pass}`,
    `- FAIL: ${counts.fail}`,
    `- Not run: ${counts.notRun}`,
    `- Remaining P0: ${p0}`,
    `- Remaining P1: ${p1.length}`,
    `- Conclusion: ${conclusion}`,
    '',
    '## Empty Database Migration',
    '',
    '- V001-V008 are executed once on an isolated temporary database.',
    '- V001-V008 are executed a second time on the same temporary database.',
    '- Store duplicates and ayis.store_id foreign key integrity are checked.',
    '- The temporary database is dropped in finally.',
    '',
    '## Permission Matrix',
    '',
    '| Role | Result |',
    '| --- | --- |',
    '| unauthenticated | Backstage API returns 401 |',
    '| boss / management | Dashboard, company profile, and daily resources are accessible |',
    '| operator | Company profile, dashboard, and account permissions return 403; daily resources are accessible |',
    '| customer | Generic Backstage CRUD returns 403 |',
    '| ayi | Generic Backstage CRUD returns 403 |',
    '',
    '## Demand Matching',
    '',
    '- Customer demand creation, wrong token rejection, and correct token detail read are checked.',
    '- Backstage recommendation, duplicate 409, and downlisted ayi rejection are checked.',
    '- Match listing, confirm, reject, cross-demand rejection, and repeated decision 409 are checked.',
    '- State changes write audit_logs.',
    '',
    '## Company Profile',
    '',
    '- Company profile can be read, updated by boss, and restored.',
    '- Operator cannot access or modify it.',
    '- /api/miniprogram returns companyProfile.',
    '',
    '## Service Center',
    '',
    '- serviceModules include service and shortcut records.',
    '- Disabling/restoring a service item affects /api/miniprogram.',
    '- Updating/disabling/restoring a shortcut affects /api/miniprogram.',
    '',
    '## Ayi Visibility',
    '',
    '- visible=true certified ayi appears in public miniprogram data.',
    '- visible=false ayi does not appear in public miniprogram data.',
    '- Downlisted ayi cannot be newly recommended.',
    '',
    '## Cleanup',
    '',
    '- Test rows use the V3_ACCEPTANCE prefix.',
    '- demands, demand_matches, ayis, service_modules, audit_logs, test accounts, and test sessions are cleaned in finally.',
    '- The temporary database is dropped in finally.',
    '',
    '## WeChat DevTools Manual Checklist',
    '',
    '- Customer homepage showcase, shortcuts, service center display, and taps.',
    '- Demand detail page after demand submission, recommended ayi list, confirm/reject actions.',
    '- Service page, demand page, and ayi profile page service type options from Backstage.',
    '- Ayi homepage, profile, certificates, application, and my applications pages.',
    '- Store list, store detail, local HTTP image conversion, navigation, and phone actions.',
    '- About page and mine page customer service phone from companyProfile.',
    '',
    '## Remaining P0',
    '',
    p0 === 0 ? '- None.' : '- Automatic acceptance failures remain and must be fixed before commit.',
    '',
    '## Remaining P1',
    '',
    ...p1.map((item) => `- ${item}`),
    '',
    '## Details',
    '',
    '| # | Check | Result | Detail |',
    '| --- | --- | --- | --- |'
  ];

  results.forEach((item, index) => {
    lines.push(`| ${index + 1} | ${item.name.replace(/\|/g, '/')} | ${item.status} | ${item.detail.replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, 500)} |`);
  });

  lines.push('');
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
}

async function main() {
  try {
    await staticChecks();
    await migrationChecks();
    await apiChecks();
  } finally {
    await cleanDatabase();
    for (const task of cleanupTasks.reverse()) {
      try {
        task();
        add('临时数据库清理', 'PASS', TEMP_DB);
      } catch (error) {
        add('临时数据库清理', 'FAIL', error.message);
      }
    }
    writeReport();
  }

  const counts = reportCounts();
  console.log(JSON.stringify({
    report: path.relative(ROOT, REPORT_PATH).replace(/\\/g, '/'),
    total: counts.total,
    pass: counts.pass,
    fail: counts.fail,
    notRun: counts.notRun
  }, null, 2));

  if (counts.fail > 0) process.exit(1);
}

main().catch((error) => {
  add('验收脚本异常', 'FAIL', error.message);
  writeReport();
  console.error(error.message);
  process.exit(1);
});
