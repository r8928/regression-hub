# Regression Hub Rules

- DO NOT bloat README.md — every line must prevent a concrete mistake; cut anything that doesn't
- DO NOT implement a feature before updating README.md — treat it as the spec-first feature list
- DO NOT commit without a Jira ID prefix (e.g. "RXR-1234: <message>")
- DO NOT inline JSX blocks, hook logic, or utility patterns that duplicate an existing implementation in another page file; extract to `components/`, `hooks/`, or `utils/` before the second use
- DO NOT redefine a function locally if it is already exported from utils/; import from the shared module instead
- when writing utils, hooks, or components, invoke /superpowers:test-driven-development before writing implementation code
