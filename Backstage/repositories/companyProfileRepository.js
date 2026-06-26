const db = require('../db');
const resourceRepository = require('./resourceRepository');

const DEFAULT_PROFILE = {
  id: 1,
  companyName: '北京阳光北亚家政',
  shortName: '阳光北亚',
  introduction: '北京阳光北亚家政提供家政、母婴、养老护理和保洁等家庭服务咨询与匹配。',
  customerServicePhone: '18611607087',
  address: '北京市东城区安定门外东河沿乙六号楼三层',
  businessHours: '09:00-18:00'
};

function rowToProfile(row) {
  if (!row) return Object.assign({}, DEFAULT_PROFILE);
  return {
    id: row.id,
    companyName: row.company_name || '',
    shortName: row.short_name || '',
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
    const result = await client.query(
      `INSERT INTO company_profile (
        id, company_name, short_name, introduction, customer_service_phone, address, business_hours
      ) VALUES (1, $1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        short_name = EXCLUDED.short_name,
        introduction = EXCLUDED.introduction,
        customer_service_phone = EXCLUDED.customer_service_phone,
        address = EXCLUDED.address,
        business_hours = EXCLUDED.business_hours
      RETURNING *`,
      [
        payload.companyName || '',
        payload.shortName || '',
        payload.introduction || '',
        payload.customerServicePhone || '',
        payload.address || '',
        payload.businessHours || ''
      ]
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
