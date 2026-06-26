# V3 Acceptance Report

Generated at: 2026-06-26T10:20:57.973Z
Branch: V3

## Summary

- Total tests: 35
- PASS: 35
- FAIL: 0
- Not run: 0
- Remaining P0: 0
- Remaining P1: 1
- Conclusion: Ready for V3 pull request and WeChat manual acceptance has passed

## Automated Acceptance

The final automated acceptance was executed with `Backstage/scripts/runV3Acceptance.js` after recording manual acceptance.

Validated areas:

- Full JS syntax check.
- JSON parsing.
- WXML tag balance.
- SQL UTF-8 and BOM scan.
- Common mojibake marker scan.
- Sensitive literal scan.
- `git diff --check`.
- V001-V008 first migration on an isolated temporary database.
- V001-V008 repeated migration on the same temporary database.
- Current database repeated migration for V004-V008.
- Permission matrix for unauthenticated, boss, operator, customer, and ayi identities.
- Company profile read, update, and restore.
- Service module disable and restore.
- Shortcut update, disable, and restore.
- Ayi visible/downlisted behavior.
- Customer demand token flow.
- Demand recommendation, duplicate recommendation handling, confirm, reject, cross-demand rejection, and repeat decision handling.
- audit_logs write checks.
- Store and image API regression.
- Test data cleanup.
- Temporary database cleanup.

## Empty Database Migration Result

- V001-V008 first execution: PASS.
- V001-V008 repeated execution: PASS.
- Duplicate stores after migration: 0.
- `ayis.store_id`: valid store ID or NULL.
- Temporary database cleanup: PASS.

## Permission Matrix

| Identity | Expected result | Status |
| --- | --- | --- |
| Unauthenticated | Backstage protected API returns 401 | PASS |
| Management `boss` | Dashboard, company profile, daily management resources return 200 | PASS |
| Operator `operator` | Company profile, dashboard, account permissions return 403; authorized daily resources return 200 | PASS |
| Customer `customer` | Generic Backstage CRUD APIs return 403 | PASS |
| Ayi `ayi` | Generic Backstage CRUD APIs return 403 | PASS |

## Demand Matching Result

- Customer demand creation: PASS.
- Demand access token hash validation: PASS.
- Wrong token rejected: PASS.
- Backstage recommendation: PASS.
- Duplicate recommendation returns 409: PASS.
- Downlisted ayi cannot be newly recommended: PASS.
- Customer match list: PASS.
- Customer confirm: PASS.
- Customer reject: PASS.
- Cross-demand operation rejected: PASS.
- Repeat decision returns 409: PASS.
- audit_logs written: PASS.

## Company Profile Result

- Management account can read, update, and restore company profile: PASS.
- Operator cannot access or update company profile: PASS.
- `/api/miniprogram` returns `companyProfile`: PASS.

## Service Center Result

- `serviceModules` contains `service` and `shortcut` records: PASS.
- Disabling/restoring a service item affects `/api/miniprogram`: PASS.
- Updating/disabling/restoring a shortcut affects `/api/miniprogram`: PASS.

## Ayi Visibility Result

- `visible=true` certified ayi appears in public miniprogram data: PASS.
- `visible=false` ayi does not appear in public miniprogram data: PASS.
- Downlisted ayi cannot be newly recommended: PASS.

## WeChat Manual Acceptance

Manual acceptance has been completed and passed for the following items.

### Customer Side

- Homepage carousel displays correctly.
- Shortcut title, sorting, icon, and navigation are correct.
- Customer service phone is read from company profile configuration.
- Service center display and navigation are correct.
- Service filters synchronize with Backstage service items.
- Ayi list and ayi detail pages display correctly.
- Demand submission works correctly.
- Backstage ayi recommendation works correctly.
- Customer confirm and reject actions work correctly.
- My demands can be reopened.
- Store image, phone, navigation, and detail pages work correctly.
- About/company information matches Backstage content.

### Ayi Side

- Ayi homepage displays correctly.
- Customer shortcuts are not shown on the ayi side.
- Ayi profile form and save flow work correctly.
- Service type options are read from Backstage service items.
- Work opportunities display correctly.
- Job application flow works correctly.
- My applications page works correctly.
- Mine page and customer service entry work correctly.

### Backstage Synchronization

- Company profile updates synchronize to the miniprogram.
- Service enable/disable updates synchronize to the miniprogram.
- Shortcut edits, sorting, enable/disable updates synchronize to the miniprogram.
- Ayi visible/downlisted changes take effect.
- Homepage carousel updates synchronize to the miniprogram.

## Cleanup Result

- Temporary acceptance accounts: cleaned.
- Temporary sessions: cleaned.
- Temporary demands: cleaned.
- Temporary demand matches: cleaned.
- Temporary ayis: cleaned.
- Temporary service modules: cleaned.
- Temporary acceptance database: deleted.

## Remaining P0

- None.

## Remaining P1

- HTTPS, official WeChat login, production deployment, filing, and formal file service are not complete. These are outside the V3 local acceptance scope.

## Final Conclusion

V3 is ready to be packaged into commits, pushed to the `V3` branch, and opened as a pull request to `main` for review. It is not a production deployment approval.
