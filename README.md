# QA Regression Test Manager

Next.js 15 + MongoDB QA regression testing management system.

## Quick Start

```bash
npm install
cp .env.example .env.local   # set MONGODB_URI and MONGODB_DB
npm run dev                  # http://localhost:3000
```

Free MongoDB M0 cluster: <https://cloud.mongodb.com>

## Features

- Excel `.xlsx` import with fuzzy header normalization and dedup (`uniqueKey = app::module::testCaseId`)
- Inline table editing + bulk fill (status / tester / date / version)
- Sticky tester/version defaults auto-applied on status change
- Dashboard: live metrics, donut + bar charts, tester breakdown
- PDF reports (cover, summary, details, bugs, signoff) and Excel export
- Auth, users, assignments, and version history

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

## Deploy to Vercel

Push to GitHub, import in Vercel, set `MONGODB_URI` + `MONGODB_DB`, deploy.
