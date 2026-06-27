const BACKSTAGE_RESOURCES = new Set([
  'accounts',
  'ayis',
  'demands',
  'todos',
  'exportInfo',
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
  'todos',
  'exportInfo',
  'appointments',
  'applications',
  'orders',
  'orderDispatches',
  'stores',
  'serviceModules',
  'banners'
]);

const BOSS_ONLY_RESOURCES = new Set([
  'dashboard',
  'accounts',
  'auditLogs',
  'companyProfile'
]);

const ALL_BACKSTAGE_RESOURCES = [
  'dashboard',
  'accounts',
  'auditLogs',
  'todos',
  'companyProfile',
  ...OPERATOR_RESOURCES
];

const PERMISSION_ALIASES = {
  dashboard: 'dashboard',
  managementDashboard: 'dashboard',
  accounts: 'accounts',
  accountPermissions: 'accounts',
  auditLogs: 'auditLogs',
  audit_logs: 'auditLogs',
  exportInfo: 'exportInfo',
  exports: 'exportInfo',
  company: 'companyProfile',
  companyProfile: 'companyProfile',
  ayis: 'ayis',
  ayi: 'ayis',
  demands: 'demands',
  appointments: 'appointments',
  applications: 'applications',
  orders: 'orders',
  todos: 'todos',
  todo: 'todos',
  dispatches: 'orderDispatches',
  orderDispatches: 'orderDispatches',
  stores: 'stores',
  services: 'serviceModules',
  serviceModules: 'serviceModules',
  banners: 'banners',
  '管理看板': 'dashboard',
  '账号权限': 'accounts',
  '操作记录': 'auditLogs',
  '公司基础信息': 'companyProfile',
  '今日待办': 'todos',
  '阿姨管理': 'ayis',
  '客户需求': 'demands',
  '预约面试': 'appointments',
  '接单申请': 'applications',
  '订单跟进': 'orders',
  '人工派单': 'orderDispatches',
  '门店信息': 'stores',
  '服务中心': 'serviceModules',
  '公司服务': 'serviceModules',
  '首页轮播': 'banners'
};

function isBackstageRole(user) {
  return user && ['operator', 'boss'].includes(user.role);
}

function canUseBackstage(user) {
  return isBackstageRole(user);
}

function allowedResourcesForRole(role) {
  if (role === 'boss') return [...ALL_BACKSTAGE_RESOURCES];
  if (role === 'operator') return [...OPERATOR_RESOURCES];
  return [];
}

function normalizePermissionResource(value) {
  const text = String(value || '').trim();
  return PERMISSION_ALIASES[text] || null;
}

function configuredOperatorResources(user) {
  const permissions = Array.isArray(user && user.permissions) ? user.permissions : [];
  const normalized = permissions
    .map(normalizePermissionResource)
    .filter((resource) => resource && OPERATOR_RESOURCES.has(resource));
  const unique = new Set(normalized);
  if (unique.has('demands')) unique.add('todos');
  return Array.from(unique);
}

function allowedResourcesForUser(user) {
  if (!user) return [];
  if (user.role === 'boss') return [...ALL_BACKSTAGE_RESOURCES];
  if (user.role === 'operator') {
    const configured = configuredOperatorResources(user);
    if (configured.length) return configured;
    return user.hasBackstageProfile ? [] : [...OPERATOR_RESOURCES];
  }
  return [];
}

function canAccessModule(user, resource) {
  if (!user) return { ok: false, status: 401, message: 'Login required' };
  if (user.role === 'boss') return { ok: true };
  if (user.role === 'operator') {
    if (BOSS_ONLY_RESOURCES.has(resource)) {
      return { ok: false, status: 403, message: 'Management role required' };
    }
    return allowedResourcesForUser(user).includes(resource)
      ? { ok: true }
      : { ok: false, status: 403, message: 'Permission denied' };
  }
  return { ok: false, status: 403, message: 'Permission denied' };
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
    return canAccessModule(user, resource);
  }

  if (resource === 'auditLogs') {
    return canAccessModule(user, resource);
  }

  if (resource === 'exportInfo') {
    return canAccessModule(user, resource);
  }

  if (!BACKSTAGE_RESOURCES.has(resource)) {
    return { ok: false, status: 404, message: 'Unknown resource' };
  }

  return canAccessModule(user, resource);
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
  allowedResourcesForUser,
  allowedResourcesForRole,
  canAccessRecord,
  canAccessModule,
  canAccessResource,
  canUseBackstage,
  isBackstageRole,
  isEnabledStatus,
  scopePayloadForCreate,
  scopePayloadForUpdate,
  listFilterForUser
};
