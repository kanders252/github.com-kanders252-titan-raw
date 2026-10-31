---
description: Full quality gate (Sonnet 5.5)
model: sonnet
---
Run in order and fix failures before reporting done:
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. `npx vitest run`
5. `npx playwright test`
