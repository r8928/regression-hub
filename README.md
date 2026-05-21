# QA Regression Test Manager

QA regression testing platform with auth, role-based access, and team scoping (Radius / CB).

## Quick Start

```bash
npm install
cp .env.example .env.local          # MONGODB_URI, MONGODB_DB, NEXTAUTH_SECRET
node scripts/seed-users.mjs         # seed admin + QA accounts per team
npm run dev                         # http://localhost:3000
```

Free MongoDB M0 cluster: <https://cloud.mongodb.com>

## Tech Stack

Next.js 15 · React 18 · MongoDB 6 · NextAuth 4 · React Query 5 · TipTap 3 · Recharts · jsPDF · xlsx · bcryptjs · Tailwind CSS 3

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Set `MONGODB_URI`, `MONGODB_DB`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
4. Deploy.

## Roles

| Role      | Can do                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| **QA**    | Sign in, fill results, edit own assignments, run imports, view dashboards and reports |
| **Admin** | All QA permissions + manage users, edit settings, and restore versions                |

## User Experience

### Sign-in & Identity

- Username + password login at `/login`
- Sidebar shows signed-in name, team badge (Radius / CB), and role badge (Admin / QA)
- Sign out from the sidebar; collapse/expand sidebar for more screen space

### Dashboard

- Live metrics: total / passed / failed / blocked / pending
- Donut chart by status
- Bar chart by module
- Tester breakdown
- Drag-and-drop `.xlsx` upload tile

### Test Cases

- Inline editing: actual result, status, tester, date, version, defects, priority, Jira ID
- Rich text editing (TipTap) for steps / expected / actual / defects
- Bulk fill: apply status / tester / date / version across all pending or all visible rows in one click
- Sticky defaults: set tester + version once, auto-applied on next status change
- Filters by application, module, status, tester
- Priority and Jira ID columns

### Excel Import

- Drag-and-drop `.xlsx`
- Fuzzy header matching (case + spaces + punctuation ignored)
- Deduplicates by `app::module::testCaseId` — re-importing updates instead of duplicating

### Applications & Modules

- Browse the application registry
- View modules grouped by application

### Assignments

- Assign test cases to QA users
- Track who owns what

### Test Runs

- History of every import with timestamp and counts

### Reports

- PDF: cover page, summary, detailed results, bug report, signoff block
- Excel export: summary sheet + full results sheet

### Version History

- Snapshot the current state as a software version
- Mark a version complete
- Restore a prior version
- View per-version detail / diff

## Excel Column Headers

Auto-detected (case-insensitive, spaces/punctuation ignored):

| Field                | Accepted Headers               |
| -------------------- | ------------------------------ |
| Platform/Application | platform, application, app     |
| Module               | module, modulename             |
| Test Case ID         | testcaseid, testid, tcid       |
| Test Case            | testcase, testcasename         |
| Steps                | steps, teststeps               |
| Expected Result      | expectedresult, expected       |
| Actual Result        | actualresult, actual           |
| Status               | status                         |
| Tested By            | testedby, tester               |
| Tested On            | testedon, testdate, date       |
| Version              | softwareversiontested, version |
| Defects              | defectsimprovements, defects   |
| Priority             | priority                       |
| Jira ID              | jiraid, jira                   |
