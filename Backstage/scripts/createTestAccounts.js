const bcrypt = require('bcryptjs');
const db = require('../db');

const DEFAULTS = {
  boss: { username: 'boss.local', phone: '18800000001', profileTable: 'backstage_accounts', roleName: '管理端' },
  operator: { username: 'operator.local', phone: '18800000002', profileTable: 'backstage_accounts', roleName: '运营端' },
  customer: { username: 'customer.local', phone: '13800000001', profileTable: 'customers' },
  ayi: { username: 'ayi.local', phone: '13900000001', profileTable: 'ayis' }
};

const OPERATOR_PERMISSIONS = [
  '阿姨管理',
  '客户需求',
  '预约面试',
  '接单申请',
  '订单跟进',
  '人工派单',
  '门店信息',
  '服务中心',
  '首页轮播'
];

function requiredPassword(role) {
  const key = `${role.toUpperCase()}_TEST_PASSWORD`;
  const password = process.env[key] || process.env.AUTH_TEST_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(`${key} or AUTH_TEST_PASSWORD must be set to at least 8 characters`);
  }
  return password;
}

async function findBackstageProfile(client, roleName, fallbackPhone) {
  const result = await client.query(
    `SELECT id, phone FROM backstage_accounts WHERE role = $1 ORDER BY id LIMIT 1`,
    [roleName]
  );
  if (result.rows[0]) return result.rows[0];

  const permissions = roleName === '运营端' ? OPERATOR_PERMISSIONS : ['管理端全部权限'];
  const inserted = await client.query(
    `INSERT INTO backstage_accounts (name, phone, role, entry, permissions, status, note)
     VALUES ($1,$2,$3,'后台管理',$4,'启用','Local auth test profile')
     RETURNING id, phone`,
    [`${roleName}测试账号`, fallbackPhone, roleName, permissions]
  );
  return inserted.rows[0];
}

async function findCustomerProfile(client, phone) {
  const result = await client.query('SELECT id, phone FROM customers WHERE phone = $1 LIMIT 1', [phone]);
  if (result.rows[0]) return result.rows[0];
  const inserted = await client.query(
    `INSERT INTO customers (name, phone, source, status, notes)
     VALUES ('本地测试客户', $1, 'local_auth_test', 'active', 'Local auth test profile')
     RETURNING id, phone`,
    [phone]
  );
  return inserted.rows[0];
}

async function findAyiProfile(client, phone) {
  const result = await client.query('SELECT id, phone FROM ayis WHERE phone = $1 LIMIT 1', [phone]);
  if (result.rows[0]) return result.rows[0];
  const inserted = await client.query(
    `INSERT INTO ayis (name, phone, source, status, visible, intro)
     VALUES ('本地测试阿姨', $1, '后台录入', '已认证', true, 'Local auth test profile')
     RETURNING id, phone`,
    [phone]
  );
  return inserted.rows[0];
}

async function upsertUser(client, role, profile, password) {
  const config = DEFAULTS[role];
  const passwordHash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO user_accounts (
      username, phone, password_hash, role, related_profile_type, related_profile_id, status
    ) VALUES ($1,$2,$3,$4,$5,$6,'active')
    ON CONFLICT (username) DO UPDATE
      SET phone = EXCLUDED.phone,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          related_profile_type = EXCLUDED.related_profile_type,
          related_profile_id = EXCLUDED.related_profile_id,
          status = 'active',
          failed_login_count = 0,
          locked_until = NULL`,
    [
      config.username,
      profile.phone || config.phone,
      passwordHash,
      role,
      config.profileTable,
      String(profile.id)
    ]
  );
}

async function main() {
  const roles = ['boss', 'operator', 'customer', 'ayi'];
  await db.transaction(async (client) => {
    for (const role of roles) {
      const config = DEFAULTS[role];
      const password = requiredPassword(role);
      let profile;
      if (role === 'boss' || role === 'operator') {
        profile = await findBackstageProfile(client, config.roleName, config.phone);
      } else if (role === 'customer') {
        profile = await findCustomerProfile(client, config.phone);
      } else {
        profile = await findAyiProfile(client, config.phone);
      }
      await upsertUser(client, role, profile, password);
    }
  });

  console.log(JSON.stringify({
    createdOrUpdated: roles.map((role) => ({ role, username: DEFAULTS[role].username, phone: DEFAULTS[role].phone }))
  }, null, 2));
  await db.closePool();
}

main().catch(async (error) => {
  console.error(error.message);
  await db.closePool();
  process.exit(1);
});
