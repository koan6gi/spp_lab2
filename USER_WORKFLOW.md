# User Workflow & Security Architecture Guide

This document describes the end-to-end user workflows, role-based access control (RBAC), security mechanisms, and session management within the Minimalist Notes application.

---

## 1. Role-Based Access Control (RBAC) Matrix

The system enforces three distinct user roles:

| Feature / Action | `user` (Regular User) | `moderator` (Moderator) | `admin` (Administrator) |
| :--- | :---: | :---: | :---: |
| **Create Notes** | ✅ | ✅ | ✅ |
| **View Notes** | Own notes only | **All users' notes** | **All users' notes** |
| **Edit Notes** | Own notes only | Any note (content moderation) | Any note |
| **Delete Notes** | Own notes only | Any note (moderation) | Any note |
| **View Active Sessions** | Own sessions only | Own sessions only | Own sessions only |
| **Revoke Active Sessions** | Own sessions only | Own sessions only | Own & other users' sessions |
| **View All Users List** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ |
| **Change User Roles** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ |
| **Block / Unblock Users** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ |

---

## 2. Authentication & Temporary Key Lifecycle

Authentication is implemented using a dual-token temporary key model:

```
[ Client ]                                     [ Server / Database ]
    |                                                    |
    |---- 1. POST /api/auth/login ---------------------->| (Checks password hash, lockout status)
    |<--- 2. Returns Access Token (15m) + Refresh (7d) --| (Records session in `sessions` table)
    |                                                    |
    |---- 3. Requests with Bearer <AccessToken> -------->| (Validates JWT signature & expiry)
    |                                                    |
   === [ After 15 minutes: Access Token expires ] =======|
    |                                                    |
    |---- 4. Request returns 401 TOKEN_EXPIRED --------->|
    |---- 5. POST /api/auth/refresh (with RefreshToken)->| (Checks session valid in DB)
    |<--- 6. Returns fresh Access Token (15m) -----------| (Updates session last_active_at)
    |---- 7. Retries original request transparently ---->|
```

### Default Demo Accounts
For rapid evaluation, the database automatically seeds three accounts upon first start:
- **Administrator**: `admin@example.com` / `Password123!`
- **Moderator**: `moderator@example.com` / `Password123!`
- **Regular User**: `user@example.com` / `Password123!`

---

## 3. Security Workflows

### 3.1. Brute-Force Protection
1. **IP Rate Limiter**: The `/api/auth/*` endpoints allow a maximum of 20 requests per 15-minute window per IP. Exceeding this returns HTTP `429 Too Many Requests` with a `Retry-After` header.
2. **Account Lockout Mechanism**:
   - Each failed login increments `failed_login_attempts`.
   - On the **5th consecutive failure**, the account is locked for **15 minutes** (`lockout_until = NOW() + INTERVAL '15 minutes'`).
   - Any further attempt during the lockout period immediately returns `429 Too Many Requests` with `code: 'ACCOUNT_TEMPORARILY_LOCKED'` and remaining lockout time.
   - Successful login resets `failed_login_attempts` to 0.

### 3.2. Active Connection & Session Management
Users can audit and manage devices currently connected to their account:
1. Click **Sessions** in the top navigation bar to open the **Active Devices & Sessions** dialog.
2. The modal displays:
   - Device & Browser (User-Agent).
   - Client IP Address.
   - Last Active Timestamp.
   - "Current" badge on the active browser session.
3. Actions:
   - **Revoke Specific Session**: Invalidates the target session immediately. The remote device will receive HTTP 401 on its next action.
   - **Log Out All Other Devices**: Revokes all sessions belonging to the user except the current one.

### 3.3. Password Recovery via Email
When a user forgets their password:
1. In the Sign-In modal, select **Forgot Password** and submit the registered email address.
2. The server creates a cryptographically secure 32-byte hex token, hashes it, stores it in `password_resets` with a **15-minute expiration**, and dispatches an HTML email via SMTP.
3. **Mailpit Local Web UI**:
   - Open **`http://localhost:8025`** in your browser.
   - Inspect the incoming password reset message.
   - Click the **Reset Password** button (or copy the link with `?token=...`).
4. The application opens the **Set New Password** modal.
5. Upon saving:
   - Password is updated with bcrypt hashing.
   - The reset token is marked as used.
   - **All existing active sessions are revoked** across all devices to prevent unauthorized access.

---

## 4. Note Management Workflows by Role

### 4.1. Regular User (`user`)
1. **Create Note**: Enter title, optional text, and optional image (up to 20 MB). Submitting updates the UI reactively.
2. **View Notes**: Only notes created by the current user are visible.
3. **Edit / Delete**: Clicking a card opens the edit modal. Users can update title, text, replace the image, or detach the image. Notes can be deleted with a confirmation prompt.

### 4.2. Moderator (`moderator`)
1. **System-Wide View**: Can view all notes created by all users. Note cards display an **Author** badge (e.g., `Author: user@example.com`).
2. **Content Moderation**: Can edit or delete any note across the system to remove inappropriate content.
3. **Restriction**: Cannot access user management endpoints or change user roles.

### 4.3. Administrator (`admin`)
1. **Full Note Capabilities**: Can view, edit, and delete any note.
2. **User Management**:
   - Click the **Users** button in the navigation bar to open the **User Management & RBAC Roles** modal.
   - Change any user's role (`user`, `moderator`, `admin`) via dropdown.
   - **Block / Unblock Users**: Suspending a user immediately revokes all their active sessions and blocks them from making any further API requests (HTTP 403 `ACCOUNT_BLOCKED`).
   - Self-demotion and self-blocking are restricted to prevent lockout.

---

## 5. Interactive Swagger API Documentation

The backend includes interactive Swagger UI documentation:
- Accessible at: **`http://localhost:5000/api/docs`** (or via the **Swagger API** link in the navigation header).
- Features interactive endpoint testing, request schemas, status code descriptions, and Bearer token authorization.
