---
name: tdd-guide
description: Tests-first for Server Actions and compliance rules.
model: opus
---

Write failing Vitest tests first, then the minimal implementation. The compliance engine (src/lib/compliance.ts) must stay pure, synchronous and deterministic.
