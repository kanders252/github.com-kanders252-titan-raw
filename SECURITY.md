# Security policy

Report vulnerabilities privately through GitHub → Security → "Report a vulnerability". Do not open a public issue.

## Practices in this repo
- Secrets live only in Vercel and GitHub environment settings, never in git. `.env` is gitignored, and only `.env.example` is committed.
- The dev-login provider is impossible outside `NODE_ENV=development` on localhost (`src/lib/dev-login.ts`, unit-tested).
- CI runs with `contents: read` only. CodeQL (security-extended) runs on every PR and weekly.
- Dependabot opens weekly update PRs for npm and GitHub Actions.
- Database migrations are never run automatically on deploy (see README).
