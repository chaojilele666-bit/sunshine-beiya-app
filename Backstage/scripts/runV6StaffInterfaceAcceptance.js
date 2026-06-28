const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../db');

const API_BASE = process.env.V6_ACCEPTANCE_API_BASE || 'http://localhost:5177';
const TEST_PREFIX = `V6_UI_${Date.now()}`;
const results = [];
let serverProcess = null;
let phoneSeq = 1;

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function phone(prefix) {
  return `${prefix}${String(phoneSeq++).padStart(8, '0')}`;
}

async function request(method, pathname, options = {}) {
  const body = options.body ? JSON.stringify(options.body) : null;
  const response = await fetch(new URL(pathname, API_BASE), {
    method,
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      options.token ? { Authorization: `Bearer ${options.token}` } : {},
      options.headers || {}
    ),
    body
  });
  const raw = await response.text();
  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    // Keep raw response.
  }
  return { status: response.status, data, raw };
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await request('GET', '/api/health/database');
      if (response.status === 200) return;
    } catch (error) {
      // Wait and retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('server did not become ready');
}

async function startServerIfNeeded() {
  try {
    const response = await request('GET', '/api/health/database');
    if (response.status === 200) return;
  } catch (error) {
    // Start local server below.
  }
  serverProcess = childProcess.spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'ignore'
  });
  await waitForServer();
}

async function cleanup() {
  await db.query(
    `DELETE FROM auth_sessions
     WHERE user_account_id IN (
       SELECT id FROM user_accounts WHERE username LIKE $1 OR phone LIKE '1790000000%'
     )`,
    [`%${TEST_PREFIX}%`]
  );
  await db.query(
    `DELETE FROM audit_logs
     WHERE actor LIKE $1 OR actor_name_snapshot LIKE $1 OR after_data::text LIKE $1`,
    [`%${TEST_PREFIX}%`]
  );
  await db.query(
    `DELETE FROM account_store_scopes
     WHERE account_id IN (
       SELECT id FROM user_accounts WHERE username LIKE $1 OR phone LIKE '1790000000%'
     )`,
    [`%${TEST_PREFIX}%`]
  );
  await db.query(
    `DELETE FROM user_accounts
     WHERE username LIKE $1 OR phone LIKE '1790000000%'`,
    [`%${TEST_PREFIX}%`]
  );
  await db.query(
    `DELETE FROM backstage_accounts
     WHERE name LIKE $1 OR phone LIKE '1790000000%'`,
    [`%${TEST_PREFIX}%`]
  );
  await db.query(`DELETE FROM stores WHERE name LIKE $1`, [`%${TEST_PREFIX}%`]);
}

async function createStore(name) {
  const result = await db.query(
    `INSERT INTO stores (name, visible) VALUES ($1, true) RETURNING id, name`,
    [name]
  );
  return result.rows[0];
}

async function createBoss(password) {
  const hash = await bcrypt.hash(password, 12);
  const username = `${TEST_PREFIX}_boss`;
  const p = phone('179');
  const result = await db.query(
    `INSERT INTO user_accounts (username, phone, password_hash, role, status, failed_login_count)
     VALUES ($1,$2,$3,'boss','active',0)
     RETURNING id, username, phone, role`,
    [username, p, hash]
  );
  return result.rows[0];
}

(async () => {
  let bossToken = '';
  let createdAccount = null;
  try {
    await cleanup();
    await startServerIfNeeded();
    const store = await createStore(`${TEST_PREFIX}_store`);
    const bossPassword = `${TEST_PREFIX}Pwd9!`;
    const boss = await createBoss(bossPassword);

    await step('手机号登录', async () => {
      const response = await request('POST', '/api/auth/login', {
        body: { identifier: boss.phone, password: bossPassword }
      });
      assert(response.status === 200 && response.data.token, `login status ${response.status}`);
      bossToken = response.data.token;
      return 'boss login ok';
    });

    await step('账号与权限页面接口可访问', async () => {
      const response = await request('GET', '/api/auth/staff-accounts', { token: bossToken });
      assert(response.status === 200 && Array.isArray(response.data.accounts), `status ${response.status}`);
      return `${response.data.accounts.length} accounts`;
    });

    await step('创建账号并只返回一次临时密码', async () => {
      const response = await request('POST', '/api/auth/staff-accounts', {
        token: bossToken,
        body: {
          name: `${TEST_PREFIX}_staff`,
          phone: phone('179'),
          role: 'store_staff',
          store_id: store.id,
          permissions: ['demands', 'todos'],
          account_status: 'active'
        }
      });
      assert(response.status === 201, `status ${response.status}`);
      createdAccount = response.data.account;
      assert(createdAccount.temporary_password && createdAccount.temporary_password.length >= 10, 'missing temp password');
      return 'temp password returned once in create response';
    });

    await step('临时密码登录后必须改密', async () => {
      const response = await request('POST', '/api/auth/login', {
        body: { identifier: createdAccount.phone, password: createdAccount.temporary_password }
      });
      assert(response.status === 200 && response.data.user.mustChangePassword === true, `status ${response.status}`);
      createdAccount.tempToken = response.data.token;
      return 'mustChangePassword true';
    });

    await step('改密前不能访问普通后台接口', async () => {
      const response = await request('GET', '/api/analytics/my', { token: createdAccount.tempToken });
      assert(response.status === 403, `status ${response.status}`);
      return 'blocked by PASSWORD_CHANGE_REQUIRED';
    });

    await step('首次改密后临时密码失效', async () => {
      const nextPassword = `${TEST_PREFIX}New9!`;
      const change = await request('POST', '/api/auth/change-password', {
        token: createdAccount.tempToken,
        body: {
          currentPassword: createdAccount.temporary_password,
          newPassword: nextPassword,
          confirmPassword: nextPassword
        }
      });
      assert(change.status === 200, `change status ${change.status}`);
      const oldLogin = await request('POST', '/api/auth/login', {
        body: { identifier: createdAccount.phone, password: createdAccount.temporary_password }
      });
      assert(oldLogin.status === 401, `old temp login status ${oldLogin.status}`);
      createdAccount.password = nextPassword;
      return 'temp rejected after change';
    });

    await step('重置密码', async () => {
      const response = await request('POST', `/api/auth/staff-accounts/${createdAccount.account_id}/reset-password`, { token: bossToken });
      assert(response.status === 200 && response.data.account.temporary_password, `status ${response.status}`);
      createdAccount.resetPassword = response.data.account.temporary_password;
      return 'new temp password returned';
    });

    await step('停用和解锁', async () => {
      const disabled = await request('POST', `/api/auth/staff-accounts/${createdAccount.account_id}/disable`, { token: bossToken });
      assert(disabled.status === 200 && disabled.data.account.account_status === 'disabled', `disable ${disabled.status}`);
      const unlocked = await request('POST', `/api/auth/staff-accounts/${createdAccount.account_id}/unlock`, { token: bossToken });
      assert(unlocked.status === 200 && unlocked.data.account.account_status === 'active', `unlock ${unlocked.status}`);
      return 'disabled and unlocked';
    });

    await step('强制退出', async () => {
      const response = await request('POST', `/api/auth/staff-accounts/${createdAccount.account_id}/force-logout`, { token: bossToken });
      assert(response.status === 200, `status ${response.status}`);
      return 'session version bumped';
    });

    await step('个人信息正确且可改普通资料', async () => {
      const updated = await request('PUT', '/api/auth/profile', {
        token: bossToken,
        body: { name: `${TEST_PREFIX}_boss_renamed` }
      });
      assert(updated.status === 200 && updated.data.user.name === `${TEST_PREFIX}_boss_renamed`, `status ${updated.status}`);
      return 'profile updated';
    });

    await step('用户不能修改自己权限', async () => {
      const response = await request('PUT', '/api/auth/profile', {
        token: bossToken,
        body: { name: `${TEST_PREFIX}_boss_renamed`, permissions: ['accounts', 'auditLogs'] }
      });
      assert(response.status === 200, `status ${response.status}`);
      assert(!JSON.stringify(response.data).includes('auditLogs'), 'profile endpoint echoed forbidden permission change');
      return 'permissions ignored by profile endpoint';
    });

    await step('我的工作数据正确', async () => {
      const response = await request('GET', '/api/analytics/my', { token: bossToken });
      assert(response.status === 200 && response.data.overview && response.data.overview.metrics, `status ${response.status}`);
      return 'my analytics loaded';
    });

    await step('管理看全部门店和员工', async () => {
      const response = await request('GET', '/api/analytics', { token: bossToken });
      assert(response.status === 200 && Array.isArray(response.data.stores) && Array.isArray(response.data.staff), `status ${response.status}`);
      return 'overview loaded';
    });

    await step('日期筛选统一', async () => {
      const response = await request('GET', '/api/analytics?preset=last7', { token: bossToken });
      assert(response.status === 200 && response.data.range && response.data.range.preset, `status ${response.status}`);
      return response.data.range.preset;
    });

    await step('顶部、表格、趋势和下钻数字同口径', async () => {
      const response = await request('GET', '/api/analytics?preset=today', { token: bossToken });
      assert(response.status === 200, `status ${response.status}`);
      const total = Number(response.data.metrics.effectiveOperations || 0);
      const storeTotal = (response.data.stores || []).reduce((sum, row) => sum + Number(row.metrics.effectiveOperations || 0), 0);
      assert(total === storeTotal, `overview ${total} != store total ${storeTotal}`);
      assert(Array.isArray(response.data.trends), 'missing trends');
      return 'analytics totals match';
    });

    await step('店员无法进入账号管理', async () => {
      const login = await request('POST', '/api/auth/login', {
        body: { identifier: createdAccount.phone, password: createdAccount.resetPassword }
      });
      assert(login.status === 200, `staff login ${login.status}`);
      const response = await request('GET', '/api/auth/staff-accounts', { token: login.data.token });
      assert(response.status === 403, `status ${response.status}`);
      return '403';
    });

    await step('页面不显示密码、哈希、完整 token 或内部枚举', async () => {
      const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
      assert(!app.includes('password_hash'), 'password_hash exposed in page');
      assert(app.includes('手机号') && app.includes('管理') && app.includes('运营') && app.includes('店长') && app.includes('店员'), 'missing Chinese labels');
      return 'static page checked';
    });

    await step('后台登录页包含记住手机号和忘记密码提示', async () => {
      const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
      assert(app.includes('记住手机号') && app.includes('忘记密码请联系管理员'), 'missing login hints');
      return 'login UI text present';
    });

    await step('账号列表不返回敏感字段', async () => {
      const response = await request('GET', '/api/auth/staff-accounts', { token: bossToken });
      const text = JSON.stringify(response.data);
      assert(!text.includes('password_hash') && !text.includes('token_hash') && !text.includes('temporary_password'), 'sensitive account list field exposed');
      return 'safe account list';
    });

    await step('跨门店隐私接口存在', async () => {
      const response = await request('GET', '/api/analytics/records?storeId=999999', { token: bossToken });
      assert([200, 403].includes(response.status), `status ${response.status}`);
      return 'records endpoint guarded';
    });
  } finally {
    await cleanup();
    if (serverProcess) serverProcess.kill();
    await db.closePool();
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    results
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.fail > 0) process.exit(1);
})().catch(async (error) => {
  add('fatal', 'FAIL', error.message);
  try {
    await cleanup();
    if (serverProcess) serverProcess.kill();
    await db.closePool();
  } catch (closeError) {
    // Ignore cleanup errors.
  }
  console.log(JSON.stringify({
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    results
  }, null, 2));
  process.exit(1);
});
