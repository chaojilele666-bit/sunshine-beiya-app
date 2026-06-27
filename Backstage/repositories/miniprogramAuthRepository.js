const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const db = require('../db');
const authRepository = require('./authRepository');
const notificationRepository = require('./notificationRepository');

const WECHAT_API_TIMEOUT_MS = Number(process.env.WECHAT_API_TIMEOUT_MS || 8000);
const DEFAULT_ROLE = 'customer';

function makeAuthError(code, message, status = 400) {
  return new authRepository.AuthError(code, message, status);
}

function requireWechatConfig() {
  const appid = process.env.WECHAT_MINIPROGRAM_APPID;
  const secret = process.env.WECHAT_MINIPROGRAM_SECRET;
  if (!appid || !secret) {
    throw makeAuthError('WECHAT_NOT_CONFIGURED', '小程序登录尚未完成配置', 503);
  }
  return { appid, secret };
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: WECHAT_API_TIMEOUT_MS }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(makeAuthError('WECHAT_BAD_RESPONSE', '微信登录失败，请稍后重试', 502));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(makeAuthError('WECHAT_TIMEOUT', '微信登录失败，请稍后重试', 504));
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function codeToSession(code) {
  if (!code || typeof code !== 'string') {
    throw makeAuthError('INVALID_WECHAT_CODE', '微信登录失败，请稍后重试', 400);
  }
  const { appid, secret } = requireWechatConfig();
  const url = 'https://api.weixin.qq.com/sns/jscode2session'
    + `?appid=${encodeURIComponent(appid)}`
    + `&secret=${encodeURIComponent(secret)}`
    + `&js_code=${encodeURIComponent(code)}`
    + '&grant_type=authorization_code';
  const data = await requestJson(url);
  if (data.errcode) {
    throw makeAuthError('WECHAT_CODE_FAILED', '微信登录失败，请稍后重试', 400);
  }
  if (!data.openid) {
    throw makeAuthError('WECHAT_OPENID_MISSING', '微信登录失败，请稍后重试', 400);
  }
  return {
    openid: data.openid,
    unionid: data.unionid || '',
    sessionKey: data.session_key || ''
  };
}

let cachedAccessToken = null;

async function getWechatAccessToken() {
  const { appid, secret } = requireWechatConfig();
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60 * 1000) {
    return cachedAccessToken.value;
  }
  const url = 'https://api.weixin.qq.com/cgi-bin/token'
    + `?grant_type=client_credential&appid=${encodeURIComponent(appid)}`
    + `&secret=${encodeURIComponent(secret)}`;
  const data = await requestJson(url);
  if (data.errcode || !data.access_token) {
    throw makeAuthError('WECHAT_ACCESS_TOKEN_FAILED', '手机号授权失败', 400);
  }
  cachedAccessToken = {
    value: data.access_token,
    expiresAt: now + Number(data.expires_in || 7200) * 1000
  };
  return cachedAccessToken.value;
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload || {});
    const req = https.request(url, {
      method: 'POST',
      timeout: WECHAT_API_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(makeAuthError('WECHAT_BAD_RESPONSE', '手机号授权失败', 502));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(makeAuthError('WECHAT_TIMEOUT', '手机号授权失败', 504));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getPhoneNumber(phoneCode) {
  if (!phoneCode || typeof phoneCode !== 'string') {
    throw makeAuthError('PHONE_CODE_REQUIRED', '手机号授权失败', 400);
  }
  const accessToken = await getWechatAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`;
  const data = await postJson(url, { code: phoneCode });
  if (data.errcode) {
    throw makeAuthError('WECHAT_PHONE_FAILED', '手机号授权失败', 400);
  }
  const phoneInfo = data.phone_info || {};
  const phone = phoneInfo.phoneNumber || phoneInfo.purePhoneNumber || '';
  if (!phone) {
    throw makeAuthError('PHONE_MISSING', '手机号授权失败', 400);
  }
  return phone;
}

function normalizeRole(value) {
  return ['customer', 'ayi'].includes(value) ? value : DEFAULT_ROLE;
}

function maskOpenid(value) {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return `${text.slice(0, 2)}****`;
  return `${text.slice(0, 4)}****${text.slice(-4)}`;
}

async function randomPasswordHash() {
  return bcrypt.hash(crypto.randomBytes(24).toString('base64url'), 12);
}

async function findCandidate(client, { openid, unionid, phone }) {
  const clauses = [];
  const params = [];
  if (openid) {
    params.push(openid);
    clauses.push(`wechat_openid = $${params.length}`);
  }
  if (unionid) {
    params.push(unionid);
    clauses.push(`wechat_unionid = $${params.length}`);
  }
  if (phone) {
    params.push(phone);
    clauses.push(`phone = $${params.length}`);
  }
  if (!clauses.length) return null;
  const result = await client.query(
    `SELECT * FROM user_accounts
     WHERE ${clauses.join(' OR ')}
     ORDER BY
       CASE WHEN wechat_openid = $1 THEN 0 ELSE 1 END,
       id ASC`,
    params
  );
  if (result.rows.length > 1) {
    const ids = new Set(result.rows.map((row) => row.id));
    if (ids.size > 1) {
      throw makeAuthError('ACCOUNT_MERGE_REQUIRED', '当前账号需要人工合并', 409);
    }
  }
  return result.rows[0] || null;
}

async function upsertMiniprogramUser(client, identity, options = {}) {
  const role = normalizeRole(options.role);
  const phone = identity.phone || '';
  const existing = await findCandidate(client, identity);
  if (existing) {
    if (!['customer', 'ayi'].includes(existing.role)) {
      throw makeAuthError('ACCOUNT_MERGE_REQUIRED', '当前账号需要人工合并', 409);
    }
    if (existing.status !== 'active') {
      throw makeAuthError('ACCOUNT_DISABLED', '账号已停用，请联系工作人员', 403);
    }
    const updates = [];
    const params = [];
    if (identity.openid && !existing.wechat_openid) {
      params.push(identity.openid);
      updates.push(`wechat_openid = $${params.length}`, 'wechat_bound_at = COALESCE(wechat_bound_at, now())');
    }
    if (identity.unionid && !existing.wechat_unionid) {
      params.push(identity.unionid);
      updates.push(`wechat_unionid = $${params.length}`);
    }
    if (phone && !existing.phone) {
      params.push(phone);
      updates.push(`phone = $${params.length}`, 'phone_verified_at = now()');
    } else if (phone && existing.phone === phone) {
      updates.push('phone_verified_at = COALESCE(phone_verified_at, now())');
    }
    if (updates.length) {
      params.push(existing.id);
      await client.query(`UPDATE user_accounts SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    }
    return { id: existing.id, created: false };
  }

  const username = phone
    ? `mini_${phone}`
    : `wx_${crypto.createHash('sha1').update(identity.openid).digest('hex').slice(0, 16)}`;
  const passwordHash = await randomPasswordHash();
  const result = await client.query(
    `INSERT INTO user_accounts (
      username, phone, password_hash, role, status, wechat_openid, wechat_unionid,
      phone_verified_at, registered_at, login_source, wechat_bound_at
    ) VALUES ($1,$2,$3,$4,'active',$5,$6,$7,now(),$8,$9)
    RETURNING id`,
    [
      username,
      phone || null,
      passwordHash,
      role,
      identity.openid || null,
      identity.unionid || null,
      phone ? new Date() : null,
      options.source || 'wechat_miniprogram',
      identity.openid ? new Date() : null
    ]
  );
  return { id: result.rows[0].id, created: true };
}

async function loginWithWechat({ code, role, source, ipAddress, userAgent }) {
  const identity = await codeToSession(code);
  return db.transaction(async (client) => {
    const upsert = await upsertMiniprogramUser(client, identity, { role, source: source || 'wechat_login' });
    const result = await authRepository.issueSession(client, upsert.id, {
      method: 'wechat',
      source: source || 'wechat_miniprogram',
      ipAddress,
      userAgent
    });
    const user = result.user;
    await authRepository.writeAuthAudit(client, user, 'miniprogram_register_or_login', {
      method: 'wechat',
      openid: maskOpenid(identity.openid),
      unionidBound: Boolean(identity.unionid)
    });
    if (upsert.created) {
      await notificationRepository.notifyBackstage(client, {
        messageType: user.role === 'ayi' ? 'new_ayi_register' : 'new_customer_register',
        title: user.role === 'ayi' ? '新阿姨注册' : '新客户注册',
        summary: `${user.phone || user.username || '小程序用户'} 已通过微信登录注册。`,
        entityType: 'user_accounts',
        entityId: user.id,
        pagePath: '/pages/messages/messages',
        dedupeKey: `miniprogram-register:${user.id}`
      });
    }
    return Object.assign({}, result, { user });
  });
}

async function loginWithWechatPhone({ loginCode, phoneCode, role, source, ipAddress, userAgent }) {
  const identity = loginCode ? await codeToSession(loginCode) : {};
  const phone = await getPhoneNumber(phoneCode);
  return db.transaction(async (client) => {
    const upsert = await upsertMiniprogramUser(client, Object.assign({}, identity, { phone }), {
      role,
      source: source || 'wechat_phone_login'
    });
    const result = await authRepository.issueSession(client, upsert.id, {
      method: 'wechat_phone',
      source: source || 'wechat_miniprogram',
      ipAddress,
      userAgent
    });
    const user = result.user;
    await authRepository.writeAuthAudit(client, user, 'miniprogram_register_or_login', {
      method: 'wechat_phone',
      openid: maskOpenid(identity.openid),
      phoneBound: true
    });
    if (upsert.created) {
      await notificationRepository.notifyBackstage(client, {
        messageType: user.role === 'ayi' ? 'new_ayi_register' : 'new_customer_register',
        title: user.role === 'ayi' ? '新阿姨注册' : '新客户注册',
        summary: `${phone} 已通过手机号授权注册。`,
        entityType: 'user_accounts',
        entityId: user.id,
        pagePath: '/pages/messages/messages',
        dedupeKey: `miniprogram-register:${user.id}`
      });
    }
    return Object.assign({}, result, { user });
  });
}

async function listMiniprogramUsers() {
  const result = await db.query(
    `SELECT id, username, phone, role, status, related_profile_type, related_profile_id,
            wechat_openid, wechat_unionid, phone_verified_at, registered_at,
            last_login_at, last_login_method, login_source, login_count, created_at
     FROM user_accounts
     WHERE role IN ('customer', 'ayi')
     ORDER BY COALESCE(registered_at, created_at) DESC, id DESC
     LIMIT 500`
  );
  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    phone: row.phone || '',
    role: row.role,
    status: row.status,
    relatedProfileType: row.related_profile_type,
    relatedProfileId: row.related_profile_id,
    wechatBound: Boolean(row.wechat_openid || row.wechat_unionid),
    wechatOpenidMasked: maskOpenid(row.wechat_openid),
    unionidBound: Boolean(row.wechat_unionid),
    phoneVerified: Boolean(row.phone_verified_at),
    phoneVerifiedAt: row.phone_verified_at,
    registeredAt: row.registered_at || row.created_at,
    lastLoginAt: row.last_login_at,
    lastLoginMethod: row.last_login_method || '',
    loginSource: row.login_source || '',
    loginCount: row.login_count || 0
  }));
}

module.exports = {
  loginWithWechat,
  loginWithWechatPhone,
  listMiniprogramUsers
};
