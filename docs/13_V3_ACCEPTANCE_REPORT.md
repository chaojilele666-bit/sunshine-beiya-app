# V3 Acceptance Report

Generated at: 2026-06-27T04:10:36.609Z
Branch: V3

## Summary

- Total tests: 35
- PASS: 35
- FAIL: 0
- Not run: 0
- Remaining P0: 0
- Remaining P1: 2
- Conclusion: Ready for WeChat manual acceptance

## Empty Database Migration

- V001-V008 are executed once on an isolated temporary database.
- V001-V008 are executed a second time on the same temporary database.
- Store duplicates and ayis.store_id foreign key integrity are checked.
- The temporary database is dropped in finally.

## Permission Matrix

| Role | Result |
| --- | --- |
| unauthenticated | Backstage API returns 401 |
| boss / management | Dashboard, company profile, and daily resources are accessible |
| operator | Company profile, dashboard, and account permissions return 403; daily resources are accessible |
| customer | Generic Backstage CRUD returns 403 |
| ayi | Generic Backstage CRUD returns 403 |

## Demand Matching

- Customer demand creation, wrong token rejection, and correct token detail read are checked.
- Backstage recommendation, duplicate 409, and downlisted ayi rejection are checked.
- Match listing, confirm, reject, cross-demand rejection, and repeated decision 409 are checked.
- State changes write audit_logs.

## Company Profile

- Company profile can be read, updated by boss, and restored.
- Operator cannot access or modify it.
- /api/miniprogram returns companyProfile.

## Service Center

- serviceModules include service and shortcut records.
- Disabling/restoring a service item affects /api/miniprogram.
- Updating/disabling/restoring a shortcut affects /api/miniprogram.

## Ayi Visibility

- visible=true certified ayi appears in public miniprogram data.
- visible=false ayi does not appear in public miniprogram data.
- Downlisted ayi cannot be newly recommended.

## Cleanup

- Test rows use the V3_ACCEPTANCE prefix.
- demands, demand_matches, ayis, service_modules, audit_logs, test accounts, and test sessions are cleaned in finally.
- The temporary database is dropped in finally.

## WeChat DevTools Manual Checklist

- Customer homepage showcase, shortcuts, service center display, and taps.
- Demand detail page after demand submission, recommended ayi list, confirm/reject actions.
- Service page, demand page, and ayi profile page service type options from Backstage.
- Ayi homepage, profile, certificates, application, and my applications pages.
- Store list, store detail, local HTTP image conversion, navigation, and phone actions.
- About page and mine page customer service phone from companyProfile.

## Remaining P0

- None.

## Remaining P1

- WeChat DevTools manual checks are still required for customer homepage, demand detail, service center, store images, and ayi pages.
- HTTPS, official WeChat login, production deployment, filing, and formal file service are not complete.

## Details

| # | Check | Result | Detail |
| --- | --- | --- | --- |
| 1 | 全仓 JS node --check | PASS | 34 JS files checked |
| 2 | JSON 解析 | PASS | 20 JSON files parsed |
| 3 | WXML 标签检查 | PASS | 13 WXML files checked |
| 4 | SQL UTF-8/BOM/乱码检查 | PASS | 11 SQL files checked |
| 5 | 常见乱码搜索 | PASS | 117 text files scanned |
| 6 | 敏感信息扫描 | PASS | 130 tracked/untracked candidates scanned |
| 7 | git diff --check | PASS | clean |
| 8 | git status --short | PASS | 76 changed/untracked entries |
| 9 | 临时数据库创建 | PASS | sunshine_beiya_v3_acceptance_1782533417875_bb5748 |
| 10 | V001-V008 空库首次迁移 | PASS | V001__init_core_business_schema.sql, V002__backstage_resource_tables.sql, V003__auth_and_permissions.sql, V004__store_detail_fields.sql, V005__demand_matches.sql, V006__service_center_fields.sql, V007__company_profile.sql, V008__service_shortcuts.sql |
| 11 | V001-V008 空库重复迁移 | PASS | V001__init_core_business_schema.sql, V002__backstage_resource_tables.sql, V003__auth_and_permissions.sql, V004__store_detail_fields.sql, V005__demand_matches.sql, V006__service_center_fields.sql, V007__company_profile.sql, V008__service_shortcuts.sql |
| 12 | 空库迁移后门店不重复 | PASS | 0 duplicate store names |
| 13 | ayis.store_id 外键完整 | PASS | all store_id values are valid or NULL |
| 14 | 当前数据库 V004-V008 重复迁移 | PASS | V004-V008 repeated on current database |
| 15 | API 健康检查 | PASS | database healthy |
| 16 | Prepare temporary acceptance accounts | PASS | temporary accounts created with random credentials |
| 17 | 测试账号登录 | PASS | boss/operator/customer/ayi login ok |
| 18 | 未登录后台接口 401 | PASS | /api/ayis requires login |
| 19 | boss 权限矩阵 | PASS | boss can access management resources |
| 20 | operator 权限矩阵 | PASS | operator denied management-only resources and can access daily resources |
| 21 | customer 后台通用 CRUD 被拒绝 | PASS | 6 resources rejected |
| 22 | ayi 后台通用 CRUD 被拒绝 | PASS | 6 resources rejected |
| 23 | 公司基础信息读取、修改、恢复 | PASS | company profile updated and restored |
| 24 | 小程序公开数据接口 | PASS | source=postgres, serviceModules=15 |
| 25 | 服务项目停用、恢复 | PASS | serviceModule=15 |
| 26 | 快捷入口修改、停用、恢复 | PASS | shortcut=11 |
| 27 | 创建并验证阿姨上架/下架 | PASS | ayi=113 |
| 28 | 客户提交需求和 token 校验 | PASS | demand=197 |
| 29 | 后台推荐、重复推荐409、下架阿姨不可推荐 | PASS | match=71 |
| 30 | 客户推荐列表、确认、重复操作409 | PASS | confirmed match=71 |
| 31 | 客户拒绝与跨需求操作被拒绝 | PASS | secondDemand=198 |
| 32 | audit_logs 写入 | PASS | 14 audit rows found before cleanup |
| 33 | 原有门店和图片接口回归 | PASS | stores=4, publicStores=4 |
| 34 | 测试数据清理 | PASS | V3 acceptance rows removed by prefix. |
| 35 | 临时数据库清理 | PASS | sunshine_beiya_v3_acceptance_1782533417875_bb5748 |
