---
name: feedback-prettier
description: Prettier config file should use .config.mjs extension and semi: true
metadata:
  type: feedback
---

Use `prettier.config.mjs` (not `.prettierrc` or `.prettierrc.json`) for Prettier configuration. Set `semi: true`.

**Why:** User corrected both choices when I used `.prettierrc` with `semi: false`.

**How to apply:** Any time Prettier config is created or edited — use the `.config.mjs` extension and keep semicolons on.
