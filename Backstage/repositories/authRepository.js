const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const accessControl = require('../accessControl');

const SESSION_TTL_HOURS = Number(process.env.AUTH_SESSION_TTL_HOURS || 8);
const MAX_FAILED_LOGINS = Number(process.env.AUTH_MAX_FAILED_LOGINS || 5);
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 30);
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const TEMP_PASSWORD_LENGTH = 12;
const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  '11111111',
  '00000000',
  'qwerty123',
  'abc123456'
]);

class AuthError extends Error {
  constructor(code, message, status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function normalizePhone(value) {
  return String(value || '').trim();
}

function isPhoneIdentifier(value) {
  return PHONE_PATTERN.test(normalizePhone(value));
}

function assertPhone(value) {
  const phone = normalizePhone(value);
  if (!PHONE_PATTERN.test(phone)) {
    throw new AuthError('INVALID_PHONE', 'Invalid phone number', 400);
  }
  return phone;
}

function maskPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return '';
  if (phone.length < 7) return phone.replace(/.(?=.{2})/g, '*');
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function normalizeRole(value) {
  const role = String(value || '').trim();
  if (role === 'management') return 'boss';
  if (['boss', 'operator', 'store_manager', 'store_staff'].includes(role)) return role;
  throw new AuthError('INVALID_ROLE', 'Invalid backstage role', 400);
}

function normalizeAccountStatus(value) {
  const status = String(value || 'active').trim();
  if (['active', 'disabled', 'locked'].includes(status)) return status;
  throw new AuthError('INVALID_STATUS', 'Invalid account status', 400);
}
function normalizedAccountStatus(row) {
  const status = row.account_status || row.status || '';
  if (['disabled', 'locked'].includes(status)) return status;
  return 'active';
}
function normalizePermissions(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeStoreIds(value) {
  if (Array.isArray(value)) return value.map(Number).filter((id) => Number.isFinite(id));
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map((item) => Number(item.trim())).filter((id) => Number.isFinite(id));
}

function randomChar(chars) {
  return chars[crypto.randomInt(0, chars.length)];
}

function shuffle(text) {
  const chars = text.split('');
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join('');
}

function generateTemporaryPassword(phone = '') {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  const suffix = normalizePhone(phone).slice(-6);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let password = randomChar(upper) + randomChar(lower) + randomChar(digits) + randomChar(special);
    while (password.length < TEMP_PASSWORD_LENGTH) {
      password += randomChar(all);
    }
    password = shuffle(password);
    if (!suffix || !password.includes(suffix)) return password;
  }
  throw new AuthError('PASSWORD_GENERATION_FAILED', 'Could not generate a secure temporary password', 500);
}

async function validateNewPassword({ account, currentPassword, newPassword, confirmPassword }) {
  const next = String(newPassword || '');
  if (!next || next.length < 8) {
    throw new AuthError('INVALID_PASSWORD', 'New password must be at least 8 characters', 400);
  }
  if (confirmPassword !== undefined && next !== String(confirmPassword || '')) {
    throw new AuthError('PASSWORD_CONFIRM_MISMATCH', 'Password confirmation does not match', 400);
  }
  if (normalizePhone(account.phone) && next === normalizePhone(account.phone)) {
    throw new AuthError('WEAK_PASSWORD', 'New password cannot be the same as phone number', 400);
  }
  if (WEAK_PASSWORDS.has(next.toLowerCase())) {
    throw new AuthError('WEAK_PASSWORD', 'New password is too weak', 400);
  }
  if (/^(.)\1+$/.test(next) || /^(?:12345678|87654321|abcdefgh|qwertyui)/i.test(next)) {
    throw new AuthError('WEAK_PASSWORD', 'New password is too weak', 400);
  }
  if (currentPassword && next === String(currentPassword)) {
    throw new AuthError('PASSWORD_REUSED', 'New password cannot be the same as current password', 400);
  }
  if (account.password_hash && await bcrypt.compare(next, account.password_hash)) {
    throw new AuthError('PASSWORD_REUSED', 'New password cannot be the same as current password', 400);
  }
}

function safeUser(row) {
  if (!row) return null;
  const permissions = Array.isArray(row.backstage_permissions)
    ? row.backstage_permissions
    : [];
  const accountStatus = normalizedAccountStatus(row);
  return {
    id: row.id,
    accountId: row.id,
    username: row.username,
    phone: row.phone,
    phoneMasked: maskPhone(row.phone),
    name: row.backstage_name || row.username || row.phone,
    role: row.role,
    relatedProfileType: row.related_profile_type,
    relatedProfileId: row.related_profile_id,
    backstageProfileId: row.backstage_profile_id || null,
    backstageRole: row.backstage_role || null,
    hasBackstageProfile: Boolean(row.backstage_profile_id),
    permissions,
    status: row.status,
    accountStatus,
    store: row.store_id ? {
      id: row.store_id,
      name: row.store_name || ''
    } : null,
    storeId: row.store_id || null,
    storeScopeIds: Array.isArray(row.store_scope_ids) ? row.store_scope_ids.map(Number) : [],
    organizationType: row.organization_type || 'backstage',
    mustChangePassword: Boolean(row.must_change_password),
    sessionVersion: Number(row.session_version || 1),
    phoneVerifiedAt: row.phone_verified_at,
    registeredAt: row.registered_at || row.created_at,
    lastLoginAt: row.last_login_at,
    lastLoginIp: row.last_login_ip,
    passwordChangedAt: row.password_changed_at,
    lastLoginMethod: row.last_login_method,
    loginSource: row.login_source,
    loginCount: row.login_count,
    wechatBound: Boolean(row.wechat_openid || row.wechat_unionid),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function writeAuthAudit(client, user, action, extra = {}) {
  await client.query(
    `INSERT INTO audit_logs (
      actor, actor_role, action, entity_type, resource_type, resource_id_text, after_data, after_summary
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [
      user ? (user.username || user.phone || `user:${user.id}`) : 'anonymous',
      user ? user.role : null,
      action,
      'auth',
      'auth',
      user ? String(user.id) : null,
      JSON.stringify(extra),
      JSON.stringify(Object.assign({ action }, extra)).slice(0, 500)
    ]
  );
}

async function findByIdentifier(identifier, client = db) {
  const value = String(identifier || '').trim();
  if (!value) return null;
  const result = await client.query(
    `SELECT * FROM user_accounts WHERE username = $1 OR phone = $1 LIMIT 1`,
    [value]
  );
  return result.rows[0] || null;
}

async function findBackstageByIdentifier(identifier, client = db) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  if (isPhoneIdentifier(value)) {
    const result = await client.query(
      `SELECT u.*
       FROM user_accounts u
       LEFT JOIN backstage_accounts ba
         ON u.related_profile_type = 'backstage_accounts'
        AND u.related_profile_id = ba.id::text
       WHERE (u.phone = $1 OR ba.phone = $1)
         AND u.role IN ('operator', 'boss', 'management', 'store_manager', 'store_staff')
       ORDER BY CASE WHEN u.phone = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [value]
    );
    return result.rows[0] || null;
  }

  const result = await client.query(
    `SELECT *
     FROM user_accounts
     WHERE username = $1
       AND role IN ('operator', 'boss', 'management', 'store_manager', 'store_staff')
     LIMIT 1`,
    [value]
  );
  return result.rows[0] || null;
}

async function findById(id, client = db) {
  const result = await client.query(
    `SELECT u.*,
            ba.id AS backstage_profile_id,
            ba.name AS backstage_name,
            ba.role AS backstage_role,
            ba.permissions AS backstage_permissions,
            ba.store_id,
            ba.organization_type,
            ba.account_status,
            ba.locked_until AS backstage_locked_until,
            COALESCE(ba.must_change_password, u.must_change_password) AS must_change_password,
            COALESCE(ba.password_changed_at, u.password_changed_at) AS password_changed_at,
            COALESCE(ba.last_login_ip, u.last_login_ip) AS last_login_ip,
            COALESCE(ba.session_version, u.session_version) AS backstage_session_version,
            COALESCE(scopes.store_scope_ids, ARRAY[]::integer[]) AS store_scope_ids,
            s.name AS store_name
     FROM user_accounts u
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     LEFT JOIN stores s ON s.id = ba.store_id
     LEFT JOIN (
       SELECT account_id, array_agg(store_id ORDER BY store_id) AS store_scope_ids
       FROM account_store_scopes
       GROUP BY account_id
     ) scopes ON scopes.account_id = u.id
     WHERE u.id = $1`,
    [Number(id)]
  );
  const row = result.rows[0] || null;
  if (row && row.backstage_session_version) {
    row.session_version = row.backstage_session_version;
  }
  return row;
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
}

async function hasLoginTrackingFields(client) {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'user_accounts'
       AND column_name IN ('last_login_method', 'login_source', 'login_count')`
  );
  const columns = new Set(result.rows.map((row) => row.column_name));
  return columns.has('last_login_method') && columns.has('login_source') && columns.has('login_count');
}

async function issueSession(client, accountId, { method, source, ipAddress, userAgent }) {
  const token = newToken();
  const expiresAt = sessionExpiry();
  const account = await findById(accountId, client);
  if (!account) throw new AuthError('ACCOUNT_NOT_FOUND', 'Account does not exist', 404);
  const sessionVersion = Number(account.session_version || 1);
  const isBackstageAccount = Boolean(account.related_profile_type === 'backstage_accounts' && account.related_profile_id);
  if (await hasLoginTrackingFields(client)) {
    await client.query(
      `UPDATE user_accounts
       SET failed_login_count = 0,
           locked_until = NULL,
           status = CASE WHEN $5 THEN 'active' ELSE status END,
           last_login_at = now(),
           last_login_ip = $4,
           last_login_method = COALESCE($2, last_login_method),
           login_source = COALESCE($3, login_source),
           login_count = COALESCE(login_count, 0) + 1
       WHERE id = $1`,
      [accountId, method || null, source || null, ipAddress || null, isBackstageAccount]
    );
  } else {
    await client.query(
      `UPDATE user_accounts
       SET failed_login_count = 0,
           locked_until = NULL,
           status = CASE WHEN $3 THEN 'active' ELSE status END,
           last_login_at = now(),
           last_login_ip = $2
       WHERE id = $1`,
      [accountId, ipAddress || null, isBackstageAccount]
    );
  }
  if (isBackstageAccount) {
    await client.query(
      `UPDATE backstage_accounts
       SET failed_login_count = 0,
           locked_until = NULL,
           account_status = 'active',
           last_login_at = now(),
           last_login_ip = $2
       WHERE id = $1`,
      [Number(account.related_profile_id), ipAddress || null]
    );
  }
  await client.query(
    `INSERT INTO auth_sessions (user_account_id, token_hash, user_agent, ip_address, expires_at, session_version)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [accountId, tokenHash(token), userAgent || null, ipAddress || null, expiresAt, sessionVersion]
  );
  const updated = await findById(accountId, client);
  await writeAuthAudit(client, updated, 'login', { method: method || 'password' });
  return {
    token,
    expiresAt,
    session: { token, expiresAt, sessionVersion },
    account_id: updated.id,
    name: updated.backstage_name || updated.username || updated.phone,
    phone_masked: maskPhone(updated.phone),
    role: updated.role,
    store: updated.store_id ? { id: updated.store_id, name: updated.store_name || '' } : null,
    organization_type: updated.organization_type || 'backstage',
    permissions: Array.isArray(updated.backstage_permissions) ? updated.backstage_permissions : [],
    must_change_password: Boolean(updated.must_change_password),
    account_status: normalizedAccountStatus(updated),
    user: safeUser(updated)
  };
}

async function login({ identifier, password, ipAddress, userAgent }) {
  if (!identifier || !password) {
    throw new AuthError('INVALID_CREDENTIALS', 'Phone or password is incorrect', 400);
  }

  const account = await findBackstageByIdentifier(identifier, db);
  if (!account) {
    throw new AuthError('ACCOUNT_NOT_FOUND', 'Phone or password is incorrect', 401);
  }

  if (!accessControl.isBackstageRole(account)) {
    throw new AuthError('INVALID_CREDENTIALS', 'Phone or password is incorrect', 401);
  }

  const backstageAccount = await findById(account.id, db);
  const accountStatus = normalizedAccountStatus(backstageAccount || account);
  if (account.status === 'disabled' || accountStatus === 'disabled') {
    throw new AuthError('ACCOUNT_DISABLED', 'Account is disabled. Contact an administrator.', 403);
  }

  const activeLockedUntil = backstageAccount && backstageAccount.backstage_locked_until
    ? backstageAccount.backstage_locked_until
    : account.locked_until;
  if (activeLockedUntil && new Date(activeLockedUntil).getTime() > Date.now()) {
    throw new AuthError('ACCOUNT_LOCKED', 'Account is temporarily locked. Try again later.', 429);
  }
  if ((account.status === 'locked' || accountStatus === 'locked') && !activeLockedUntil) {
    throw new AuthError('ACCOUNT_LOCKED', 'Account is temporarily locked. Try again later.', 423);
  }

  const ok = await bcrypt.compare(String(password), account.password_hash);
  if (!ok) {
    const failedCount = Number(account.failed_login_count || 0) + 1;
    const nextLockedUntil = failedCount >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      : null;
    const nextStatus = nextLockedUntil ? 'locked' : account.status;
    await db.query(
      `UPDATE user_accounts
       SET failed_login_count = $1, locked_until = $2, status = $3
       WHERE id = $4`,
      [failedCount, nextLockedUntil, nextStatus, account.id]
    );
    if (account.related_profile_type === 'backstage_accounts' && account.related_profile_id) {
      await db.query(
        `UPDATE backstage_accounts
         SET failed_login_count = $1,
             locked_until = $2,
             account_status = CASE WHEN $2::timestamptz IS NULL THEN account_status ELSE 'locked' END
         WHERE id = $3`,
        [failedCount, nextLockedUntil, Number(account.related_profile_id)]
      );
    }
    throw new AuthError('INVALID_CREDENTIALS', 'Phone or password is incorrect', 401);
  }

  return db.transaction((client) => issueSession(client, account.id, {
    method: 'password',
    source: 'backstage',
    ipAddress,
    userAgent
  }));
}

async function getUserByToken(token) {
  if (!token) return null;
  const result = await db.query(
    `SELECT u.*, s.expires_at AS session_expires_at, s.id AS session_id,
            ba.id AS backstage_profile_id,
            ba.name AS backstage_name,
            ba.role AS backstage_role,
            ba.permissions AS backstage_permissions,
            ba.store_id,
            ba.organization_type,
            ba.account_status,
            ba.locked_until AS backstage_locked_until,
            COALESCE(ba.must_change_password, u.must_change_password) AS must_change_password,
            COALESCE(ba.password_changed_at, u.password_changed_at) AS password_changed_at,
            COALESCE(ba.last_login_ip, u.last_login_ip) AS last_login_ip,
            COALESCE(ba.session_version, u.session_version) AS session_version,
            COALESCE(scopes.store_scope_ids, ARRAY[]::integer[]) AS store_scope_ids,
            st.name AS store_name
     FROM auth_sessions s
     JOIN user_accounts u ON u.id = s.user_account_id
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     LEFT JOIN stores st ON st.id = ba.store_id
     LEFT JOIN (
       SELECT account_id, array_agg(store_id ORDER BY store_id) AS store_scope_ids
       FROM account_store_scopes
       GROUP BY account_id
     ) scopes ON scopes.account_id = u.id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.status = 'active'
       AND s.session_version = u.session_version
       AND (ba.id IS NULL OR s.session_version = ba.session_version)
     LIMIT 1`,
    [tokenHash(token)]
  );
  const row = result.rows[0];
  if (!row) return null;
  const user = safeUser(row);
  user.sessionExpiresAt = row.session_expires_at;
  user.sessionId = row.session_id;
  return user;
}

async function logout(token, user) {
  if (!token) return;
  await db.transaction(async (client) => {
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash(token)]
    );
    await writeAuthAudit(client, user || null, 'logout', {});
  });
}

function staffAccountResponse(row, temporaryPassword) {
  return {
    account_id: row.id,
    backstage_profile_id: row.backstage_profile_id || null,
    name: row.backstage_name || row.username || row.phone,
    phone_masked: maskPhone(row.phone),
    role: row.role,
    store: row.store_id ? { id: row.store_id, name: row.store_name || '' } : null,
    store_scope_ids: Array.isArray(row.store_scope_ids) ? row.store_scope_ids.map(Number) : [],
    organization_type: row.organization_type || 'backstage',
    permissions: Array.isArray(row.backstage_permissions) ? row.backstage_permissions : [],
    must_change_password: Boolean(row.must_change_password),
    account_status: normalizedAccountStatus(row),
    temporary_password: temporaryPassword
  };
}

async function ensureUniqueStaffPhone(client, phone) {
  const result = await client.query(
    `SELECT 1
     FROM user_accounts u
     FULL OUTER JOIN backstage_accounts ba ON ba.phone = u.phone
     WHERE u.phone = $1 OR ba.phone = $1
     LIMIT 1`,
    [phone]
  );
  if (result.rows.length) {
    throw new AuthError('PHONE_ALREADY_EXISTS', 'Phone number already exists', 409);
  }
}

async function createStaffAccount(payload = {}, actor = {}) {
  const name = String(payload.name || '').trim();
  if (!name) throw new AuthError('INVALID_NAME', 'Name is required', 400);
  const phone = assertPhone(payload.phone);
  const role = normalizeRole(payload.role);
  const accountStatus = normalizeAccountStatus(payload.accountStatus || payload.account_status || payload.status || 'active');
  const scopeValue = String(payload.scope || payload.dataScope || '').trim();
  const organizationType = scopeValue === 'all'
    ? 'headquarters'
    : String(payload.organizationType || payload.organization_type || 'backstage').trim() || 'backstage';
  const storeId = payload.storeId || payload.store_id ? Number(payload.storeId || payload.store_id) : null;
  const requestedScopeIds = normalizeStoreIds(payload.storeScopeIds || payload.store_scope_ids || payload.storeIds || payload.store_ids);
  const storeScopeIds = Array.from(new Set((storeId ? [storeId] : []).concat(requestedScopeIds)));
  const permissions = accessControl.normalizePermissionList(normalizePermissions(payload.permissions));
  accessControl.validateAccountCreate(actor, Object.assign({}, payload, {
    role,
    storeId,
    storeScopeIds,
    permissions
  }));
  const temporaryPassword = generateTemporaryPassword(phone);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  return db.transaction(async (client) => {
    await ensureUniqueStaffPhone(client, phone);
    const status = accountStatus === 'active' ? 'active' : accountStatus;
    const backstage = await client.query(
      `INSERT INTO backstage_accounts (
        name, phone, role, entry, permissions, status, store_id, organization_type,
        must_change_password, account_status, failed_login_count, session_version, created_by, updated_by
      ) VALUES ($1,$2,$3,'backstage',$4,$5,$6,$7,true,$8,0,1,$9,$9)
      RETURNING id`,
      [
        name,
        phone,
        role,
        permissions,
        status,
        storeId,
        organizationType,
        accountStatus,
        actor && actor.id ? Number(actor.id) : null
      ]
    );
    const user = await client.query(
      `INSERT INTO user_accounts (
        username, phone, password_hash, role, related_profile_type, related_profile_id,
        status, must_change_password, failed_login_count, session_version
      ) VALUES ($1,$2,$3,$4,'backstage_accounts',$5,$6,true,0,1)
      RETURNING id`,
      [phone, phone, passwordHash, role, String(backstage.rows[0].id), status]
    );
    const created = await findById(user.rows[0].id, client);
    for (const scopedStoreId of storeScopeIds) {
      await client.query(
        `INSERT INTO account_store_scopes (account_id, store_id, created_by)
         VALUES ($1,$2,$3)
         ON CONFLICT (account_id, store_id) DO NOTHING`,
        [created.id, scopedStoreId, actor && actor.id ? Number(actor.id) : null]
      );
    }
    await writeAuthAudit(client, actor || null, 'create_staff_account', {
      targetUserId: created.id,
      phoneMasked: maskPhone(phone),
      role,
      accountStatus,
      storeScopeIds
    });
    return staffAccountResponse(await findById(created.id, client), temporaryPassword);
  });
}

async function resetStaffPassword(targetUserId, actor = {}) {
  return db.transaction(async (client) => {
    const account = await findById(targetUserId, client);
    if (!account || !accessControl.isBackstageRole(account)) {
      throw new AuthError('ACCOUNT_NOT_FOUND', 'Staff account does not exist', 404);
    }
    if (!accessControl.canManageAccountRecord(actor, account)) {
      throw new AuthError('FORBIDDEN', 'Permission denied', 403);
    }
    const temporaryPassword = generateTemporaryPassword(account.phone);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await client.query(
      `UPDATE user_accounts
       SET password_hash = $1,
           must_change_password = true,
           password_changed_at = now(),
           failed_login_count = 0,
           locked_until = NULL,
           status = 'active',
           session_version = session_version + 1
       WHERE id = $2`,
      [passwordHash, account.id]
    );
    if (account.related_profile_type === 'backstage_accounts' && account.related_profile_id) {
      await client.query(
        `UPDATE backstage_accounts
         SET must_change_password = true,
             password_changed_at = now(),
             failed_login_count = 0,
             locked_until = NULL,
             account_status = 'active',
             session_version = session_version + 1,
             updated_by = $2
         WHERE id = $1`,
        [Number(account.related_profile_id), actor && actor.id ? Number(actor.id) : null]
      );
    }
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE user_account_id = $1 AND revoked_at IS NULL`,
      [account.id]
    );
    await writeAuthAudit(client, actor || null, 'reset_staff_password', {
      targetUserId: account.id,
      phoneMasked: maskPhone(account.phone)
    });
    return staffAccountResponse(await findById(account.id, client), temporaryPassword);
  });
}

async function disableStaffAccount(targetUserId, actor = {}) {
  return setStaffAccountStatus(targetUserId, 'disabled', actor, 'disable_staff_account');
}

async function unlockStaffAccount(targetUserId, actor = {}) {
  return setStaffAccountStatus(targetUserId, 'active', actor, 'unlock_staff_account', {
    clearLock: true
  });
}

async function forceLogoutStaffAccount(targetUserId, actor = {}) {
  return db.transaction(async (client) => {
    const account = await findById(targetUserId, client);
    if (!account || !accessControl.isBackstageRole(account)) {
      throw new AuthError('ACCOUNT_NOT_FOUND', 'Staff account does not exist', 404);
    }
    if (!accessControl.canManageAccountRecord(actor, account)) {
      throw new AuthError('FORBIDDEN', 'Permission denied', 403);
    }
    await bumpSessionVersion(client, account);
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE user_account_id = $1 AND revoked_at IS NULL`,
      [account.id]
    );
    await writeAuthAudit(client, actor || null, 'force_logout_staff_account', {
      targetUserId: account.id,
      phoneMasked: maskPhone(account.phone)
    });
    return staffAccountResponse(await findById(account.id, client));
  });
}

async function bumpSessionVersion(client, account) {
  await client.query(
    `UPDATE user_accounts SET session_version = session_version + 1 WHERE id = $1`,
    [account.id]
  );
  if (account.related_profile_type === 'backstage_accounts' && account.related_profile_id) {
    await client.query(
      `UPDATE backstage_accounts SET session_version = session_version + 1 WHERE id = $1`,
      [Number(account.related_profile_id)]
    );
  }
}

async function setStaffAccountStatus(targetUserId, status, actor = {}, action, options = {}) {
  return db.transaction(async (client) => {
    const account = await findById(targetUserId, client);
    if (!account || !accessControl.isBackstageRole(account)) {
      throw new AuthError('ACCOUNT_NOT_FOUND', 'Staff account does not exist', 404);
    }
    if (!accessControl.canManageAccountRecord(actor, account)) {
      throw new AuthError('FORBIDDEN', 'Permission denied', 403);
    }
    await client.query(
      `UPDATE user_accounts
       SET status = $1,
           failed_login_count = CASE WHEN $2 THEN 0 ELSE failed_login_count END,
           locked_until = CASE WHEN $2 THEN NULL ELSE locked_until END,
           session_version = session_version + 1
       WHERE id = $3`,
      [status, Boolean(options.clearLock), account.id]
    );
    if (account.related_profile_type === 'backstage_accounts' && account.related_profile_id) {
      await client.query(
        `UPDATE backstage_accounts
         SET account_status = $1,
             failed_login_count = CASE WHEN $2 THEN 0 ELSE failed_login_count END,
             locked_until = CASE WHEN $2 THEN NULL ELSE locked_until END,
             session_version = session_version + 1,
             updated_by = $4
         WHERE id = $3`,
        [status, Boolean(options.clearLock), Number(account.related_profile_id), actor && actor.id ? Number(actor.id) : null]
      );
    }
    await client.query(
      `UPDATE auth_sessions SET revoked_at = now() WHERE user_account_id = $1 AND revoked_at IS NULL`,
      [account.id]
    );
    await writeAuthAudit(client, actor || null, action, {
      targetUserId: account.id,
      phoneMasked: maskPhone(account.phone),
      accountStatus: status
    });
    return staffAccountResponse(await findById(account.id, client));
  });
}

async function changePassword(user, currentPassword, newPassword, confirmPassword) {
  if (!user) throw new AuthError('UNAUTHORIZED', 'Login required', 401);
  if (!currentPassword) {
    throw new AuthError('INVALID_CREDENTIALS', 'Current password is required', 400);
  }

  return db.transaction(async (client) => {
    const account = await findById(user.id, client);
    if (!account) throw new AuthError('ACCOUNT_NOT_FOUND', 'Account does not exist', 404);

    const ok = await bcrypt.compare(String(currentPassword), account.password_hash);
    if (!ok) throw new AuthError('INVALID_CREDENTIALS', 'Current password is incorrect', 401);
    await validateNewPassword({ account, currentPassword, newPassword, confirmPassword });

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await client.query(
      `UPDATE user_accounts
       SET password_hash = $1,
           password_changed_at = now(),
           must_change_password = false,
           session_version = session_version + 1
       WHERE id = $2`,
      [passwordHash, account.id]
    );
    if (account.related_profile_type === 'backstage_accounts' && account.related_profile_id) {
      await client.query(
        `UPDATE backstage_accounts
         SET password_changed_at = now(),
             must_change_password = false,
             session_version = session_version + 1
         WHERE id = $1`,
        [Number(account.related_profile_id)]
      );
    }
    await client.query(
      `UPDATE auth_sessions
       SET revoked_at = now()
       WHERE user_account_id = $1
         AND revoked_at IS NULL`,
      [account.id]
    );
    await writeAuthAudit(client, account, 'change_password', {});
    return safeUser(await findById(account.id, client));
  });
}

module.exports = {
  AuthError,
  changePassword,
  createStaffAccount,
  disableStaffAccount,
  forceLogoutStaffAccount,
  generateTemporaryPassword,
  getUserByToken,
  issueSession,
  login,
  logout,
  resetStaffPassword,
  safeUser,
  tokenHash,
  unlockStaffAccount,
  writeAuthAudit
};
