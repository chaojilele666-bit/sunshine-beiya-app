const crypto = require('crypto');
const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('../db');
const accessControl = require('../accessControl');

const API_BASE = process.env.V3_ACCEPTANCE_API_BASE || 'http://localhost:5177';
const TEST_PREFIX = `V3_AVAIL_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const credentials = {};
const results = [];
const ids = {
  users: [],
  backstageProfiles: [],
  ayis: [],
  demands: [],
  serviceModules: []
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
  assert(response.status === expected, `${name}: expected ${expected}, got ${response.status}, body=${response.raw}`);
  return response.data;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function login(role) {
  const username = `v3_avail_${role}_${TEST_PREFIX.toLowerCase()}`;
  const response = await expectStatus(`login ${role}`, 'POST', '/api/auth/login', 200, {
    body: { username, password: credentials[role] }
  });
  assert(response.token, `missing token for ${role}`);
  return response.token;
}

async function seed() {
  const roles = ['boss', 'operator', 'operatorNoPerm', 'customer', 'ayi'];
  const hashes = {};
  for (const role of roles) {
    credentials[role] = crypto.randomBytes(18).toString('base64url');
    hashes[role] = await bcrypt.hash(credentials[role], 10);
  }

  await db.transaction(async (client) => {
    const serviceResult = await client.query(
      `INSERT INTO service_modules (title, summary, module_type, sort, visible)
       VALUES ($1,'V3 availability test service','service',991,true),
              ($2,'V3 availability other service','service',992,true)
       RETURNING id, title`,
      [`${TEST_PREFIX} 育儿嫂`, `${TEST_PREFIX} 保洁`]
    );
    ids.serviceModules = serviceResult.rows.map((row) => row.id);

    const profiles = await client.query(
      `INSERT INTO backstage_accounts (name, phone, role, entry, permissions, status, note)
       VALUES
         ($1,$2,'管理端','后台管理',ARRAY['管理端全部权限'],'启用',$7),
         ($3,$4,'运营端','后台管理',ARRAY['阿姨管理'],'启用',$7),
         ($5,$6,'运营端','后台管理',ARRAY['客户需求'],'启用',$7)
       RETURNING id, phone`,
      [
        `${TEST_PREFIX} boss`, `176${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} operator`, `177${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} noperm`, `178${String(Date.now()).slice(-8)}`,
        TEST_PREFIX
      ]
    );
    ids.backstageProfiles = profiles.rows.map((row) => row.id);

    const customer = await client.query(
      `INSERT INTO customers (name, phone, status)
       VALUES ($1,$2,'active')
       RETURNING id`,
      [`${TEST_PREFIX} customer`, `179${String(Date.now()).slice(-8)}`]
    );

    const ayis = await client.query(
      `INSERT INTO ayis (name, phone, source, service_type, status, visible, intro, live_type)
       VALUES
         ($1,$2,'后台录入',$9,'已认证',true,$10,'住家'),
         ($3,$4,'后台录入',$9,'待审核',true,$10,'住家'),
         ($5,$6,'后台录入',$9,'已认证',false,$10,'住家'),
         ($7,$8,'后台录入',$11,'已认证',true,$10,'住家')
       RETURNING id`,
      [
        `${TEST_PREFIX} available`, `180${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} pending`, `181${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} hidden`, `182${String(Date.now()).slice(-8)}`,
        `${TEST_PREFIX} mismatch`, `183${String(Date.now()).slice(-8)}`,
        serviceResult.rows[0].title,
        TEST_PREFIX,
        serviceResult.rows[1].title
      ]
    );
    ids.ayis = ayis.rows.map((row) => row.id);

    for (const ayiId of ids.ayis) {
      await client.query(
        `INSERT INTO ayi_availability (ayi_id, service_status, available_from, available_to, long_term_available, status_confirmed_at)
         VALUES ($1,'available',CURRENT_DATE,NULL,true,now())
         ON CONFLICT (ayi_id) DO NOTHING`,
        [ayiId]
      );
      await client.query(
        `INSERT INTO ayi_service_preferences (ayi_id, accept_live_in, accept_day_shift, accept_night_shift, accept_long_term, accept_temporary, earliest_start_date)
         VALUES ($1,true,true,false,true,true,CURRENT_DATE)
         ON CONFLICT (ayi_id) DO NOTHING`,
        [ayiId]
      );
    }

    await client.query(
      `INSERT INTO ayi_service_types (ayi_id, service_module_id)
       VALUES ($1,$2),($3,$2),($4,$2),($5,$6)
       ON CONFLICT DO NOTHING`,
      [ids.ayis[0], ids.serviceModules[0], ids.ayis[1], ids.ayis[2], ids.ayis[3], ids.serviceModules[1]]
    );

    const demand = await client.query(
      `INSERT INTO demands (customer_name, phone, source, service_type, city, address, start_time, budget, family_info, status)
       VALUES ($1,$2,'后台录入',$3,'北京','测试地址',$4,'8000','需要住家照护','待处理')
       RETURNING id`,
      [`${TEST_PREFIX} demand`, `184${String(Date.now()).slice(-8)}`, serviceResult.rows[0].title, dateOffset(1)]
    );
    ids.demands = demand.rows.map((row) => row.id);

    const users = await client.query(
      `INSERT INTO user_accounts (username, phone, password_hash, role, related_profile_type, related_profile_id, status)
       VALUES
         ($1,$2,$3,'boss','backstage_accounts',$4,'active'),
         ($5,$6,$7,'operator','backstage_accounts',$8,'active'),
         ($9,$10,$11,'operator','backstage_accounts',$12,'active'),
         ($13,$14,$15,'customer','customers',$16,'active'),
         ($17,$18,$19,'ayi','ayis',$20,'active')
       RETURNING id, username, role`,
      [
        `v3_avail_boss_${TEST_PREFIX.toLowerCase()}`, profiles.rows[0].phone, hashes.boss, String(profiles.rows[0].id),
        `v3_avail_operator_${TEST_PREFIX.toLowerCase()}`, profiles.rows[1].phone, hashes.operator, String(profiles.rows[1].id),
        `v3_avail_operatorNoPerm_${TEST_PREFIX.toLowerCase()}`, profiles.rows[2].phone, hashes.operatorNoPerm, String(profiles.rows[2].id),
        `v3_avail_customer_${TEST_PREFIX.toLowerCase()}`, `185${String(Date.now()).slice(-8)}`, hashes.customer, String(customer.rows[0].id),
        `v3_avail_ayi_${TEST_PREFIX.toLowerCase()}`, `186${String(Date.now()).slice(-8)}`, hashes.ayi, String(ids.ayis[0])
      ]
    );
    ids.users = users.rows.map((row) => row.id);
  });
}

async function cleanup() {
  try {
    if (ids.demands.length) {
      await db.query('DELETE FROM demand_matches WHERE demand_id = ANY($1::int[])', [ids.demands]);
      await db.query('DELETE FROM demands WHERE id = ANY($1::int[]) OR customer_name LIKE $2', [ids.demands, `${TEST_PREFIX}%`]);
    }
    if (ids.ayis.length) {
      await db.query('DELETE FROM ayi_status_history WHERE ayi_id = ANY($1::int[])', [ids.ayis]);
      await db.query('DELETE FROM ayi_service_types WHERE ayi_id = ANY($1::int[])', [ids.ayis]);
      await db.query('DELETE FROM ayi_service_regions WHERE ayi_id = ANY($1::int[])', [ids.ayis]);
      await db.query('DELETE FROM ayi_service_preferences WHERE ayi_id = ANY($1::int[])', [ids.ayis]);
      await db.query('DELETE FROM ayi_availability WHERE ayi_id = ANY($1::int[])', [ids.ayis]);
      await db.query('DELETE FROM ayis WHERE id = ANY($1::int[]) OR intro = $2', [ids.ayis, TEST_PREFIX]);
    }
    if (ids.serviceModules.length) await db.query('DELETE FROM service_modules WHERE id = ANY($1::int[])', [ids.serviceModules]);
    if (ids.users.length) await db.query('DELETE FROM auth_sessions WHERE user_account_id = ANY($1::int[])', [ids.users]);
    if (ids.users.length) await db.query('DELETE FROM user_accounts WHERE id = ANY($1::int[]) OR username LIKE $2', [ids.users, `v3_avail_%${TEST_PREFIX.toLowerCase()}%`]);
    if (ids.backstageProfiles.length) await db.query('DELETE FROM backstage_accounts WHERE id = ANY($1::int[]) OR note = $2', [ids.backstageProfiles, TEST_PREFIX]);
    await db.query('DELETE FROM customers WHERE name LIKE $1', [`${TEST_PREFIX}%`]);
    await db.query('DELETE FROM audit_logs WHERE after_summary::text LIKE $1 OR before_summary::text LIKE $1', [`%${TEST_PREFIX}%`]);
    add('cleanup temporary ayi availability data', 'PASS', 'temporary rows removed');
  } catch (error) {
    add('cleanup temporary ayi availability data', 'FAIL', error.message);
  }
}

(async () => {
  let bossToken;
  let operatorToken;
  let operatorNoPermToken;
  let customerToken;
  let ayiToken;

  try {
    await seed();
    bossToken = await login('boss');
    operatorToken = await login('operator');
    operatorNoPermToken = await login('operatorNoPerm');
    customerToken = await login('customer');
    ayiToken = await login('ayi');

    await step('boss can update ayi service status', async () => {
      const data = await expectStatus('boss update availability', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 200, {
        token: bossToken,
        body: {
          serviceStatus: 'working',
          availableFrom: dateOffset(1),
          availableTo: dateOffset(10),
          longTermAvailable: false,
          serviceWeekdays: [1, 2, 3, 4, 5],
          serviceTimeSlots: ['day'],
          scheduleNote: TEST_PREFIX
        }
      });
      assert(data.profile.availability.serviceStatus === 'working', 'service status not updated');
      return 'working saved';
    });

    await step('authorized operator can update allowed availability fields', async () => {
      const data = await expectStatus('operator update availability', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 200, {
        token: operatorToken,
        body: {
          serviceStatus: 'available',
          availableFrom: dateOffset(0),
          availableTo: dateOffset(30),
          longTermAvailable: true,
          serviceWeekdays: [1, 2, 3, 4, 5, 6, 7],
          serviceTimeSlots: ['day', 'live_in'],
          scheduleNote: TEST_PREFIX
        }
      });
      assert(data.profile.recommendation.recommendable === true, 'available ayi should be recommendable');
      return 'operator update accepted';
    });

    await step('operator without ayi permission is rejected', async () => {
      await expectStatus('operator no permission', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 403, {
        token: operatorNoPermToken,
        body: { serviceStatus: 'available' }
      });
    });

    await step('customer ayi and unauthenticated are rejected', async () => {
      await expectStatus('customer rejected', 'GET', `/api/ayis/${ids.ayis[0]}/availability`, 403, { token: customerToken });
      await expectStatus('ayi rejected', 'GET', `/api/ayis/${ids.ayis[0]}/availability`, 403, { token: ayiToken });
      await expectStatus('unauth rejected', 'GET', `/api/ayis/${ids.ayis[0]}/availability`, 401);
    });

    await step('unknown role is rejected by access control', async () => {
      const authz = accessControl.canAccessResource({ id: 9999, role: 'unknown' }, 'ayis', 'GET');
      assert(authz.status === 403, `expected 403, got ${authz.status}`);
    });

    await step('invalid service status is rejected', async () => {
      await expectStatus('invalid status', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 400, {
        token: bossToken,
        body: { serviceStatus: 'bad_status' }
      });
    });

    await step('invalid date range is rejected', async () => {
      await expectStatus('invalid date range', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 400, {
        token: bossToken,
        body: { serviceStatus: 'available', availableFrom: dateOffset(10), availableTo: dateOffset(1), serviceWeekdays: [1], serviceTimeSlots: ['day'] }
      });
    });

    await step('invalid salary range is rejected', async () => {
      await expectStatus('invalid salary range', 'PUT', `/api/ayis/${ids.ayis[0]}/preferences`, 400, {
        token: bossToken,
        body: { minSalary: 9000, maxSalary: 5000 }
      });
    });

    await step('hidden and pending ayis are not recommendable', async () => {
      const hidden = await expectStatus('hidden recommendation', 'GET', `/api/ayis/${ids.ayis[2]}/recommendation-check?serviceType=${encodeURIComponent(TEST_PREFIX)}`, 200, { token: bossToken });
      const pending = await expectStatus('pending recommendation', 'GET', `/api/ayis/${ids.ayis[1]}/recommendation-check`, 200, { token: bossToken });
      assert(hidden.recommendation.reasons.includes('暂时下架'), 'hidden reason missing');
      assert(pending.recommendation.reasons.includes('待审核或认证未通过'), 'pending reason missing');
    });

    await step('working leave resting ayis are not recommendable', async () => {
      for (const status of ['working', 'leave', 'resting']) {
        await expectStatus(`set ${status}`, 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 200, {
          token: bossToken,
          body: { serviceStatus: status, availableFrom: dateOffset(0), availableTo: dateOffset(30), serviceWeekdays: [1], serviceTimeSlots: ['day'] }
        });
        const check = await expectStatus(`check ${status}`, 'GET', `/api/ayis/${ids.ayis[0]}/recommendation-check`, 200, { token: bossToken });
        assert(check.recommendation.recommendable === false, `${status} should not be recommendable`);
      }
    });

    await step('available valid schedule enters candidates', async () => {
      await expectStatus('set available', 'PUT', `/api/ayis/${ids.ayis[0]}/availability`, 200, {
        token: bossToken,
        body: { serviceStatus: 'available', availableFrom: dateOffset(0), availableTo: dateOffset(30), serviceWeekdays: [1, 2], serviceTimeSlots: ['day', 'live_in'] }
      });
      const list = await expectStatus('candidates', 'GET', `/api/ayis/candidates?serviceType=${encodeURIComponent(`${TEST_PREFIX} 育儿嫂`)}`, 200, { token: bossToken });
      assert(list.items.some((item) => Number(item.id) === Number(ids.ayis[0])), 'available ayi missing from candidates');
    });

    await step('expired schedule is not recommendable', async () => {
      await db.query('UPDATE ayi_availability SET available_from = CURRENT_DATE - interval \'10 days\', available_to = CURRENT_DATE - interval \'1 day\' WHERE ayi_id = $1', [ids.ayis[0]]);
      const check = await expectStatus('expired check', 'GET', `/api/ayis/${ids.ayis[0]}/recommendation-check`, 200, { token: bossToken });
      assert(check.recommendation.reasons.includes('档期已过期'), 'expired reason missing');
    });

    await step('live-in and service mismatch return clear reasons', async () => {
      await db.query('UPDATE ayi_availability SET service_status = $2, available_to = CURRENT_DATE + interval \'30 days\' WHERE ayi_id = $1', [ids.ayis[0], 'available']);
      await expectStatus('no live in', 'PUT', `/api/ayis/${ids.ayis[0]}/preferences`, 200, {
        token: bossToken,
        body: { acceptLiveIn: false, serviceTypeIds: [ids.serviceModules[0]], regions: [] }
      });
      const liveInCheck = await expectStatus('live in check', 'GET', `/api/ayis/${ids.ayis[0]}/recommendation-check?familyInfo=${encodeURIComponent('需要住家')}`, 200, { token: bossToken });
      assert(liveInCheck.recommendation.reasons.includes('不接受住家'), 'live-in reason missing');
      const mismatch = await expectStatus('service mismatch', 'GET', `/api/ayis/${ids.ayis[0]}/recommendation-check?serviceType=${encodeURIComponent(`${TEST_PREFIX} 保洁`)}`, 200, { token: bossToken });
      assert(mismatch.recommendation.reasons.includes('服务类型不匹配'), 'service mismatch reason missing');
    });

    await step('recommend endpoint rejects unavailable ayi with reason', async () => {
      await expectStatus('recommend mismatch rejected', 'POST', `/api/demands/${ids.demands[0]}/matches`, 400, {
        token: bossToken,
        body: { ayiId: ids.ayis[0], recommendNote: TEST_PREFIX }
      });
    });

    await step('audit logs and actor are written', async () => {
      const result = await db.query(
        `SELECT count(*)::integer AS count
         FROM audit_logs
         WHERE entity_type = 'ayiAvailability'
           AND after_summary::text LIKE $1`,
        [`%${TEST_PREFIX}%`]
      );
      assert(result.rows[0].count > 0, 'missing audit logs');
    });

    await step('frontend list exposes availability fields', async () => {
      const list = await expectStatus('list ayis', 'GET', '/api/ayis', 200, { token: bossToken });
      const row = list.find((item) => Number(item.id) === Number(ids.ayis[0]));
      assert(row && Object.prototype.hasOwnProperty.call(row, 'serviceStatus'), 'serviceStatus missing');
      assert(Object.prototype.hasOwnProperty.call(row, 'recommendable'), 'recommendable missing');
    });

    await step('original demand match flow still works for valid ayi', async () => {
      await expectStatus('valid preferences', 'PUT', `/api/ayis/${ids.ayis[0]}/preferences`, 200, {
        token: bossToken,
        body: { acceptLiveIn: true, serviceTypeIds: [ids.serviceModules[0]], regions: [] }
      });
      const match = await expectStatus('valid recommend', 'POST', `/api/demands/${ids.demands[0]}/matches`, 201, {
        token: bossToken,
        body: { ayiId: ids.ayis[0], recommendNote: TEST_PREFIX }
      });
      assert(match.match && Number(match.match.ayiId) === Number(ids.ayis[0]), 'valid recommendation failed');
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
  if (summary.fail > 0) process.exitCode = 1;
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
  process.exitCode = 1;
});
