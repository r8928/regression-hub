# Dashboard Query Performance — Design Spec

**Date:** 2026-05-24  
**Branch:** feature/RXR-11849-mui-migration  
**Jira:** RXR-11849

---

## Problem

The dashboard page is slow because of two compounding issues:

1. **Indexes not guaranteed at query time.** `ensureIndexes()` is only called from `lib/db/importExcelData.js` (during Excel import). If the server restarts or a team has never imported data, MongoDB falls back to collection scans on every dashboard load.

2. **Missing indexes on three collections.** `applications`, `modules`, and `teamSettings` have no `{ teamId: 1 }` query index. `testCases` has no `{ teamId: 1, status: 1 }` index to cover the `$facet` aggregate's status reads.

3. **No result caching.** Every page load executes all 4 DB operations against MongoDB, even though dashboard summary data is acceptable stale for up to 60 seconds.

---

## Approach

Approach C: fix indexes **and** add query-result caching. Indexes make cold/cache-miss queries fast; caching means most requests skip MongoDB entirely.

---

## Section 1 — Index Fixes

### New indexes (`lib/indexes.js`)

| Collection     | Index                      | Rationale                                           |
| -------------- | -------------------------- | --------------------------------------------------- |
| `testCases`    | `{ teamId: 1, status: 1 }` | Covers the `$facet` aggregate's per-status grouping |
| `applications` | `{ teamId: 1 }`            | Serves `find({ teamId })` directly                  |
| `modules`      | `{ teamId: 1 }`            | Serves `find({ teamId })` directly                  |
| `teamSettings` | `{ teamId: 1 }`            | Serves `findOne({ teamId })` directly               |

Existing indexes are preserved. The new `{ teamId: 1, status: 1 }` index is additive alongside the existing `{ teamId: 1, createdAt: 1 }`.

### Startup guarantee (`lib/mongodb.js`)

`ensureIndexes(db)` is called inside `getDb()` on the first successful connection — before any query ever runs. To avoid a circular import (`indexes.js` currently imports `getDb`), the signature of `ensureIndexes` changes to accept a `db` parameter directly, removing its own `getDb()` call.

```js
// lib/indexes.js — new signature
export async function ensureIndexes(db) { ... }

// lib/mongodb.js — called once, on first connection
import { ensureIndexes } from './indexes';
// inside getDb(), after db is acquired:
await ensureIndexes(db);
```

---

## Section 2 — Query-Result Caching

### Signature change

`getDashboardData` and `getDashboardSettings` currently accept `db` as their first argument. `unstable_cache` serializes function arguments as cache keys, and a live MongoDB `db` object cannot be serialized. The fix: move `getDb()` inside each function body, removing `db` from their signatures.

```js
// before
export async function getDashboardData(db, teamId, applicationId = '') { ... }

// after
export async function getDashboardData(teamId, applicationId = '') {
  const db = await getDb();
  ...
}
```

### Cache wrapper

Both functions are wrapped with `unstable_cache`:

- **Cache key:** `['dashboard-data', teamId]` and `['dashboard-settings', teamId]`
- **TTL:** 60 seconds (`revalidate: 60`)
- **Tags:** `dashboard-${teamId}` — enables targeted invalidation if needed in the future

```js
import { unstable_cache } from 'next/cache';

export const getDashboardData = unstable_cache(
  async (teamId, applicationId = '') => {
    /* body */
  },
  ['dashboard-data'],
  { revalidate: 60 },
);

export const getDashboardSettings = unstable_cache(
  async (teamId) => {
    /* body */
  },
  ['dashboard-settings'],
  { revalidate: 60 },
);
```

---

## Section 3 — Caller Updates

### `app/(app)/dashboard/page.js`

- Remove `import { getDb }` and the `const db = await getDb()` call
- Update both function calls: `getDashboardData(teamId)` and `getDashboardSettings(teamId)` (no `db` argument)
- Add `export const dynamic = 'force-dynamic'` (CLAUDE.md requirement for pages that use `router.refresh()`)

### `app/api/dashboard/route.js`

- Remove `db` argument from `getDashboardData` call to match new signature
- Verify the route does not re-check `!session` (CLAUDE.md API auth rule)

---

## Files Changed

| File                          | Change                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `lib/indexes.js`              | Accept `db` param; add 4 new indexes                        |
| `lib/mongodb.js`              | Call `ensureIndexes(db)` on first connection                |
| `lib/db/dashboardData.js`     | Move `getDb()` inside functions; wrap with `unstable_cache` |
| `app/(app)/dashboard/page.js` | Remove `db` param; add `force-dynamic`                      |
| `app/api/dashboard/route.js`  | Remove `db` param from `getDashboardData` call              |

---

## Out of Scope

- Streaming / Suspense boundaries (perceived load time is not the reported problem)
- Deduplicating `getServerSession` across layout + page (JWT-only, no DB cost)
- `$limit` in the aggregate pipeline (`.slice(0, 20)` is fine at JS level for current data sizes)
- Cache invalidation on data mutation (60 s TTL covers this; active invalidation can be added later)
