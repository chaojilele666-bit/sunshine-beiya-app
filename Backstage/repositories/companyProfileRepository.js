const db = require('../db');
const resourceRepository = require('./resourceRepository');

const DEFAULT_PROFILE = {
  id: 1,
  companyName: '北京阳光北亚家政',
  shortName: '阳光北亚',
  companyLogo: '',
  defaultCity: '',
  introduction: '北京阳光北亚家政提供家政、母婴、养老护理和保洁等家庭服务咨询与匹配。',
  customerServicePhone: '18611607087',
  address: '',
  businessHours: '09:00-18:00'
};

async function hasPublicProfileFields(client) {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'company_profile'
       AND column_name IN ('company_logo', 'default_city')`
  );
  const columns = new Set(result.rows.map((row) => row.column_name));
  return columns.has('company_logo') && columns.has('default_city');
}

function rowToProfile(row) {
  if (!row) return Object.assign({}, DEFAULT_PROFILE);
  return {
    id: row.id,
    companyName: row.company_name || '',
    shortName: row.short_name || '',
    companyLogo: row.company_logo || '',
    defaultCity: row.default_city || '',
    introduction: row.introduction || '',
    customerServicePhone: row.customer_service_phone || '',
    address: row.address || '',
    businessHours: row.business_hours || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function publicProfile(profile) {
  return {
    companyName: profile.companyName || '',
    shortName: profile.shortName || '',
    companyLogo: profile.companyLogo || '',
    defaultCity: profile.defaultCity || '',
    introduction: profile.introduction || '',
    customerServicePhone: profile.customerServicePhone || '',
    address: profile.address || '',
    businessHours: profile.businessHours || ''
  };
}

async function getProfile(client = db) {
  const result = await client.query('SELECT * FROM company_profile WHERE id = 1');
  return rowToProfile(result.rows[0]);
}

async function updateProfile(payload, actor) {
  return db.transaction(async (client) => {
    const before = await getProfile(client);
    const supportsPublicFields = await hasPublicProfileFields(client);
    const commonValues = [
      payload.companyName || '',
      payload.shortName || '',
      payload.introduction || '',
      payload.customerServicePhone || '',
      payload.address || '',
      payload.businessHours || ''
    ];
    const publicValues = [
      payload.companyLogo || '',
      payload.defaultCity || ''
    ];
    const sql = supportsPublicFields
      ? `INSERT INTO company_profile (
          id, company_name, short_name, company_logo, default_city, introduction, customer_service_phone, address, business_hours
        ) VALUES (1, $1, $2, $7, $8, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          short_name = EXCLUDED.short_name,
          company_logo = EXCLUDED.company_logo,
          default_city = EXCLUDED.default_city,
          introduction = EXCLUDED.introduction,
          customer_service_phone = EXCLUDED.customer_service_phone,
          address = EXCLUDED.address,
          business_hours = EXCLUDED.business_hours,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`
      : `INSERT INTO company_profile (
          id, company_name, short_name, introduction, customer_service_phone, address, business_hours
        ) VALUES (1, $1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          short_name = EXCLUDED.short_name,
          introduction = EXCLUDED.introduction,
          customer_service_phone = EXCLUDED.customer_service_phone,
          address = EXCLUDED.address,
          business_hours = EXCLUDED.business_hours,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`;
    const result = await client.query(
      sql,
      supportsPublicFields ? commonValues.concat(publicValues) : commonValues
    );
    const after = rowToProfile(result.rows[0]);
    await resourceRepository.writeAudit(client, 'update', 'companyProfile', 1, before, after, actor);
    return after;
  });
}

module.exports = {
  getProfile,
  publicProfile,
  updateProfile
};
