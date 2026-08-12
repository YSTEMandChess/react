# Analytics API — Developer Reference

**Base path (via Apache proxy):** `/api/analytics/*`  
**Direct backend:** `http://localhost:8000/analytics/*`  
**Last updated:** 2026-06-18  
**Backend:** `middlewareNode/src/routes/analytics.js`

---

## Authentication

Every analytics endpoint requires a valid admin JWT.

**Header required on all requests:**
```
Authorization: Bearer <JWT>
```

The request passes through `analyticsLimiter` → `adminGuard` before hitting any route handler.

### adminGuard responses

| Condition | Status | Body |
|---|---|---|
| Valid JWT, `role === "admin"` | — | proceeds to handler |
| Valid JWT, non-admin role | 403 | `{ "error": "Forbidden: admin access required" }` |
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized" }` |
| Passport internal error | 500 | `{ "error": "Authentication error" }` |

**File:** `middlewareNode/src/middleware/adminGuard.js`

### Rate limit

100 requests per IP per 15-minute window. Breach returns HTTP 429:
```json
{ "error": "Too many requests, please try again later" }
```

---

## Common conventions

### Date range parameters

All aggregation endpoints accept optional `from` and `to` query params.

| Param | Format | Behavior when omitted |
|---|---|---|
| `from` | `YYYY-MM-DD` | No lower bound — all-time |
| `to` | `YYYY-MM-DD` | No upper bound — through now |

Invalid format returns HTTP 400:
```json
{ "error": "from must be a valid date (YYYY-MM-DD)" }
```

### Time units

All durations in responses are in **hours**, rounded to 2 decimal places.  
Source data in `timeTrackings` is stored in **seconds** (`totalTime` field).

### Event type mapping

| `timeTracking.eventType` | Response key |
|---|---|
| `play` | `gameTime` / `gameTimeHours` |
| `lesson` | `lessonTime` / `lessonTimeHours` |
| `puzzle` | `puzzleTime` / `puzzleTimeHours` |
| `mentor` | `mentorTime` / `mentorTimeHours` |
| `website` | excluded from all analytics queries |

---

## Endpoints

### 1 — Student search

```
GET /api/analytics/students/search?keyword=<string>
```

Case-insensitive substring match against `username`, `firstName`, `lastName`. Role filter: `student` only. Max 50 results.

**Query params**

| Param | Required | Description |
|---|---|---|
| `keyword` | Yes | Search term (min 1 non-whitespace character) |

**Success — 200**
```json
[
  {
    "username": "alice",
    "firstName": "Alice",
    "lastName": "Student",
    "email": "alice@test.com"
  }
]
```

**Error — 400**
```json
{ "error": "keyword is required" }
```

---

### 2 — Student profile & stats

```
GET /api/analytics/student/:username?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns the student's full profile and engagement stats. Stats are filtered by the date range when provided.

**Path params**

| Param | Description |
|---|---|
| `username` | Exact username of the student |

**Success — 200**
```json
{
  "profile": {
    "username": "alice",
    "firstName": "Alice",
    "lastName": "Student",
    "email": "alice@test.com",
    "zipcode": "75001",
    "gender": "F",
    "gradeLevel": "7",
    "accountCreatedAt": "2026-01-15"
  },
  "stats": {
    "totalTimeHours": 30.0,
    "gameTimeHours": 7.0,
    "lessonTimeHours": 10.0,
    "puzzleTimeHours": 8.0,
    "mentorTimeHours": 5.0,
    "currentStreak": 3,
    "activitiesCompleted": 12,
    "badgesEarned": 4
  }
}
```

`currentStreak` — consecutive days with both a `lesson` and `puzzle` event (not filtered by date range; always computed from full history).  
`activitiesCompleted` — count of `completedDates` in the `activities` collection, filtered by date range.  
`badgesEarned` — count of entries in `UserBadges.earned` (not filtered by date range).

**Errors**

| Status | Body |
|---|---|
| 400 | `{ "error": "from must be a valid date (YYYY-MM-DD)" }` |
| 404 | `{ "error": "Student not found" }` |

---

### 3 — Student monthly chart

```
GET /api/analytics/student/:username/chart?months=6
```

Monthly time breakdown across the last N months. Used to render the student activity line chart.

**Query params**

| Param | Default | Max |
|---|---|---|
| `months` | 6 | 24 |

**Success — 200**
```json
{
  "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "series": {
    "gameTime":   [2.5, 3.0, 0.0, 4.5, 1.0, 2.0],
    "lessonTime": [1.0, 2.5, 3.0, 2.0, 4.0, 1.5],
    "puzzleTime": [0.5, 1.0, 2.0, 1.5, 2.5, 1.0],
    "mentorTime": [0.0, 0.5, 1.0, 0.5, 1.0, 0.5]
  }
}
```

Each array has exactly `months` entries in chronological order (oldest first). Months with no activity have `0.0`.

---

### 4 — Student activity feed

```
GET /api/analytics/student/:username/events?skip=0&limit=20&from=YYYY-MM-DD&to=YYYY-MM-DD
```

Paginated list of time-tracking events for one student, sorted newest first. Excludes `website` events.

**Query params**

| Param | Default | Max | Description |
|---|---|---|---|
| `skip` | 0 | — | Number of records to skip (for pagination) |
| `limit` | 20 | 100 | Records to return per page |
| `from` | — | — | Lower bound on `startTime` |
| `to` | — | — | Upper bound on `startTime` |

**Success — 200**
```json
{
  "events": [
    {
      "eventType": "lesson",
      "eventName": "lesson session",
      "startTime": "2026-06-17T14:23:00.000Z",
      "totalTime": 3600
    }
  ],
  "hasMore": true
}
```

`totalTime` is in **seconds** (raw from the database — the only field not converted to hours).  
Fetch the next page with `skip += limit` while `hasMore === true`.

---

### 5 — Zipcode detail

```
GET /api/analytics/zipcode?zipcode=<string>&from=YYYY-MM-DD&to=YYYY-MM-DD
```

Average engagement metrics for all students in the given zipcode, plus the platform-wide average for comparison.

**Query params**

| Param | Required | Description |
|---|---|---|
| `zipcode` | Yes | Exact zipcode string |
| `from` | No | Start of date filter |
| `to` | No | End of date filter |

**Success — 200**
```json
{
  "zipcode": "75001",
  "totalStudents": 3,
  "avgTotalTimeHours": 30.0,
  "avgGameTimeHours": 8.33,
  "avgLessonTimeHours": 8.0,
  "avgPuzzleTimeHours": 6.0,
  "avgStreakDays": 2.3,
  "globalAvgTotalTimeHours": 22.5
}
```

`globalAvgTotalTimeHours` — average across all students on the platform (same date range), used to render the comparison bars in the frontend.

**Errors**

| Status | Body |
|---|---|
| 400 | `{ "error": "zipcode is required" }` |
| 400 | `{ "error": "from must be a valid date (YYYY-MM-DD)" }` |

When `zipcode` is valid but has no students, returns a 200 with all numeric fields set to `0`.

---

### 6 — All zipcodes summary

```
GET /api/analytics/zipcode/all?from=YYYY-MM-DD&to=YYYY-MM-DD
```

One summary row per zipcode that has at least one student. Used to populate the zipcodes table. Sorted by `totalStudents` descending.

**Success — 200**
```json
[
  { "zipcode": "75001", "totalStudents": 3, "avgTotalTimeHours": 30.0 },
  { "zipcode": "30301", "totalStudents": 1, "avgTotalTimeHours": 0.0 }
]
```

Students with `zipcode: null` are excluded.

---

### 7 — Global KPIs

```
GET /api/analytics/global?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Platform-wide summary: user counts, total hours, breakdown by event type and gender.

**Success — 200**
```json
{
  "totalUsers": 4,
  "activeUsersInPeriod": 4,
  "totalHours": 90.0,
  "byEventType": {
    "gameTime": 25.0,
    "lessonTime": 24.0,
    "puzzleTime": 18.0,
    "mentorTime": 23.0
  },
  "byGender": {
    "M":       { "count": 1, "avgHours": 30.0 },
    "F":       { "count": 1, "avgHours": 30.0 },
    "Other":   { "count": 1, "avgHours": 30.0 },
    "Unknown": { "count": 1, "avgHours": 0.0 }
  }
}
```

`totalUsers` — count of all users with `role: "student"` (not filtered by date).  
`activeUsersInPeriod` — students who logged at least one non-website event in the date range.  
`byGender` — users without a `gender` field are grouped under `"Unknown"`.

---

### 8 — Global trend

```
GET /api/analytics/global/trend?months=6
```

Monthly active user count and total platform hours. Used for the trend line chart on the Global tab.

**Query params**

| Param | Default | Max |
|---|---|---|
| `months` | 6 | 24 |

**Success — 200**
```json
{
  "months":      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "activeUsers": [1, 2, 3, 3, 4, 4],
  "totalHours":  [5.0, 12.5, 45.0, 50.0, 88.0, 90.0]
}
```

All three arrays have exactly `months` entries, ordered oldest to newest.

---

## Error reference

| HTTP | When |
|---|---|
| 400 | Missing required param, invalid date format |
| 401 | No JWT or invalid/expired token |
| 403 | Valid JWT but `role !== "admin"` |
| 404 | `:username` not found in users collection |
| 429 | Rate limit exceeded (100 req / 15 min per IP) |
| 500 | Unhandled database or server error |

---

## Frontend components

| File | Calls |
|---|---|
| `Pages/Analytics/AnalyticsLayout.tsx` | Shell — tab bar, date range, admin redirect |
| `Pages/Analytics/IndividualView.tsx` | `students/search`, `student/:username` |
| `Pages/Analytics/StudentDetailPanel.tsx` | Renders profile + 8 stat cards |
| `Pages/Analytics/StudentTimeChart.tsx` | `student/:username/chart` |
| `Pages/Analytics/ActivityFeed.tsx` | `student/:username/events` (paginated) |
| `Pages/Analytics/ZipcodeView.tsx` | `zipcode/all`, `zipcode` |
| `Pages/Analytics/ZipcodeDetailPanel.tsx` | Grouped bar chart — zipcode vs platform avg |
| `Pages/Analytics/GlobalView.tsx` | `global` |
| `Pages/Analytics/TrendChart.tsx` | `global/trend` |
| `core/hooks/useAnalyticsApi.ts` | Shared fetch hook — attaches JWT from session |
| `components/Analytics/DateRangeFilter.tsx` | `from` / `to` date inputs |
| `components/Analytics/LoadingSpinner.tsx` | Loading state |
| `components/Analytics/ErrorBanner.tsx` | Error state |

**Route:** `/analytics` — guarded by `<AdminRoute>` which calls `POST /auth/validate` on mount and redirects to `/login` if the session is not an admin.

**NavBar entry point:** `components/navbar/NavBar.tsx` — renders an "Analytics" link conditionally when `role === "admin"`.

---

## Database schema additions

Three fields added to `users` (all nullable, default `null`):

```js
zipcode:    { type: String, default: null, index: true }
gender:     { type: String, enum: ["M", "F", "Other", null], default: null }
gradeLevel: { type: String, default: null }
```

Captured during signup (`SignUp.tsx`) and editable via:
```
PUT /user/profile
Body: { zipcode?, gender?, gradeLevel? }
```

Backfill existing users:
```bash
node middlewareNode/src/scripts/migrateUserFields.js
```

---

## Performance indexes

Auto-created by `db.js → ensureIndexes()` on startup (idempotent):

| Collection | Index |
|---|---|
| `timeTrackings` | `{ username: 1, startTime: -1 }` |
| `timeTrackings` | `{ startTime: -1 }` |
| `timeTrackings` | `{ eventType: 1, startTime: -1 }` |
| `users` | `{ role: 1 }` |
| `users` | `{ zipcode: 1 }` |

---

## Nightly summary cron

**File:** `middlewareNode/src/scheduler/analyticsSummaryScheduler.js`  
Runs at **02:00** daily and writes pre-computed snapshots to `analyticsSummaries`:

```js
{ type: "global",  date: Date, data: { totalUsers, byEventType, byGender, ... } }
{ type: "zipcode", zipcode: "30301", date: Date, data: { avgTotalTimeHours, ... } }
```

Live endpoints currently query MongoDB directly. The `analyticsSummaries` collection is available for future caching of the default (all-time) dashboard load.

---

## Local development

**Credentials for dev MongoDB:**
```
username: testadmin
password: password123
role:     admin
DB:       ystem_dev (local Docker only — not Atlas)
```

```bash
# Start the full dev stack
cd deploy/dev && docker-compose up -d

# Or run services directly
cd middlewareNode      && npm start   # http://localhost:8000
cd react-ystemandchess && npm start   # http://localhost:3000

# Navigate to http://localhost:3000/analytics
```

### Running tests

```bash
cd middlewareNode && npm test
```

| Suite | Tests | Covers |
|---|---|---|
| `adminGuard.test.js` | 4 | JWT guard — all role/error paths |
| `analytics.individual.test.js` | 18 | Search, profile, chart, events |
| `analytics.aggregated.test.js` | 16 | Zipcode and global, date validation |
| `analytics.security.test.js` | 6 | Real adminGuard — student/mentor/no-token/error |
| `analytics.edgecases.test.js` | 10 | Zero-activity user, null demographics, empty ranges |

### Provisioning an admin account

```bash
cd middlewareNode
ADMIN_USERNAME=youruser node src/scripts/provisionAdmin.js
```
