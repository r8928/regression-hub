# Regression Hub Rules

## Auth and Session

- DO NOT call `useSession()` in `(app)` page files; `page.js` must call `getServerSession` and pass `session.user` as a prop to a sibling `*Client.jsx` leaf
- DO NOT check `user.role` via `useSession()` in components; all role guards belong at SSR level — `page.js` redirects unauthorized roles via `getServerSession` + `redirect()`, and role-dependent UI receives `user.role` as a prop from the SSR page (pattern: `/users` page redirects non-admins; `ADMIN_NAV` visibility must follow the same prop-driven model, not `useSession()`)

## Documentation and Spec Discipline

- DO NOT bloat README.md — every line must prevent a concrete mistake; cut anything that doesn't
- DO NOT implement a feature before updating README.md — treat it as the spec-first feature list

## Git and Commit Hygiene

- DO NOT commit without a Jira ID prefix (e.g. "RXR-1234: <message>")

## Reuse and Code Organization

- DO NOT inline JSX blocks, hook logic, or utility patterns that duplicate an existing implementation in another page file; extract to `components/`, `hooks/`, or `utils/` before the second use
- DO NOT redefine a function locally if it is already exported from utils/; import from the shared module instead
- DO NOT set font-family outside app/globals.css; self-host via app/fonts.js (next/font/google), no CDN links, no inline fontFamily props

## Testing Scope and Minimum Coverage

- DO NOT test AWS SDK/framework internals, platform wiring, private methods, call order, or runtime-owned config; if a behavior-preserving refactor breaks a test, the test is wrong — delete or fix it
- when writing unit tests, cover at minimum: valid input → expected output, invalid input → specific error, dependency failure → handled error, one edge case per unit; mock AWS SDKs, network calls, databases, ConfigService env vars, and framework APIs

## Superpowers Workflow

- when writing utils, hooks, or components, invoke /test-driven-development before writing implementation code
