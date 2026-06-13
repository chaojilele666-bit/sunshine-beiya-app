const db = require('../db');

async function listServiceCategories() {
  const result = await db.query(`
    SELECT
      id::text AS id,
      code,
      name,
      description,
      sort_order AS "sortOrder",
      is_active AS "isActive",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM service_categories
    ORDER BY sort_order ASC, name ASC
  `);

  return result.rows;
}

async function listServiceItems() {
  const result = await db.query(`
    SELECT
      si.id::text AS id,
      si.category_id::text AS "categoryId",
      sc.code AS "categoryCode",
      sc.name AS "categoryName",
      si.code,
      si.name,
      si.unit,
      si.base_price_min AS "basePriceMin",
      si.base_price_max AS "basePriceMax",
      si.is_active AS "isActive",
      si.created_at AS "createdAt",
      si.updated_at AS "updatedAt"
    FROM service_items si
    JOIN service_categories sc ON sc.id = si.category_id
    ORDER BY sc.sort_order ASC, si.name ASC
  `);

  return result.rows;
}

async function getServiceCatalog() {
  const [categories, items] = await Promise.all([
    listServiceCategories(),
    listServiceItems()
  ]);

  return { categories, items };
}

module.exports = {
  getServiceCatalog,
  listServiceCategories,
  listServiceItems
};
