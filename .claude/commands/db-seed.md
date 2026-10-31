---
description: Seed the database (compliance-gated)
model: opus
---
Run `npx prisma db seed`. The seed aborts if any recipe fails validateRawCompliance. Report the violations verbatim if it does.
