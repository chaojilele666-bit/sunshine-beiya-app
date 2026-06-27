const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

const SESSION_TTL_HOURS = Number(process.env.AUTH_SESSION_TTL_HOURS || 8);
const MAX_FAILED_LOGINS = Number(process.env.AUTH_MAX_FAILED_LOGINS || 5);
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);

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

function safeUser(row) {
  if (!row) return null;
  const permissions = Array.isArray(row.backstage_permissions)
    ? row.backstage_permissions
    : [];
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    role: row.role,
    relatedProfileType: row.related_profile_type,
    relatedProfileId: row.related_profile_id,
    backstageProfileId: row.backstage_profile_id || null,
    backstageRole: row.backstage_role || null,
    hasBackstageProfile: Boolean(row.backstage_profile_id),
    permissions,
    status: row.status,
    phoneVerifiedAt: row.phone_verified_at,
    registeredAt: row.registered_at || row.created_at,
    lastLoginAt: row.last_login_at,
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

async function findById(id, client = db) {
  const result = await client.query(
    `SELECT u.*, ba.id AS backstage_profile_id, ba.role AS backstage_role, ba.permissions AS backstage_permissions
     FROM user_accounts u
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     WHERE u.id = $1`,
    [Number(id)]
  );
  return result.rows[0] || null;
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
  if (await hasLoginTrackingFields(client)) {
    await client.query(
      `UPDATE user_accounts
       SET failed_login_count = 0,
           locked_until = NULL,
           last_login_at = now(),
           last_login_method = COALESCE($2, last_login_method),
           login_source = COALESCE($3, login_source),
           login_count = COALESCE(login_count, 0) + 1
       WHERE id = $1`,
      [accountId, method || null, source || null]
    );
  } else {
    await client.query(
      `UPDATE user_accounts
       SET failed_login_count = 0,
           locked_until = NULL,
           last_login_at = now()
       WHERE id = $1`,
      [accountId]
    );
  }
  await client.query(
    `INSERT INTO auth_sessions (user_account_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [accountId, tokenHash(token), userAgent || null, ipAddress || null, expiresAt]
  );
  const updated = await findById(accountId, client);
  await writeAuthAudit(client, updated, 'login', { method: method || 'password' });
  return {
    token,
    expiresAt,
    user: safeUser(updated)
  };
}

async function login({ identifier, password, ipAddress, userAgent }) {
  if (!identifier || !password) {
    throw new AuthError('INVALID_CREDENTIALS', 'Account and password are required', 400);
  }

  return db.transaction(async (client) => {
    const account = await findByIdentifier(identifier, client);
    if (!account) {
      throw new AuthError('ACCOUNT_NOT_FOUND', 'Account does not exist', 401);
    }

    if (account.status !== 'active') {
      throw new AuthError('ACCOUNT_DISABLED', 'Account is disabled', 403);
    }

    if (account.locked_until && new Date(account.locked_until).getTime() > Date.now()) {
      throw new AuthError('ACCOUNT_LOCKED', 'Too many failed logins. Try again later.', 429);
    }

    const ok = await bcrypt.compare(String(password), account.password_hash);
    if (!ok) {
      const failedCount = Number(account.failed_login_count || 0) + 1;
      const lockedUntil = failedCount >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;
      await client.query(
        `UPDATE user_accounts
         SET failed_login_count = $1, locked_until = $2
         WHERE id = $3`,
        [failedCount, lockedUntil, account.id]
      );
      throw new AuthError('INVALID_CREDENTIALS', 'Password is incorrect', 401);
    }

    return issueSession(client, account.id, {
      method: 'password',
      source: 'backstage',
      ipAddress,
      userAgent
    });
  });
}

async function getUserByToken(token) {
  if (!token) return null;
  const result = await db.query(
    `SELECT u.*, s.expires_at AS session_expires_at, s.id AS session_id,
            ba.id AS backstage_profile_id, ba.role AS backstage_role, ba.permissions AS backstage_permissions
     FROM auth_sessions s
     JOIN user_accounts u ON u.id = s.user_account_id
     LEFT JOIN backstage_accounts ba
       ON u.related_profile_type = 'backstage_accounts'
      AND u.related_profile_id = ba.id::text
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.status = 'active'
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

async function changePassword(user, currentPassword, newPassword) {
  if (!user) throw new AuthError('UNAUTHORIZED', 'Login required', 401);
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    throw new AuthError('INVALID_PASSWORD', 'New password must be at least 8 characters', 400);
  }

  return db.transaction(async (client) => {
    const account = await findById(user.id, client);
    if (!account) throw new AuthError('ACCOUNT_NOT_FOUND', 'Account does not exist', 404);

    const ok = await bcrypt.compare(String(currentPassword), account.password_hash);
    if (!ok) throw new AuthError('INVALID_CREDENTIALS', 'Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await client.query(
      `UPDATE user_accounts SET password_hash = $1 WHERE id = $2`,
      [passwordHash, account.id]
    );
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
  getUserByToken,
  issueSession,
  login,
  logout,
  safeUser,
  tokenHash,
  writeAuthAudit
};
