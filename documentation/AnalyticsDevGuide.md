# Expand Analytics — Developer Guide

**Branch:** `feature/analytics-backend`  
**Last updated:** May 2026  
**Backend owner:** Karthik | **Frontend owner:** Sarita

---

## Overview

Admin-only analytics dashboard surfacing student engagement data at three levels: individual student, zipcode cluster, and platform-wide global. All endpoints are behind a JWT + role guard — only accounts with `role: "admin"` can access them.

---

## Architecture

No new service. Analytics routes extend the existing `middlewareNode` Express app and query the same MongoDB collections (`timeTrackings`, `users`, `activities`, `UserBadges`).

```
Browser  →  Apache (/api/ proxy)  →  middlewareNode:8000  →  MongoDB
                                         ↑
                                    adminGuard (JWT + role)
                                    analyticsLimiter (100 req/15 min)
```

---

## Auth Guard

**File:** `middlewareNode/src/middleware/adminGuard.js`

Uses Passport callback mode so HTTP responses are fully controlled:

| Condition | Status |
|---|---|
| Valid JWT, `role === "admin"` | next() — request proceeds |
| Valid JWT, any other role | 403 `{ error: "Forbidden: admin access required" }` |
| Missing / invalid / expired JWT | 401 `{ error: "Unauthorized" }` |
| Passport internal error | 500 `{ error: "Authentication error" }` |

---

## API Contracts

All endpoints require `Authorization: Bearer <JWT>` with an admin token.

### Individual Student

```
GET /api/analytics/students/search?keyword=X
→ [{ username, firstName, lastName, email }]   (max 50 results)

GET /api/analytics/student/:username?from=YYYY-MM-DD&to=YYYY-MM-DD
→ {
    profile: { username, firstName, lastName, email, zipcode, gender, gradeLevel, accountCreatedAt },
    stats:   { totalTimeHours, gameTimeHours, lessonTimeHours, puzzleTimeHours, mentorTimeHours,
               currentStreak, activitiesCompleted, badgesEarned }
  }

GET /api/analytics/student/:username/chart?months=6
→ { months: ["Nov","Dec",...], series: { gameTime, lessonTime, puzzleTime, mentorTime } }

GET /api/analytics/student/:username/events?skip=0&limit=20&from=&to=
→ { events: [{ eventType, eventName, startTime, totalTime }], hasMore: bool }
```

### Zipcode Aggregated

```
GET /api/analytics/zipcode?zipcode=30301&from=&to=
→ { zipcode, totalStudents, avgTotalTimeHours, avgGameTimeHours, avgLessonTimeHours,
    avgPuzzleTimeHours, avgStreakDays, globalAvgTotalTimeHours }

GET /api/analytics/zipcode/all?from=&to=
→ [{ zipcode, totalStudents, avgTotalTimeHours }]   (sorted by totalStudents desc)
```

### Global Aggregated

```
GET /api/analytics/global?from=&to=
→ { totalUsers, activeUsersInPeriod, totalHours,
    byEventType: { gameTime, lessonTime, puzzleTime, mentorTime },
    byGender:    { M: { count, avgHours }, F: { count, avgHours }, Other: {...} } }

GET /api/analytics/global/trend?months=6
→ { months: [...], activeUsers: [...], totalHours: [...] }
```

**Event type mapping:** `timeTracking.eventType = "play"` is exposed as `gameTime` in all responses.  
**Time units:** All durations are in **hours** (source data is seconds — divided by 3600).

---

## Input Validation

All endpoints with `from` / `to` query params validate date format and return:
```json
{ "error": "from must be a valid date (YYYY-MM-DD)" }   // HTTP 400
```

---

## Rate Limiting

`express-rate-limit` applied in `server.js` before `adminGuard`:
- **Window:** 15 minutes
- **Max requests:** 100 per IP
- **Response on breach:** `{ "error": "Too many requests, please try again later" }`

---

## Database Schema Changes

**File:** `middlewareNode/src/models/users.js`

Three fields added to the Users schema (nullable, default `null`):

```js
zipcode:    { type: String, default: null, index: true }
gender:     { type: String, enum: ["M", "F", "Other", null], default: null }
gradeLevel: { type: String, default: null }
```

Users can update their own demographics via:
```
PUT /user/profile   (JWT required)
Body: { zipcode?, gender?, gradeLevel? }
```

**Backfill existing users:**
```bash
node middlewareNode/src/scripts/migrateUserFields.js
```

---

## Performance — Indexes

`db.js` calls `ensureIndexes()` on every startup (idempotent):

| Collection | Index |
|---|---|
| `timeTrackings` | `{ username: 1, startTime: -1 }` |
| `timeTrackings` | `{ startTime: -1 }` |
| `timeTrackings` | `{ eventType: 1, startTime: -1 }` |
| `users` | `{ role: 1 }` |
| `users` | `{ zipcode: 1 }` |

---

## Nightly Summary Cron

**File:** `middlewareNode/src/scheduler/analyticsSummaryScheduler.js`

Runs daily at **02:00** and writes pre-computed documents to the `analyticsSummaries` collection:

```js
{ type: "global",  date: Date, data: { totalUsers, byEventType, byGender, ... } }
{ type: "zipcode", zipcode: "30301", date: Date, data: { avgTotalTimeHours, ... } }
```

Live analytics routes currently query MongoDB directly. The `analyticsSummaries` collection is available for future optimisation (cache the last nightly snapshot for the default dashboard load).

---

## Frontend Components

| File | Purpose |
|---|---|
| `src/Pages/Analytics/AnalyticsLayout.tsx` | Shell: tab bar, date filter, admin redirect |
| `src/Pages/Analytics/IndividualView.tsx` | Student search → detail flow |
| `src/Pages/Analytics/StudentDetailPanel.tsx` | 8 stat cards + profile demographics |
| `src/Pages/Analytics/StudentTimeChart.tsx` | Monthly line chart (Chart.js via StatsChart) |
| `src/Pages/Analytics/ActivityFeed.tsx` | Paginated event feed with load-more |
| `src/Pages/Analytics/ZipcodeView.tsx` | Sortable all-zipcodes table |
| `src/Pages/Analytics/ZipcodeDetailPanel.tsx` | Bar chart: zipcode vs. platform avg |
| `src/Pages/Analytics/GlobalView.tsx` | KPI cards + gender pie + activity bar |
| `src/Pages/Analytics/TrendChart.tsx` | Monthly active-users & hours trend |
| `src/core/hooks/useAnalyticsApi.ts` | Generic fetch hook with JWT auth |
| `src/components/Analytics/DateRangeFilter.tsx` | from/to date picker |
| `src/components/Analytics/LoadingSpinner.tsx` | Spinner for loading states |
| `src/components/Analytics/ErrorBanner.tsx` | Red banner for error states |

**Route:** `/analytics` (admin JWT required — redirected to `/login` otherwise)

---

## Provisioning an Admin Account

1. Create a user account via the normal signup flow.
2. Run the provisioning script:

```bash
cd middlewareNode
ADMIN_USERNAME=karthik node src/scripts/provisionAdmin.js
```

3. Log in with that account — the JWT will carry `role: "admin"` and the `/analytics` page will render.

---

## Running Tests

```bash
cd middlewareNode
npm test
```

**5 test suites, 50 tests:**

| Suite | Tests | Covers |
|---|---|---|
| `adminGuard.test.js` | 4 | JWT guard — all role/error paths |
| `analytics.individual.test.js` | 18 | Search, profile, chart, events endpoints |
| `analytics.aggregated.test.js` | 16 | Zipcode and global endpoints, validation |
| `analytics.security.test.js` | 6 | Real adminGuard — student/mentor/no-token/error |
| `analytics.edgecases.test.js` | 10 | Zero-activity student, null demographics, empty ranges |

---

## Local Development

```bash
# Backend
cd middlewareNode && npm start   # http://localhost:8000

# Frontend
cd react-ystemandchess && npm start   # http://localhost:3000

# Navigate to http://localhost:3000/analytics (admin JWT required)
```

### Docker (dev)

```bash
cd deploy/dev && docker-compose up --build
# Access at http://localhost
# /api/* proxied to middlewarenode:8000
```
