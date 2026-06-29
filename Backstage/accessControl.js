const BUSINESS_RESOURCES = new Set([
  'ayis',
  'demands',
  'todos',
  'appointments',
  'applications',
  'orders',
  'orderDispatches',
  'stores',
  'serviceModules',
  'banners'
]);

const MANAGEMENT_RESOURCES = new Set([
  'dashboard',
  'accounts',
  'auditLogs',
  'companyProfile',
  'exportInfo'
]);

const MANAGEMENT_ONLY_RESOURCES = new Set([
  'auditLogs',
  'exportInfo'
]);

const BACKSTAGE_RESOURCES = new Set([
  ...BUSINESS_RESOURCES,
  ...MANAGEMENT_RESOURCES
]);

const ALL_BACKSTAGE_RESOURCES = [
  'dashboard',
  'accounts',
  'auditLogs',
  'companyProfile',
  'customers',
  'ayis',
  'demands',
  'appointments',
  'todos',
  'appointmentRecords',
  'stores',
  'exportInfo',
  'serviceModules',
  'applications',
  'orders',
  'orderDispatches',
  'banners'
];

const OPERATOR_DEFAULT_RESOURCES = [
  'customers',
  'ayis',
  'demands',
  'appointments',
  'todos',
  'appointmentRecords',
  'stores',
  'serviceModules',
  'applications',
  'orders',
  'orderDispatches',
  'banners'
];

const STORE_MANAGER_DEFAULT_RESOURCES = [
  'accounts',
  'customers',
  'ayis',
  'demands',
  'appointments',
  'todos',
  'appointmentRecords',
  'stores',
  'applications',
  'orders',
  'orderDispatches'
];

const PERMISSION_ALIASES = {
  dashboard: 'dashboard',
  managementDashboard: 'dashboard',
  homeDashboard: 'dashboard',
  customers: 'customers',
  customerManagement: 'customers',
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
  '阿姨管理': 'ayis',
  demands: 'demands',
  '客户需求': 'demands',
  appointments: 'appointments',
  '预约面试': 'appointments',
  appointmentRecords: 'appointmentRecords',
  applications: 'applications',
  '接单申请': 'applications',
  orders: 'orders',
  '订单跟进': 'orders',
  todos: 'todos',
  todo: 'todos',
  dispatches: 'orderDispatches',
  orderDispatches: 'orderDispatches',
  '人工派单': 'orderDispatches',
  stores: 'stores',
  '门店信息': 'stores',
  services: 'serviceModules',
  serviceModules: 'serviceModules',
  '服务中心': 'serviceModules',
  banners: 'banners',
  '首页轮播': 'banners'
};

const RESOURCE_PERMISSION_ALIASES = {
  customers: 'demands',
  appointmentRecords: 'appointments'
};

const STORE_SCOPED_RESOURCES = new Set([
  'accounts',
  'ayis',
  'demands',
  'todos',
  'appointments',
  'applications',
  'orders',
  'orderDispatches',
  'stores'
]);

const ACCOUNT_ROLE_ORDER = {
  boss: 4,
  management: 4,
  operator: 3,
  store_manager: 2,
  store_staff: 1
};

function canonicalRole(role) {
  return role === 'management' ? 'boss' : role;
}

function isBackstageRole(user) {
  return user && ['boss', 'management', 'operator', 'store_manager', 'store_staff'].includes(user.role);
}

function canUseBackstage(user) {
  return isBackstageRole(user);
}

function normalizePermissionResource(value) {
  const text = String(value || '').trim();
  return PERMISSION_ALIASES[text] || null;
}

function normalizePermissionList(values) {
  const permissions = Array.isArray(values) ? values : [];
  const normalized = permissions
    .map(normalizePermissionResource)
    .filter(Boolean)
    .map((resource) => RESOURCE_PERMISSION_ALIASES[resource] || resource);
  const unique = new Set(normalized);
  if (unique.has('demands')) unique.add('todos');
  if (unique.has('appointments')) unique.add('appointmentRecords');
  return Array.from(unique);
}

function allowedResourcesForRole(role) {
  const normalized = canonicalRole(role);
  if (normalized === 'boss') return [...ALL_BACKSTAGE_RESOURCES];
  if (normalized === 'operator') return [...OPERATOR_DEFAULT_RESOURCES];
  if (normalized === 'store_manager') return [...STORE_MANAGER_DEFAULT_RESOURCES];
  if (normalized === 'store_staff') return [];
  return [];
}

function configuredResources(user) {
  return normalizePermissionList(user && user.permissions);
}

function allowedResourcesForUser(user) {
  if (!user) return [];
  const role = canonicalRole(user.role);
  if (role === 'boss') return [...ALL_BACKSTAGE_RESOURCES];

  const configured = configuredResources(user);
  if (configured.length) return configured.filter((resource) => !MANAGEMENT_ONLY_RESOURCES.has(requiredPermissionForResource(resource)));

  if (role === 'operator') {
    return user.hasBackstageProfile ? [] : [...OPERATOR_DEFAULT_RESOURCES];
  }
  if (role === 'store_manager') return [...STORE_MANAGER_DEFAULT_RESOURCES];
  if (role === 'store_staff') return [];
  return [];
}

function requiredPermissionForResource(resource) {
  return RESOURCE_PERMISSION_ALIASES[resource] || resource;
}

function canAccessModule(user, resource) {
  if (!user) return { ok: false, status: 401, message: 'Login required' };
  const role = canonicalRole(user.role);
  if (role === 'boss') return { ok: true };
  if (!isBackstageRole(user)) return { ok: false, status: 403, message: 'Permission denied' };
  if (MANAGEMENT_ONLY_RESOURCES.has(requiredPermissionForResource(resource))) {
    return { ok: false, status: 403, message: 'Permission denied' };
  }
  if (role === 'store_staff' && resource === 'accounts') {
    return { ok: false, status: 403, message: 'Permission denied' };
  }
  const required = requiredPermissionForResource(resource);
  return allowedResourcesForUser(user).includes(required)
    ? { ok: true }
    : { ok: false, status: 403, message: 'Permission denied' };
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
  if (!BACKSTAGE_RESOURCES.has(resource) && !['customers', 'appointmentRecords'].includes(resource)) {
    return { ok: false, status: 404, message: 'Unknown resource' };
  }
  return canAccessModule(user, resource);
}

function normalizePhone(value) {
  return String(value || '').trim();
}

function isEnabledStatus(value) {
  return !['disabled', 'locked'].includes(String(value || ''));
}

function storeScopeIds(user) {
  if (!user) return [];
  const ids = Array.isArray(user.storeScopeIds) ? user.storeScopeIds : [];
  if (user.storeId) ids.push(user.storeId);
  return Array.from(new Set(ids.map(Number).filter((id) => Number.isFinite(id))));
}

function dataScope(user) {
  const role = canonicalRole(user && user.role);
  if (role === 'boss') return { type: 'all', storeIds: [] };
  if (role === 'operator') {
    if (user.organizationType === 'headquarters' || user.organizationType === 'operations_center') {
      return { type: 'all', storeIds: [] };
    }
    const ids = storeScopeIds(user);
    return ids.length ? { type: 'stores', storeIds: ids } : { type: 'all', storeIds: [] };
  }
  if (role === 'store_manager' || role === 'store_staff') {
    const ids = storeScopeIds(user);
    return ids.length ? { type: 'stores', storeIds: [ids[0]] } : { type: 'none', storeIds: [] };
  }
  return { type: 'none', storeIds: [] };
}

function canAccessStore(user, storeId) {
  const scope = dataScope(user);
  if (scope.type === 'all') return true;
  if (!storeId) return false;
  return scope.storeIds.includes(Number(storeId));
}

function recordStoreId(record) {
  if (!record) return null;
  return record.storeId || record.store_id || null;
}

function canAccessRecord(user, resource, record) {
  if (!record) return false;
  const role = canonicalRole(user && user.role);
  if (role === 'boss') return true;
  if (resource === 'accounts') return canManageAccountRecord(user, record);
  if (!STORE_SCOPED_RESOURCES.has(resource)) return canAccessModule(user, resource).ok;

  const storeId = recordStoreId(record);
  if (storeId) return canAccessStore(user, storeId);

  if (role === 'operator') return dataScope(user).type === 'all';
  if (role === 'store_manager' || role === 'store_staff') return false;

  const phone = normalizePhone(user && user.phone);
  const profileId = String((user && user.relatedProfileId) || '');
  if (user && user.role === 'customer') {
    if (resource === 'demands' || resource === 'appointments') return normalizePhone(record.phone) === phone;
    if (resource === 'orders') return normalizePhone(record.customerPhone) === phone;
  }
  if (user && user.role === 'ayi') {
    if (resource === 'ayis') return String(record.id) === profileId || normalizePhone(record.phone) === phone;
    if (resource === 'applications') return normalizePhone(record.ayiPhone) === phone;
    if (resource === 'appointments' || resource === 'orders' || resource === 'orderDispatches') {
      return normalizePhone(record.ayiPhone) === phone;
    }
  }
  return false;
}

function canCreateRole(actor, targetRole) {
  const actorRole = canonicalRole(actor && actor.role);
  const target = canonicalRole(targetRole);
  if (actorRole === 'boss') return ['operator', 'store_manager', 'store_staff'].includes(target);
  if (actorRole === 'operator') return ['store_manager', 'store_staff'].includes(target);
  if (actorRole === 'store_manager') return target === 'store_staff';
  return false;
}

function canManageAccountRecord(actor, target) {
  const actorRole = canonicalRole(actor && actor.role);
  const targetRole = canonicalRole(target && target.role);
  if (actorRole === 'boss') return targetRole !== 'boss';
  if (actorRole === 'operator') {
    if (!['store_manager', 'store_staff'].includes(targetRole)) return false;
    return !recordStoreId(target) || canAccessStore(actor, recordStoreId(target));
  }
  if (actorRole === 'store_manager') {
    return targetRole === 'store_staff' && canAccessStore(actor, recordStoreId(target));
  }
  return false;
}

function ensurePermissionSubset(actor, permissions) {
  const actorRole = canonicalRole(actor && actor.role);
  if (actorRole === 'boss') return;
  const allowed = new Set(allowedResourcesForUser(actor).map(requiredPermissionForResource));
  const requested = normalizePermissionList(permissions);
  const invalid = requested.filter((resource) => !allowed.has(requiredPermissionForResource(resource)));
  if (invalid.length) {
    throw Object.assign(new Error('Cannot grant permissions outside actor permissions'), { status: 403 });
  }
}

function validateAccountCreate(actor, payload = {}) {
  const targetRole = canonicalRole(payload.role);
  if (!canCreateRole(actor, targetRole)) {
    throw Object.assign(new Error('Cannot create target role'), { status: 403 });
  }
  ensurePermissionSubset(actor, payload.permissions);

  const actorRole = canonicalRole(actor && actor.role);
  const targetStoreId = payload.storeId || payload.store_id || null;
  if (targetRole === 'store_manager' || targetRole === 'store_staff') {
    if (!targetStoreId) throw Object.assign(new Error('Store is required for store roles'), { status: 400 });
    if (actorRole !== 'boss' && !canAccessStore(actor, targetStoreId)) {
      throw Object.assign(new Error('Cannot create account outside store scope'), { status: 403 });
    }
  }
  if (actorRole === 'store_manager' && Number(targetStoreId) !== Number(actor.storeId)) {
    throw Object.assign(new Error('Store manager can only create staff in own store'), { status: 403 });
  }
}

function scopePayloadForCreate(user, resource, payload = {}) {
  const role = canonicalRole(user && user.role);
  if (resource === 'accounts') validateAccountCreate(user, payload);
  if (role === 'boss') return payload;
  if (role === 'operator' || role === 'store_manager' || role === 'store_staff') {
    if (resource === 'accounts') return payload;
    if (!canAccessModule(user, resource).ok) {
      throw Object.assign(new Error('Permission denied'), { status: 403 });
    }
    if (STORE_SCOPED_RESOURCES.has(resource) && dataScope(user).type === 'stores') {
      const scope = dataScope(user);
      const targetStoreId = payload.storeId || payload.store_id;
      if (targetStoreId && !scope.storeIds.includes(Number(targetStoreId))) {
        throw Object.assign(new Error('Cannot create record outside store scope'), { status: 403 });
      }
      if (resource === 'ayis') return Object.assign({}, payload, { storeId: Number(targetStoreId || scope.storeIds[0]) });
    }
    return payload;
  }

  if (user && user.role === 'customer') {
    if (!['demands', 'appointments'].includes(resource)) throw Object.assign(new Error('Permission denied'), { status: 403 });
    return Object.assign({}, payload, { customerName: payload.customerName || user.username, phone: user.phone });
  }
  if (user && user.role === 'ayi') {
    if (resource !== 'applications') throw Object.assign(new Error('Permission denied'), { status: 403 });
    return Object.assign({}, payload, { ayiName: payload.ayiName || user.username, ayiPhone: user.phone });
  }
  throw Object.assign(new Error('Permission denied'), { status: 403 });
}

function scopePayloadForUpdate(user, resource, payload = {}, before = null) {
  const role = canonicalRole(user && user.role);
  if (resource === 'accounts') {
    if (!canManageAccountRecord(user, before || payload)) throw Object.assign(new Error('Permission denied'), { status: 403 });
    if (role !== 'boss') {
      if (payload.role && canonicalRole(payload.role) !== canonicalRole(before && before.role)) {
        throw Object.assign(new Error('Cannot change role'), { status: 403 });
      }
      if (payload.permissions !== undefined) ensurePermissionSubset(user, payload.permissions);
    }
    return payload;
  }
  if (role === 'store_manager' || role === 'store_staff' || role === 'operator') {
    if (!canAccessModule(user, resource).ok) throw Object.assign(new Error('Permission denied'), { status: 403 });
    if (before && !canAccessRecord(user, resource, before)) throw Object.assign(new Error('Permission denied'), { status: 403 });
    if (payload.storeId && !canAccessStore(user, payload.storeId)) {
      throw Object.assign(new Error('Cannot move record outside store scope'), { status: 403 });
    }
  }
  if (user && user.role === 'customer') {
    if (!['demands', 'appointments'].includes(resource)) throw Object.assign(new Error('Permission denied'), { status: 403 });
    return Object.assign({}, payload, { phone: user.phone });
  }
  if (user && user.role === 'ayi') {
    if (resource === 'ayis') return Object.assign({}, payload, { phone: user.phone });
    if (resource === 'applications') return Object.assign({}, payload, { ayiPhone: user.phone });
    throw Object.assign(new Error('Permission denied'), { status: 403 });
  }
  return payload;
}

function listFilterForUser(user, resource) {
  const role = canonicalRole(user && user.role);
  if (role === 'boss') return null;
  if (role === 'operator' || role === 'store_manager' || role === 'store_staff') {
    const scope = dataScope(user);
    if (scope.type === 'all') return null;
    if (scope.type === 'none') return { clause: '1 = 0', params: [] };
    if (resource === 'stores') return { clause: `id = ANY($1::int[])`, params: [scope.storeIds] };
    if (resource === 'ayis') return { clause: `store_id = ANY($1::int[])`, params: [scope.storeIds] };
    if (resource === 'accounts') return { clause: `store_id = ANY($1::int[])`, params: [scope.storeIds] };
    if (STORE_SCOPED_RESOURCES.has(resource)) return { clause: '1 = 0', params: [] };
    return null;
  }

  const phone = normalizePhone(user && user.phone);
  const profileId = String((user && user.relatedProfileId) || '');
  if (user && user.role === 'customer') {
    if (resource === 'demands' || resource === 'appointments') return { clause: 'phone = $1', params: [phone] };
    if (resource === 'orders') return { clause: 'customer_phone = $1', params: [phone] };
  }
  if (user && user.role === 'ayi') {
    if (resource === 'ayis') return { clause: '(id::text = $1 OR phone = $2)', params: [profileId, phone] };
    if (resource === 'applications') return { clause: 'ayi_phone = $1', params: [phone] };
    if (resource === 'appointments' || resource === 'orders' || resource === 'orderDispatches') {
      return { clause: 'ayi_phone = $1', params: [phone] };
    }
  }
  return { clause: '1 = 0', params: [] };
}

module.exports = {
  ACCOUNT_ROLE_ORDER,
  allowedResourcesForRole,
  allowedResourcesForUser,
  canAccessRecord,
  canAccessModule,
  canAccessResource,
  canAccessStore,
  canCreateRole,
  canManageAccountRecord,
  canUseBackstage,
  canonicalRole,
  dataScope,
  ensurePermissionSubset,
  isBackstageRole,
  isEnabledStatus,
  listFilterForUser,
  normalizePermissionList,
  normalizePermissionResource,
  scopePayloadForCreate,
  scopePayloadForUpdate,
  storeScopeIds,
  validateAccountCreate
};
