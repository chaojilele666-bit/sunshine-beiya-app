# Auth and Permissions

## Account Model

Authentication uses `user_accounts` as the unified login table.

Important fields:

- `username`
- `phone`
- `password_hash`
- `role`: `customer`, `ayi`, `operator`, `boss`
- `related_profile_type`: `customers`, `ayis`, or `backstage_accounts`
- `related_profile_id`
- `status`: `active`, `disabled`, `locked`
- `wechat_openid`
- `wechat_unionid`
- `failed_login_count`
- `locked_until`
- `last_login_at`

Sessions use `auth_sessions`. The browser receives a random token, while PostgreSQL stores only a SHA-256 token hash and an expiry time.

Passwords are hashed with `bcryptjs`. Do not store plaintext passwords.

## Login Flow

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

The backend accepts username or phone plus password. Successful login returns:

- `token`
- `expiresAt`
- safe `user` fields

The frontend sends:

```text
Authorization: Bearer <token>
```

`password_hash` is never returned.

## Permission Matrix

| Role | Permissions |
| --- | --- |
| `customer` | Can view and modify own customer-side demands and appointments. Can view own orders. Cannot access backstage management. |
| `ayi` | Can view and modify own ayi profile. Can view public/open demands and own applications, appointments, dispatches, and orders. Cannot access backstage management. |
| `operator` | Can manage ayis, demands, appointments, applications, orders, dispatches, stores, service modules, and banners. Cannot manage boss accounts or boss-only dashboard/audit logs. |
| `boss` | Can access all backstage business data, dashboard, accounts, roles, and audit logs. |

Backend permission checks are based on the session token. The frontend menu is only a convenience layer and is not the security boundary.

## Local Test Accounts

Create local test accounts with environment variables. Do not commit real passwords.

PowerShell example:

```powershell
$env:AUTH_TEST_PASSWORD="<local-only-password-at-least-8-chars>"
cd Backstage
npm run auth:create-test-accounts
Remove-Item Env:\AUTH_TEST_PASSWORD
```

The script creates or updates:

- `boss.local`
- `operator.local`
- `customer.local`
- `ayi.local`

You may also set role-specific passwords:

- `BOSS_TEST_PASSWORD`
- `OPERATOR_TEST_PASSWORD`
- `CUSTOMER_TEST_PASSWORD`
- `AYI_TEST_PASSWORD`

## Current Limits

- WeChat login is not connected yet.
- `wechat_openid` and `wechat_unionid` are reserved fields.
- Customer and ayi mini program pages are not redesigned in this phase.
- Current session token storage is localStorage for the MVP backstage. A production deployment should review token storage, HTTPS-only deployment, CSRF posture, rate limiting, and server-side audit policy.
- No online payment capability is added in this phase.
