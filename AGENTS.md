# Contributor & Agent Conventions

Engineering conventions for working in this monorepo. Keep this discoverable and short.

## Package boundary rule (where shared vs. app-private code lives)

- **App-private UI lives in the app**, co-located with its feature folder
  (e.g. `apps/chat/frontend/src/features/composer/ui/`). Promote it to `packages/`
  only when a **second real consumer** appears (rule-of-three). A single in-app
  consumer does not earn a package boundary.
- A `packages/` boundary must earn its keep on **at least one** axis: **multi-consumer
  reuse** (≥2 real consumers or a published contract) **OR** **dependency-direction /
  layering enforcement** (a package physically cannot reach app internals).
- **Headless contracts** (`@dashway/rich-text`) and **multi-consumer design systems**
  (`@dashway/ui`) are packages by design — they earn it on reuse and/or contract.
- When you move app-private UI in-app, you lose the package's compiler-enforced layering
  wall. **Replace it with a lint boundary**, not nothing. The composer-UI module
  (`apps/chat/frontend/src/features/composer/ui/**`) is fenced by a **Biome**
  `noRestrictedImports` allowlist (root `biome.json` `overrides`): it may import only
  relative paths + `@dashway/rich-text` + `@dashway/ui`, and **no `@/*` app-internal
  imports** (e.g. `@/app`, `@/data`, `@/shared/store`). This keeps the module
  re-extractable. Biome — the repo's single linter — enforces this; **do not add ESLint.**
- The module's only public seam is its `index.ts` barrel; consumers import from
  `@/features/composer/ui`, never a subpath (tests may reach internals via relative paths).

## Linting

- Biome is the single linter (`biome check .`). Note: whole-repo `biome check .` is **not
  green today** — there is pre-existing formatting/import-order debt across apps (the same
  is true of `apps/issue_tracker/frontend`). The meaningful invariant for the composer-UI
  boundary is the **scoped `noRestrictedImports` rule passing + introducing no new
  violations**, not a clean whole-app run. Clean up debt opportunistically, not in unrelated PRs.
