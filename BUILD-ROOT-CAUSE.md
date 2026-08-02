# Build Root Cause Analysis

## Symptom

`dist/` contained only `.d.ts` (declaration) files. No `.js` files were present.

- `dist/app.module.d.ts` existed
- `dist/app.module.js` did NOT exist
- `dist/main.js` did NOT exist
- `pnpm --filter @tradingo/api build` exited with code 0 (success) but produced zero `.js` output

## Investigation

### Configuration Files Audited

| File | Status |
|------|--------|
| `apps/api/tsconfig.json` | `incremental: true` present |
| `apps/api/tsconfig.build.json` | Does not exist |
| `apps/api/nest-cli.json` | `deleteOutDir: true` present |
| `apps/api/package.json` | `build: "nest build"` |
| Root `tsconfig.json` | Does not exist |
| `pnpm-workspace.yaml` | `apps/*`, `packages/*` |

### Discovery

Running `npx tsc --project tsconfig.json` with a clean `dist/` produced:

```
Exit code: 0
=== dist content ===
(empty directory does not exist)
```

Zero files emitted. Exit code 0. No errors.

Running `tsc --noEmit --project tsconfig.json` also passed with exit code 0 — confirming zero compilation errors.

### The Clue

After deleting `tsconfig.tsbuildinfo` (the incremental build cache file), `tsc` immediately produced all `.js` files:

```
dist/main.js          ✅
dist/app.module.js    ✅
dist/config/app.config.js  ✅
```

## Root Cause

**`incremental: true` in `tsconfig.json` + stale `tsconfig.tsbuildinfo` + `deleteOutDir: true` = zero emitted files.**

### Execution sequence on second build:

1. `nest build` runs with `deleteOutDir: true`
2. `deleteOutDir` deletes `apps/api/dist/` — **but NOT `tsconfig.tsbuildinfo`** (it's outside the outDir)
3. `tsc` starts with `incremental: true`
4. `tsc` reads `tsconfig.tsbuildinfo` — the cache says "all files up to date, last built at timestamp X"
5. Source files have not changed since that timestamp
6. `tsc` decides: **nothing to emit**
7. Output: zero `.js` files. Exit code: 0.

### Why the first build worked:

On a clean checkout, `tsconfig.tsbuildinfo` does not exist. `tsc` builds everything from scratch. After the build, `tsconfig.tsbuildinfo` is written. On the **second** build, the stale cache causes zero output.

### Why `deleteOutDir` doesn't help:

`nest-cli.json`:
```json
{
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

`deleteOutDir` targets the compiler's `outDir` (`./dist`). The `.tsbuildinfo` file lives at the project root (`apps/api/tsconfig.tsbuildinfo`), not inside `dist/`, so it is never cleaned.

## Timeline

1. Phase P1: First `pnpm build` succeeds (no `.tsbuildinfo` cache yet) → API runs
2. Phase P1 (second build during OAuth fix): `pnpm build` deletes `dist/`, keeps `.tsbuildinfo` → zero `.js` emitted
3. Present: Build broken — all subsequent `pnpm build` commands produce zero output
