const crypto = require('crypto');
const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('../db');
const accessControl = require('../accessControl');

const API_BASE = process.env.V3_ACCEPTANCE_API_BASE || 'http://localhost:5177';
const TEST_PREFIX = `V3_FOLLOW_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const results = [];
const credentials = {};
const ids = {
  users: [],
  backstageProfiles: [],
  customers: [],
  ayis: [],
  demands: [],
  followUps: []
};

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

function request(method, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(new URL(pathname, API_BASE), {
      method,
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        options.token ? { Authorization: `Bearer ${options.token}` } : {},
        options.headers || {}
      )
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
        resolve({ status: res.statusCode, data, raw });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function expectStatus(name, method, path, expected, options = {}) {
  const response = await request(method, path, options);
  assert(response.status === expected, `${name}: expected ${expected}, got ${response.status}`);
  return response.data;
}

function isoForOffset(days, hour = 9) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function login(role) {
  const response = await request('POST', '/api/auth/login', {
    body: {
      identifier: `v3_follow_${role}_${TEST_PREFIX.toLowerCase()}`,
      password: credentials[role]
    }
  });
  assert(response.status === 200 && response.data && response.data.token, `${role} login failed`);
  return response.data.token;
}

async function seed() {
  const roles = ['boss', 'operator', 'operatorOther', 'operatorDisabled', 'customer', 'ayi'];
  const hashes = {};
  for (const role of roles) {
    credentials[role] = crypto.randomBytes(18).toString('base64url');
    hashes[role] = await bcrypt.hash(credentials[role], 10);
  }

  await db.transaction(async (client) => {
    const profiles = await client.query(
      `INSERT INTO backstage_accounts (name, phone, role, entry, permissions, status, note)
       VALUES
         ($1,$2,'管理端','后台管理',ARRAY['管理端全部权限'],'启用',$7),
         ($3,$4,'运营端','后台管理',ARRAY['客户需求'],'启用',$7),
         ($5,$6,'运营端','后台管理',ARRAY['客户需求'],'启用',$7),
         ($8,$9,'运营端','后台管理',ARRAY['客户需求'],'停用',$7)
       RETURNING id, phone, status`,
      [
        `${TEST_PREFIX} boss`, `175${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} operator`, `176${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} other`, `177${String(Date.now()).slice(-8)}`,
        TEST_PREFIX,
        `${TEST_PREFIX} disabled`, `178${String(Date.now()).slice(-8)}`
      ]
    );
    profiles.rows.forEach((row) => ids.backstageProfiles.push(row.id));
    const [bossProfile, operatorProfile, otherProfile, disabledProfile] = profiles.rows;

    const customer = await client.query(
      `INSERT INTO customers (name, phone, source, status)
       VALUES ($1,$2,'验收','active')
       RETURNING id, phone`,
      [`${TEST_PREFIX} customer`, `174${String(Date.now()).slice(-8)}`]
    );
    ids.customers.push(customer.rows[0].id);

    const ayi = await client.query(
      `INSERT INTO ayis (name, phone, source, status, visible, intro)
       VALUES ($1,$2,'验收','待审核',true,$3)
       RETURNING id, phone`,
      [`${TEST_PREFIX} ayi`, `179${String(Date.now()).slice(-8)}`, TEST_PREFIX]
    );
    ids.ayis.push(ayi.rows[0].id);

    const users = await client.query(
      `INSERT INTO user_accounts (username, phone, password_hash, role, related_profile_type, related_profile_id, status)
       VALUES
         ($1,$2,$3,'boss','backstage_accounts',$4,'active'),
         ($5,$6,$7,'operator','backstage_accounts',$8,'active'),
         ($9,$10,$11,'operator','backstage_accounts',$12,'active'),
         ($13,$14,$15,'operator','backstage_accounts',$16,'active'),
         ($17,$18,$19,'customer','customers',$20,'active'),
         ($21,$22,$23,'ayi','ayis',$24,'active')
       RETURNING id, role, username`,
      [
        `v3_follow_boss_${TEST_PREFIX.toLowerCase()}`, bossProfile.phone, hashes.boss, String(bossProfile.id),
        `v3_follow_operator_${TEST_PREFIX.toLowerCase()}`, operatorProfile.phone, hashes.operator, String(operatorProfile.id),
        `v3_follow_operatorOther_${TEST_PREFIX.toLowerCase()}`, otherProfile.phone, hashes.operatorOther, String(otherProfile.id),
        `v3_follow_operatorDisabled_${TEST_PREFIX.toLowerCase()}`, disabledProfile.phone, hashes.operatorDisabled, String(disabledProfile.id),
        `v3_follow_customer_${TEST_PREFIX.toLowerCase()}`, customer.rows[0].phone, hashes.customer, String(customer.rows[0].id),
        `v3_follow_ayi_${TEST_PREFIX.toLowerCase()}`, ayi.rows[0].phone, hashes.ayi, String(ayi.rows[0].id)
      ]
    );
    users.rows.forEach((row) => ids.users.push(row.id));
    const userByName = Object.fromEntries(users.rows.map((row) => [row.username, row.id]));
    ids.bossUser = userByName[`v3_follow_boss_${TEST_PREFIX.toLowerCase()}`];
    ids.operatorUser = userByName[`v3_follow_operator_${TEST_PREFIX.toLowerCase()}`];
    ids.operatorOtherUser = userByName[`v3_follow_operatorOther_${TEST_PREFIX.toLowerCase()}`];
    ids.operatorDisabledUser = userByName[`v3_follow_operatorDisabled_${TEST_PREFIX.toLowerCase()}`];

    const demandRows = await client.query(
      `INSERT INTO demands (
        customer_name, phone, source, service_type, city, address, start_time,
        budget, family_info, consultant, follow_note, status,
        assigned_operator_id, assigned_at, assigned_by, last_followed_up_at, next_follow_up_at
       )
       VALUES
        ($1,$2,'验收','育儿嫂','北京','东城测试地址','2026-07-01','8000','三口之家','','','待处理',$3,now(),'seed',NULL,$4),
        ($5,$6,'验收','月嫂','北京','朝阳测试地址','2026-07-02','9000','新生儿','','','已联系',$3,now(),'seed',NULL,$7),
        ($8,$9,'验收','保洁','北京','海淀测试地址','2026-07-03','300','两居室','','','已联系',NULL,NULL,NULL,NULL,NULL),
        ($10,$11,'验收','老人陪护','北京','丰台测试地址','2026-07-04','7000','老人照护','','','已联系',$12,now(),'seed',NULL,$13),
        ($14,$15,'验收','小时工','北京','通州测试地址','2026-07-05','200','日常清洁','','','已联系',$3,now(),'seed',$16,$17),
        ($18,$19,'验收','住家保姆','北京','西城测试地址','2026-07-06','8500','住家','','','已关闭',$3,now(),'seed',NULL,$4)
       RETURNING id`,
      [
        `${TEST_PREFIX} today`, `136${String(Date.now()).slice(-8)}`, ids.operatorUser, isoForOffset(0, 10),
        `${TEST_PREFIX} overdue`, `135${String(Date.now()).slice(-8)}`, isoForOffset(-1, 10),
        `${TEST_PREFIX} unassigned`, `134${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} other`, `133${String(Date.now()).slice(-8)}`, ids.operatorOtherUser, isoForOffset(0, 11),
        `${TEST_PREFIX} done`, `132${String(Date.now()).slice(-8)}`, isoForOffset(0, 8), isoForOffset(1, 9),
        `${TEST_PREFIX} closed`, `131${String(Date.now()).slice(-8)}`
      ]
    );
    demandRows.rows.forEach((row) => ids.demands.push(row.id));
  });
}

async function cleanup() {
  try {
    if (ids.demands.length) {
      await db.query('DELETE FROM demand_follow_ups WHERE demand_id = ANY($1::int[]) OR note LIKE $2', [ids.demands, `${TEST_PREFIX}%`]);
      await db.query('DELETE FROM demand_matches WHERE demand_id = ANY($1::int[])', [ids.demands]);
      await db.query('DELETE FROM demands WHERE id = ANY($1::int[]) OR customer_name LIKE $2', [ids.demands, `${TEST_PREFIX}%`]);
    } else {
      await db.query('DELETE FROM demand_follow_ups WHERE note LIKE $1', [`${TEST_PREFIX}%`]);
      await db.query('DELETE FROM demands WHERE customer_name LIKE $1', [`${TEST_PREFIX}%`]);
    }
    if (ids.users.length) {
      await db.query('DELETE FROM auth_sessions WHERE user_account_id = ANY($1::int[])', [ids.users]);
      await db.query('DELETE FROM user_accounts WHERE id = ANY($1::int[]) OR username LIKE $2', [ids.users, `v3_follow_%${TEST_PREFIX.toLowerCase()}%`]);
    } else {
      await db.query('DELETE FROM user_accounts WHERE username LIKE $1', [`v3_follow_%${TEST_PREFIX.toLowerCase()}%`]);
    }
    if (ids.customers.length) await db.query('DELETE FROM customers WHERE id = ANY($1::uuid[]) OR name LIKE $2', [ids.customers, `${TEST_PREFIX}%`]);
    else await db.query('DELETE FROM customers WHERE name LIKE $1', [`${TEST_PREFIX}%`]);
    if (ids.ayis.length) await db.query('DELETE FROM ayis WHERE id = ANY($1::int[]) OR intro = $2', [ids.ayis, TEST_PREFIX]);
    else await db.query('DELETE FROM ayis WHERE intro = $1', [TEST_PREFIX]);
    if (ids.backstageProfiles.length) await db.query('DELETE FROM backstage_accounts WHERE id = ANY($1::int[]) OR note = $2', [ids.backstageProfiles, TEST_PREFIX]);
    else await db.query('DELETE FROM backstage_accounts WHERE note = $1', [TEST_PREFIX]);
    await db.query('DELETE FROM audit_logs WHERE after_summary::text LIKE $1 OR before_summary::text LIKE $1', [`%${TEST_PREFIX}%`]);
    add('cleanup temporary follow-up data', 'PASS', 'temporary rows removed');
  } catch (error) {
    add('cleanup temporary follow-up data', 'FAIL', error.message);
  }
}

(async () => {
  let bossToken;
  let operatorToken;
  let otherOperatorToken;
  let customerToken;
  let ayiToken;

  try {
    await seed();
    bossToken = await login('boss');
    operatorToken = await login('operator');
    otherOperatorToken = await login('operatorOther');
    customerToken = await login('customer');
    ayiToken = await login('ayi');

    await step('boss can assign operator', async () => {
      const temp = await db.query(
        `INSERT INTO demands (customer_name, phone, source, service_type, city, address, start_time, status)
         VALUES ($1,$2,'验收','育儿嫂','北京','分配测试地址','2026-07-08','待处理')
         RETURNING id`,
        [`${TEST_PREFIX} assign`, `130${String(Date.now()).slice(-8)}`]
      );
      ids.demands.push(temp.rows[0].id);
      const data = await expectStatus('assign', 'PUT', `/api/demands/${temp.rows[0].id}/assignment`, 200, {
        token: bossToken,
        body: { operatorId: ids.operatorUser }
      });
      assert(data.demand.assignedOperatorId === ids.operatorUser, 'assigned operator mismatch');
    });

    await step('operator cannot assign other people', async () => {
      await expectStatus('operator assign', 'PUT', `/api/demands/${ids.demands[0]}/assignment`, 403, {
        token: operatorToken,
        body: { operatorId: ids.operatorOtherUser }
      });
    });

    await step('disabled or missing operator cannot be assigned', async () => {
      await expectStatus('disabled assign', 'PUT', `/api/demands/${ids.demands[0]}/assignment`, 400, {
        token: bossToken,
        body: { operatorId: ids.operatorDisabledUser }
      });
      await expectStatus('missing assign', 'PUT', `/api/demands/${ids.demands[0]}/assignment`, 400, {
        token: bossToken,
        body: { operatorId: 99999999 }
      });
    });

    await step('operator sees own todos only', async () => {
      const data = await expectStatus('operator todos', 'GET', '/api/todos?category=today&pageSize=50', 200, { token: operatorToken });
      assert(data.items.every((item) => item.assignedOperatorId === ids.operatorUser), 'operator saw other operator todo');
    });

    await step('operator cannot follow another operator demand', async () => {
      await expectStatus('other demand follow-up', 'POST', `/api/demands/${ids.demands[3]}/follow-ups`, 403, {
        token: operatorToken,
        body: { method: 'phone', note: TEST_PREFIX }
      });
    });

    await step('operator_id cannot be forged', async () => {
      const data = await expectStatus('follow up forged operator', 'POST', `/api/demands/${ids.demands[0]}/follow-ups`, 201, {
        token: operatorToken,
        body: {
          method: 'wechat',
          result: '已沟通',
          note: TEST_PREFIX,
          operatorId: ids.operatorOtherUser,
          contactedAt: isoForOffset(0, 12),
          nextFollowUpAt: isoForOffset(1, 12)
        }
      });
      assert(data.followUp.operatorId === ids.operatorUser, 'operator_id was trusted from client');
    });

    await step('todo categories are correct', async () => {
      const data = await expectStatus('boss todos', 'GET', `/api/todos?keyword=${encodeURIComponent(TEST_PREFIX)}&pageSize=50`, 200, { token: bossToken });
      assert(data.stats.today >= 1, 'today count missing');
      assert(data.stats.overdue >= 1, 'overdue count missing');
      assert(data.stats.unassigned >= 1, 'unassigned count missing');
      assert(data.stats.completedToday >= 1, 'completed today count missing');
      assert(data.stats.future >= 1, 'future count missing');
    });

    await step('closed demand is excluded from normal todos', async () => {
      const data = await expectStatus('closed excluded', 'GET', `/api/todos?keyword=${encodeURIComponent(TEST_PREFIX)}&category=today&pageSize=50`, 200, { token: bossToken });
      assert(!data.items.some((item) => item.status === '已关闭'), 'closed demand appeared in todos');
    });

    await step('unauthenticated and miniprogram roles are rejected', async () => {
      await expectStatus('unauth todos', 'GET', '/api/todos', 401);
      await expectStatus('customer todos', 'GET', '/api/todos', 403, { token: customerToken });
      await expectStatus('ayi todos', 'GET', '/api/todos', 403, { token: ayiToken });
      const unknown = accessControl.canAccessResource({ role: 'unknown' }, 'todos', 'GET');
      assert(unknown.status === 403, 'unknown role was not rejected');
    });

    await step('audit logs are written for assignment and follow-up', async () => {
      const result = await db.query(
        `SELECT count(*)::integer AS count
         FROM audit_logs
         WHERE action IN ('assign_operator','follow_up','update_follow_up_time')
           AND after_summary::text LIKE $1`,
        [`%${TEST_PREFIX}%`]
      );
      assert(result.rows[0].count >= 2, 'audit log rows missing');
    });

    await step('invalid method date and long text are rejected', async () => {
      await expectStatus('invalid method', 'POST', `/api/demands/${ids.demands[0]}/follow-ups`, 400, {
        token: operatorToken,
        body: { method: 'email' }
      });
      await expectStatus('invalid date', 'POST', `/api/demands/${ids.demands[0]}/follow-ups`, 400, {
        token: operatorToken,
        body: { method: 'phone', contactedAt: 'not-a-date' }
      });
      await expectStatus('long note', 'POST', `/api/demands/${ids.demands[0]}/follow-ups`, 400, {
        token: operatorToken,
        body: { method: 'phone', note: 'x'.repeat(2001) }
      });
    });

    await step('repeated category pagination works', async () => {
      const data = await expectStatus('pagination', 'GET', `/api/todos?keyword=${encodeURIComponent(TEST_PREFIX)}&category=future&page=1&pageSize=20`, 200, { token: bossToken });
      assert(data.page === 1 && data.pageSize === 20 && data.totalPages >= 1, 'pagination metadata invalid');
    });
  } finally {
    await cleanup();
    await db.closePool();
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    results
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.fail) process.exit(1);
})().catch(async (error) => {
  add('fatal', 'FAIL', error.message);
  await cleanup();
  try {
    await db.closePool();
  } catch (closeError) {
    // Ignore close errors.
  }
  console.log(JSON.stringify({
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    results
  }, null, 2));
  process.exit(1);
});
