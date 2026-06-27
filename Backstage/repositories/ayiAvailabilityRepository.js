const db = require('../db');
const resourceRepository = require('./resourceRepository');

const SERVICE_STATUSES = new Set(['available', 'working', 'leave', 'resting', 'unreachable']);
const FOLLOW_UP_STALE_DAYS = 7;

function toNumber(value, field) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    const error = new Error(`${field} must be a number`);
    error.status = 400;
    throw error;
  }
  return number;
}

function toDateString(value, field) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    const error = new Error(`${field} must be YYYY-MM-DD`);
    error.status = 400;
    throw error;
  }
  return text;
}

function rowDateToString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['true', '1', 'yes', 'on', '是', '上架', '接受'].includes(String(value).trim().toLowerCase());
}

function normalizeWeekdays(value) {
  const source = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [1, 2, 3, 4, 5, 6, 7] : String(value).split(',');
  const weekdays = [...new Set(source.map((item) => Number(item)).filter((item) => Number.isInteger(item)))].sort((a, b) => a - b);
  if (!weekdays.length || weekdays.some((item) => item < 1 || item > 7)) {
    const error = new Error('serviceWeekdays must contain values from 1 to 7');
    error.status = 400;
    throw error;
  }
  return weekdays;
}

function normalizeStringArray(value, allowed, field) {
  const source = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : String(value).split(',');
  const items = [...new Set(source.map((item) => String(item || '').trim()).filter(Boolean))];
  if (allowed && items.some((item) => !allowed.has(item))) {
    const error = new Error(`${field} contains invalid value`);
    error.status = 400;
    throw error;
  }
  return items;
}

function requireBackstageActor(actor) {
  if (!actor) {
    const error = new Error('Authentication required');
    error.status = 401;
    throw error;
  }
  if (!['boss', 'operator'].includes(actor.role)) {
    const error = new Error('Permission denied');
    error.status = 403;
    throw error;
  }
}

function isCertified(status) {
  return ['已认证', 'approved'].includes(status);
}

function normalizeAvailability(row = {}) {
  const availableFrom = rowDateToString(row.available_from);
  const availableTo = rowDateToString(row.available_to);
  return {
    ayiId: row.ayi_id,
    serviceStatus: row.service_status || 'available',
    availableFrom,
    availableTo,
    longTermAvailable: row.long_term_available !== false,
    serviceWeekdays: row.service_weekdays || [1, 2, 3, 4, 5, 6, 7],
    serviceTimeSlots: row.service_time_slots || ['day'],
    scheduleNote: row.schedule_note || '',
    statusConfirmedAt: row.status_confirmed_at,
    statusUpdatedBy: row.status_updated_by,
    scheduleNeedsConfirmation: row.status_confirmed_at
      ? (Date.now() - new Date(row.status_confirmed_at).getTime()) > FOLLOW_UP_STALE_DAYS * 24 * 60 * 60 * 1000
      : true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePreferences(row = {}) {
  const earliestStartDate = rowDateToString(row.earliest_start_date);
  return {
    ayiId: row.ayi_id,
    acceptLiveIn: row.accept_live_in === true,
    acceptDayShift: row.accept_day_shift !== false,
    acceptNightShift: row.accept_night_shift === true,
    acceptLongTerm: row.accept_long_term !== false,
    acceptTemporary: row.accept_temporary !== false,
    minSalary: row.min_salary === null || row.min_salary === undefined ? null : Number(row.min_salary),
    maxSalary: row.max_salary === null || row.max_salary === undefined ? null : Number(row.max_salary),
    earliestStartDate,
    note: row.note || '',
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeAyi(row = {}) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    serviceType: row.service_type,
    status: row.status,
    visible: row.visible !== false,
    liveType: row.live_type,
    salary: row.salary
  };
}

function normalizeHistory(row) {
  return {
    id: row.id,
    ayiId: row.ayi_id,
    changedBy: row.changed_by,
    changedByName: row.changed_by_name || '',
    changeType: row.change_type,
    beforeData: row.before_data,
    afterData: row.after_data,
    createdAt: row.created_at
  };
}

async function getAyiForUpdate(client, ayiId) {
  const result = await client.query('SELECT * FROM ayis WHERE id = $1 FOR UPDATE', [Number(ayiId)]);
  const ayi = result.rows[0];
  if (!ayi) {
    const error = new Error('Ayi not found');
    error.status = 404;
    throw error;
  }
  return ayi;
}

async function getAyi(client, ayiId) {
  const result = await client.query('SELECT * FROM ayis WHERE id = $1', [Number(ayiId)]);
  return result.rows[0] || null;
}

async function ensureBaseRows(client, ayiId) {
  await client.query(
    `INSERT INTO ayi_availability (ayi_id, service_status, available_from, long_term_available, status_confirmed_at)
     VALUES ($1, 'available', CURRENT_DATE, true, now())
     ON CONFLICT (ayi_id) DO NOTHING`,
    [Number(ayiId)]
  );
  await client.query(
    `INSERT INTO ayi_service_preferences (ayi_id, earliest_start_date)
     VALUES ($1, CURRENT_DATE)
     ON CONFLICT (ayi_id) DO NOTHING`,
    [Number(ayiId)]
  );
}

async function getProfile(ayiId, client = db) {
  await ensureBaseRows(client, ayiId);
  const [ayiResult, availabilityResult, preferenceResult, regionsResult, typesResult] = await Promise.all([
    client.query('SELECT * FROM ayis WHERE id = $1', [Number(ayiId)]),
    client.query('SELECT * FROM ayi_availability WHERE ayi_id = $1', [Number(ayiId)]),
    client.query('SELECT * FROM ayi_service_preferences WHERE ayi_id = $1', [Number(ayiId)]),
    client.query('SELECT region FROM ayi_service_regions WHERE ayi_id = $1 ORDER BY region ASC', [Number(ayiId)]),
    client.query(
      `SELECT ast.service_module_id, sm.title
       FROM ayi_service_types ast
       JOIN service_modules sm ON sm.id = ast.service_module_id
       WHERE ast.ayi_id = $1
       ORDER BY sm.sort ASC, sm.id ASC`,
      [Number(ayiId)]
    )
  ]);
  const ayi = ayiResult.rows[0];
  if (!ayi) {
    const error = new Error('Ayi not found');
    error.status = 404;
    throw error;
  }
  return {
    ayi: normalizeAyi(ayi),
    availability: normalizeAvailability(availabilityResult.rows[0]),
    preferences: normalizePreferences(preferenceResult.rows[0]),
    regions: regionsResult.rows.map((row) => row.region),
    serviceTypes: typesResult.rows.map((row) => ({ id: row.service_module_id, title: row.title })),
    recommendation: await checkRecommendable(ayiId, {}, client)
  };
}

async function writeHistory(client, ayiId, changeType, beforeData, afterData, actor) {
  const actorId = actor && actor.id ? Number(actor.id) : null;
  const result = await client.query(
    `INSERT INTO ayi_status_history (ayi_id, changed_by, change_type, before_data, after_data)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [Number(ayiId), actorId, changeType, beforeData || null, afterData || null]
  );
  await resourceRepository.writeAudit(client, changeType, 'ayiAvailability', Number(ayiId), beforeData || null, afterData || null, actor);
  return result.rows[0];
}

function validateAvailabilityPayload(payload) {
  const serviceStatus = payload.serviceStatus || payload.service_status || 'available';
  if (!SERVICE_STATUSES.has(serviceStatus)) {
    const error = new Error('Unknown service status');
    error.status = 400;
    throw error;
  }
  const availableFrom = toDateString(payload.availableFrom ?? payload.available_from, 'availableFrom');
  const availableTo = toDateString(payload.availableTo ?? payload.available_to, 'availableTo');
  if (availableFrom && availableTo && availableFrom > availableTo) {
    const error = new Error('availableFrom cannot be later than availableTo');
    error.status = 400;
    throw error;
  }
  const serviceWeekdays = normalizeWeekdays(payload.serviceWeekdays ?? payload.service_weekdays);
  const serviceTimeSlots = normalizeStringArray(
    payload.serviceTimeSlots ?? payload.service_time_slots,
    new Set(['day', 'night', 'live_in', 'temporary', 'long_term']),
    'serviceTimeSlots'
  );
  if (!serviceTimeSlots.length) {
    const error = new Error('serviceTimeSlots is required');
    error.status = 400;
    throw error;
  }
  return {
    serviceStatus,
    availableFrom,
    availableTo,
    longTermAvailable: toBoolean(payload.longTermAvailable ?? payload.long_term_available, true),
    serviceWeekdays,
    serviceTimeSlots,
    scheduleNote: String(payload.scheduleNote ?? payload.schedule_note ?? '').slice(0, 1000)
  };
}

function validatePreferencesPayload(payload) {
  const minSalary = toNumber(payload.minSalary ?? payload.min_salary, 'minSalary');
  const maxSalary = toNumber(payload.maxSalary ?? payload.max_salary, 'maxSalary');
  if (minSalary !== null && minSalary < 0) {
    const error = new Error('minSalary must be non-negative');
    error.status = 400;
    throw error;
  }
  if (maxSalary !== null && maxSalary < 0) {
    const error = new Error('maxSalary must be non-negative');
    error.status = 400;
    throw error;
  }
  if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
    const error = new Error('minSalary cannot be greater than maxSalary');
    error.status = 400;
    throw error;
  }
  return {
    acceptLiveIn: toBoolean(payload.acceptLiveIn ?? payload.accept_live_in, false),
    acceptDayShift: toBoolean(payload.acceptDayShift ?? payload.accept_day_shift, true),
    acceptNightShift: toBoolean(payload.acceptNightShift ?? payload.accept_night_shift, false),
    acceptLongTerm: toBoolean(payload.acceptLongTerm ?? payload.accept_long_term, true),
    acceptTemporary: toBoolean(payload.acceptTemporary ?? payload.accept_temporary, true),
    minSalary,
    maxSalary,
    earliestStartDate: toDateString(payload.earliestStartDate ?? payload.earliest_start_date, 'earliestStartDate'),
    note: String(payload.note || '').slice(0, 1000)
  };
}

async function updateAvailability(ayiId, payload, actor) {
  requireBackstageActor(actor);
  const data = validateAvailabilityPayload(payload || {});
  return db.transaction(async (client) => {
    await getAyiForUpdate(client, ayiId);
    await ensureBaseRows(client, ayiId);
    const beforeResult = await client.query('SELECT * FROM ayi_availability WHERE ayi_id = $1', [Number(ayiId)]);
    const before = normalizeAvailability(beforeResult.rows[0]);
    const result = await client.query(
      `UPDATE ayi_availability
       SET service_status = $2,
           available_from = $3,
           available_to = $4,
           long_term_available = $5,
           service_weekdays = $6,
           service_time_slots = $7,
           schedule_note = $8,
           status_confirmed_at = now(),
           status_updated_by = $9
       WHERE ayi_id = $1
       RETURNING *`,
      [
        Number(ayiId),
        data.serviceStatus,
        data.availableFrom,
        data.availableTo,
        data.longTermAvailable,
        data.serviceWeekdays,
        data.serviceTimeSlots,
        data.scheduleNote,
        actor.id || null
      ]
    );
    const after = normalizeAvailability(result.rows[0]);
    await writeHistory(client, ayiId, data.serviceStatus !== before.serviceStatus ? 'service_status' : 'availability', before, after, actor);
    return getProfile(ayiId, client);
  });
}

async function updatePreferences(ayiId, payload, actor) {
  requireBackstageActor(actor);
  const preferences = validatePreferencesPayload(payload || {});
  const regions = normalizeStringArray(payload.regions, null, 'regions').slice(0, 30);
  const serviceTypeIds = normalizeStringArray(payload.serviceTypeIds || payload.service_type_ids, null, 'serviceTypeIds')
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  return db.transaction(async (client) => {
    await getAyiForUpdate(client, ayiId);
    await ensureBaseRows(client, ayiId);
    const before = await getProfile(ayiId, client);

    const validServiceIds = serviceTypeIds.length
      ? await client.query(
        `SELECT id FROM service_modules WHERE id = ANY($1::int[]) AND module_type = 'service' AND visible IS NOT FALSE`,
        [serviceTypeIds]
      )
      : { rows: [] };
    const validSet = new Set(validServiceIds.rows.map((row) => Number(row.id)));
    if (serviceTypeIds.some((id) => !validSet.has(id))) {
      const error = new Error('serviceTypeIds contain unavailable service');
      error.status = 400;
      throw error;
    }

    await client.query(
      `UPDATE ayi_service_preferences
       SET accept_live_in = $2,
           accept_day_shift = $3,
           accept_night_shift = $4,
           accept_long_term = $5,
           accept_temporary = $6,
           min_salary = $7,
           max_salary = $8,
           earliest_start_date = $9,
           note = $10,
           updated_by = $11
       WHERE ayi_id = $1`,
      [
        Number(ayiId),
        preferences.acceptLiveIn,
        preferences.acceptDayShift,
        preferences.acceptNightShift,
        preferences.acceptLongTerm,
        preferences.acceptTemporary,
        preferences.minSalary,
        preferences.maxSalary,
        preferences.earliestStartDate,
        preferences.note,
        actor.id || null
      ]
    );

    await client.query('DELETE FROM ayi_service_regions WHERE ayi_id = $1', [Number(ayiId)]);
    for (const region of regions) {
      await client.query(
        'INSERT INTO ayi_service_regions (ayi_id, region) VALUES ($1,$2) ON CONFLICT (ayi_id, region) DO NOTHING',
        [Number(ayiId), region]
      );
    }

    await client.query('DELETE FROM ayi_service_types WHERE ayi_id = $1', [Number(ayiId)]);
    for (const serviceModuleId of serviceTypeIds) {
      await client.query(
        'INSERT INTO ayi_service_types (ayi_id, service_module_id) VALUES ($1,$2) ON CONFLICT (ayi_id, service_module_id) DO NOTHING',
        [Number(ayiId), serviceModuleId]
      );
    }

    const after = await getProfile(ayiId, client);
    await writeHistory(client, ayiId, 'preferences', before, after, actor);
    return after;
  });
}

async function listHistory(ayiId, actor) {
  requireBackstageActor(actor);
  const result = await db.query(
    `SELECT h.*, u.display_name AS changed_by_name
     FROM ayi_status_history h
     LEFT JOIN user_accounts u ON u.id = h.changed_by
     WHERE h.ayi_id = $1
     ORDER BY h.created_at DESC, h.id DESC
     LIMIT 100`,
    [Number(ayiId)]
  );
  return result.rows.map(normalizeHistory);
}

async function checkRecommendable(ayiId, demand = {}, client = db) {
  const profile = await buildEligibilityProfile(ayiId, client);
  return evaluateEligibility(profile, demand);
}

async function buildEligibilityProfile(ayiId, client = db) {
  await ensureBaseRows(client, ayiId);
  const [ayiResult, availabilityResult, preferenceResult, regionsResult, typeResult] = await Promise.all([
    client.query('SELECT * FROM ayis WHERE id = $1', [Number(ayiId)]),
    client.query('SELECT * FROM ayi_availability WHERE ayi_id = $1', [Number(ayiId)]),
    client.query('SELECT * FROM ayi_service_preferences WHERE ayi_id = $1', [Number(ayiId)]),
    client.query('SELECT region FROM ayi_service_regions WHERE ayi_id = $1', [Number(ayiId)]),
    client.query(
      `SELECT sm.id, sm.title
       FROM ayi_service_types ast
       JOIN service_modules sm ON sm.id = ast.service_module_id
       WHERE ast.ayi_id = $1`,
      [Number(ayiId)]
    )
  ]);
  return {
    ayi: ayiResult.rows[0],
    availability: normalizeAvailability(availabilityResult.rows[0]),
    preferences: normalizePreferences(preferenceResult.rows[0]),
    regions: regionsResult.rows.map((row) => row.region),
    serviceTypes: typeResult.rows.map((row) => row.title)
  };
}

function demandNeedsLiveIn(demand = {}) {
  const text = [demand.liveType, demand.live_type, demand.familyInfo, demand.family_info, demand.note, demand.followNote, demand.follow_note]
    .filter(Boolean)
    .join(' ');
  return /住家|live.?in/i.test(text);
}

function evaluateEligibility(profile, demand = {}) {
  const reasons = [];
  const today = new Date().toISOString().slice(0, 10);
  const ayi = profile.ayi || {};
  const availability = profile.availability || {};
  const preferences = profile.preferences || {};

  if (ayi.visible === false) reasons.push('暂时下架');
  if (!isCertified(ayi.status)) reasons.push('待审核或认证未通过');
  if (availability.serviceStatus !== 'available') {
    const statusReason = {
      working: '当前服务中',
      leave: '请假中',
      resting: '暂停接单',
      unreachable: '暂时无法联系'
    }[availability.serviceStatus] || '未知服务状态';
    reasons.push(statusReason);
  }
  if (availability.availableTo && availability.availableTo < today) reasons.push('档期已过期');
  if (demand.serviceType || demand.service_type) {
    const serviceType = demand.serviceType || demand.service_type;
    const accepted = new Set(profile.serviceTypes || []);
    if (accepted.size && !accepted.has(serviceType) && ayi.service_type !== serviceType) {
      reasons.push('服务类型不匹配');
    }
  }
  if (demandNeedsLiveIn(demand) && preferences.acceptLiveIn === false) reasons.push('不接受住家');

  return {
    recommendable: reasons.length === 0,
    reasons
  };
}

async function listCandidates(filters = {}, actor) {
  requireBackstageActor(actor);
  const page = Math.max(1, Number(filters.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(filters.pageSize || 20)));
  const offset = (page - 1) * pageSize;
  const params = [];
  const where = [
    `a.visible IS NOT FALSE`,
    `a.status IN ('已认证', 'approved')`,
    `av.service_status = 'available'`,
    `(av.available_to IS NULL OR av.available_to >= CURRENT_DATE)`
  ];

  if (filters.serviceType) {
    params.push(filters.serviceType);
    where.push(`(a.service_type = $${params.length} OR EXISTS (
      SELECT 1 FROM ayi_service_types ast
      JOIN service_modules sm ON sm.id = ast.service_module_id
      WHERE ast.ayi_id = a.id AND sm.title = $${params.length}
    ))`);
  }
  if (filters.region) {
    params.push(filters.region);
    where.push(`EXISTS (SELECT 1 FROM ayi_service_regions ar WHERE ar.ayi_id = a.id AND ar.region ILIKE '%' || $${params.length} || '%')`);
  }
  if (filters.liveIn !== undefined && String(filters.liveIn) !== '') {
    params.push(toBoolean(filters.liveIn, false));
    where.push(`pref.accept_live_in = $${params.length}`);
  }
  if (filters.keyword) {
    params.push(String(filters.keyword));
    where.push(`(a.name ILIKE '%' || $${params.length} || '%' OR a.phone ILIKE '%' || $${params.length} || '%' OR a.service_type ILIKE '%' || $${params.length} || '%')`);
  }

  const query = `
    FROM ayis a
    JOIN ayi_availability av ON av.ayi_id = a.id
    JOIN ayi_service_preferences pref ON pref.ayi_id = a.id
    WHERE ${where.join(' AND ')}
  `;
  const countResult = await db.query(`SELECT count(*)::integer AS count ${query}`, params);
  const result = await db.query(
    `SELECT a.id, a.name, a.phone, a.service_type, a.status, a.visible,
            av.service_status, av.available_from, av.available_to, av.status_confirmed_at,
            pref.min_salary, pref.max_salary
     ${query}
     ORDER BY av.status_confirmed_at DESC NULLS LAST, a.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    params.concat([pageSize, offset])
  );
  return {
    page,
    pageSize,
    total: countResult.rows[0].count,
    items: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      serviceType: row.service_type,
      serviceStatus: row.service_status,
      availableFrom: row.available_from,
      availableTo: row.available_to,
      statusConfirmedAt: row.status_confirmed_at,
      minSalary: row.min_salary === null ? null : Number(row.min_salary),
      maxSalary: row.max_salary === null ? null : Number(row.max_salary)
    }))
  };
}

module.exports = {
  SERVICE_STATUSES,
  checkRecommendable,
  evaluateEligibility,
  getProfile,
  listCandidates,
  listHistory,
  updateAvailability,
  updatePreferences
};
