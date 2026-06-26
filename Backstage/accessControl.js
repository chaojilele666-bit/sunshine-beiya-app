const BACKSTAGE_RESOURCES = new Set([
  'accounts',
  'ayis',
  'demands',
  'appointments',
  'applications',
  'orders',
  'orderDispatches',
  'stores',
  'serviceModules',
  'banners',
  'companyProfile'
]);

const OPERATOR_RESOURCES = new Set([
  'ayis',
  'demands',
  'appointments',
  'applications',
  'orders',
  'orderDispatches',
  'stores',
  'serviceModules',
  'banners'
]);

function isBackstageRole(user) {
  return user && ['operator', 'boss'].includes(user.role);
}

function canUseBackstage(user) {
  return isBackstageRole(user);
}

function allowedResourcesForRole(role) {
  if (role === 'boss') return ['dashboard', 'accounts', 'companyProfile', ...OPERATOR_RESOURCES];
  if (role === 'operator') return [...OPERATOR_RESOURCES];
  return [];
}

function normalizePhone(value) {
  return String(value || '').trim();
}

function isEnabledStatus(value) {
  return !['disabled', 'locked', '停用'].includes(String(value || ''));
}

function isBossAccountPayload(payload = {}) {
  const legacyManagementRole = `老${'板'}端`;
  return payload.role === 'boss' || payload.role === legacyManagementRole || payload.role === '管理端';
}

function requireAuth(user) {
  if (!user) return { ok: false, status: 401, message: 'Login required' };
  return { ok: true };
}

function canAccessResource(user, resource, method) {
  if (resource === 'miniprogram' && method === 'GET') return { ok: true, public: true };
  if (resource === 'service-categories' || resource === 'service-items' || resource === 'service-catalog') {
    return { ok: true, public: true };
  }

  const auth = requireAuth(user);
  if (!auth.ok) return auth;

  if (resource === 'dashboard') {
    return user.role === 'boss'
      ? { ok: true }
      : { ok: false, status: 403, message: 'Management role required' };
  }

  if (resource === 'auditLogs') {
    return user.role === 'boss'
      ? { ok: true }
      : { ok: false, status: 403, message: 'Management role required' };
  }

  if (!BACKSTAGE_RESOURCES.has(resource)) {
    return { ok: false, status: 404, message: 'Unknown resource' };
  }

  if (user.role === 'boss') return { ok: true };

  if (user.role === 'operator') {
    if (!OPERATOR_RESOURCES.has(resource)) {
      return { ok: false, status: 403, message: 'Permission denied' };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, message: 'Permission denied' };
}

function canAccessRecord(user, resource, record) {
  if (!record) return false;
  if (user.role === 'boss') return true;
  if (user.role === 'operator') {
    if (resource === 'accounts') return false;
    return true;
  }

  const phone = normalizePhone(user.phone);
  const profileId = String(user.relatedProfileId || '');

  if (user.role === 'customer') {
    if (resource === 'demands' || resource === 'appointments') {
      return normalizePhone(record.phone) === phone;
    }
    if (resource === 'orders') {
      return normalizePhone(record.customerPhone) === phone;
    }
    return false;
  }

  if (user.role === 'ayi') {
    if (resource === 'ayis') {
      return String(record.id) === profileId || normalizePhone(record.phone) === phone;
    }
    if (resource === 'demands') {
      return true;
    }
    if (resource === 'applications') {
      return normalizePhone(record.ayiPhone) === phone;
    }
    if (resource === 'appointments' || resource === 'orders' || resource === 'orderDispatches') {
      return normalizePhone(record.ayiPhone) === phone;
    }
  }

  return false;
}

function scopePayloadForCreate(user, resource, payload = {}) {
  if (user.role === 'boss') return payload;
  if (user.role === 'operator') {
    if (resource === 'accounts' || isBossAccountPayload(payload)) {
      throw Object.assign(new Error('Operator cannot manage management accounts'), { status: 403 });
    }
    return payload;
  }

  if (user.role === 'customer') {
    if (!['demands', 'appointments'].includes(resource)) {
      throw Object.assign(new Error('Permission denied'), { status: 403 });
    }
    return Object.assign({}, payload, {
      customerName: payload.customerName || user.username,
      phone: user.phone
    });
  }

  if (user.role === 'ayi') {
    if (resource !== 'applications') {
      throw Object.assign(new Error('Permission denied'), { status: 403 });
    }
    return Object.assign({}, payload, {
      ayiName: payload.ayiName || user.username,
      ayiPhone: user.phone
    });
  }

  throw Object.assign(new Error('Permission denied'), { status: 403 });
}

function scopePayloadForUpdate(user, resource, payload = {}) {
  if (user.role === 'operator' && (resource === 'accounts' || isBossAccountPayload(payload))) {
    throw Object.assign(new Error('Operator cannot manage management accounts'), { status: 403 });
  }
  if (user.role === 'customer') {
    if (!['demands', 'appointments'].includes(resource)) {
      throw Object.assign(new Error('Permission denied'), { status: 403 });
    }
    return Object.assign({}, payload, { phone: user.phone });
  }
  if (user.role === 'ayi') {
    if (resource === 'ayis') return Object.assign({}, payload, { phone: user.phone });
    if (resource === 'applications') return Object.assign({}, payload, { ayiPhone: user.phone });
    throw Object.assign(new Error('Permission denied'), { status: 403 });
  }
  return payload;
}

function listFilterForUser(user, resource) {
  if (user.role === 'boss' || user.role === 'operator') return null;
  const phone = normalizePhone(user.phone);
  const profileId = String(user.relatedProfileId || '');

  if (user.role === 'customer') {
    if (resource === 'demands' || resource === 'appointments') {
      return { clause: 'phone = $1', params: [phone] };
    }
    if (resource === 'orders') {
      return { clause: 'customer_phone = $1', params: [phone] };
    }
  }

  if (user.role === 'ayi') {
    if (resource === 'ayis') {
      return { clause: '(id::text = $1 OR phone = $2)', params: [profileId, phone] };
    }
    if (resource === 'demands') {
      return { clause: "status NOT IN ('已成交','已取消')", params: [] };
    }
    if (resource === 'applications') {
      return { clause: 'ayi_phone = $1', params: [phone] };
    }
    if (resource === 'appointments' || resource === 'orders' || resource === 'orderDispatches') {
      return { clause: 'ayi_phone = $1', params: [phone] };
    }
  }

  return { clause: '1 = 0', params: [] };
}

module.exports = {
  allowedResourcesForRole,
  canAccessRecord,
  canAccessResource,
  canUseBackstage,
  isBackstageRole,
  isEnabledStatus,
  scopePayloadForCreate,
  scopePayloadForUpdate,
  listFilterForUser
};
